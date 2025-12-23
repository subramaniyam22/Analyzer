from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, database, auth
from app.database import engine, get_db
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, check_role
from common.s3_utils import S3Service
from worker.tasks import process_document
from app.analysis import generate_analysis
from app.openai_client import openai_client
from typing import Optional
import uuid
import os
import json
from datetime import datetime, timedelta

from sqlalchemy import text

app = FastAPI(title="Analyzer API")

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "analyzer-backend"}

# Lazy database initialization - only runs on first database access
_db_initialized = False

def ensure_db_initialized():
    """Ensure database is initialized. Called before first database operation."""
    global _db_initialized
    if _db_initialized:
        return
    
    try:
        print("Initializing database...")
        # Create vector extension
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                conn.commit()
            print("✓ Vector extension ready")
        except Exception as e:
            print(f"⚠ Vector extension: {str(e)[:100]}")
        
        # Create tables
        try:
            models.Base.metadata.create_all(bind=engine)
            print("✓ Database tables ready")
        except Exception as e:
            print(f"⚠ Database tables: {str(e)[:100]}")
        
        _db_initialized = True
        print("✅ Database initialized")
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)[:200]}")
        # Don't set _db_initialized = True, so it will retry on next request

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ROUTES ---

@app.post("/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Initialize database on first registration attempt
    ensure_db_initialized()
    
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # If it's the first user, make them a super_admin
    user_count = db.query(models.User).count()
    role = "super_admin" if user_count == 0 else user.role

    hashed_pw = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pw,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/auth/forgot-password")
def forgot_password(request: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}
    
    token = str(uuid.uuid4())
    reset_token = models.PasswordResetToken(
        email=request.email,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db.add(reset_token)
    db.commit()
    # In a real app, send email here. For now, return token
    return {"message": "Reset token generated", "token": token}

@app.post("/auth/reset-password")
def reset_password(req: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    reset_obj = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == req.token,
        models.PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    if not reset_obj:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user = db.query(models.User).filter(models.User.email == reset_obj.email).first()
    user.hashed_password = get_password_hash(req.new_password)
    db.delete(reset_obj)
    db.commit()
    return {"message": "Password updated successfully"}

# --- USER MANAGEMENT (RBAC) ---

@app.get("/users", response_model=List[schemas.User])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_role(["super_admin", "admin"]))
):
    if current_user.role == "super_admin":
        return db.query(models.User).all()
    # Admin can see all users but not super_admins
    return db.query(models.User).filter(models.User.role != "super_admin").all()

@app.post("/users", response_model=schemas.User)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_role(["super_admin", "admin"]))
):
    if current_user.role == "admin" and user_in.role != "user":
        raise HTTPException(status_code=403, detail="Admins can only create regular users")
    
    from fastapi.responses import JSONResponse
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        return JSONResponse(status_code=200, content={"error": "Email already registered"})
    
    hashed_pw = get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.patch("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Permission checks
    if current_user.id != target_user.id:
        if current_user.role not in ["super_admin", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_user.role == "admin" and target_user.role == "super_admin":
            raise HTTPException(status_code=403, detail="Admins cannot update super admins")

    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for key, value in update_data.items():
        setattr(target_user, key, value)
    
    db.commit()
    db.refresh(target_user)
    return target_user

# --- PROJECT ROUTES ---

@app.post("/projects", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_project = models.Project(
        name=project.name,
        industry=project.industry,
        region=project.region,
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Add Organizations
    base_org = models.Organization(**project.base_org.dict(), project_id=db_project.id)
    db.add(base_org)
    for comp in project.competitors:
        comp_org = models.Organization(**comp.dict(), project_id=db_project.id)
        db.add(comp_org)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects", response_model=List[schemas.Project])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "super_admin":
        return db.query(models.Project).all()
    return db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()

# (Keep upload, run-analysis, results, and chat routes, but add auth dependencies)

@app.post("/uploads/{project_id}/{org_id}")
async def upload_file(
    project_id: int, 
    org_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify ownership
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or (project.owner_id != current_user.id and current_user.role != "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    s3 = S3Service()
    s3.create_bucket_if_not_exists()
    
    file_id = str(uuid.uuid4())
    s3_key = f"{project_id}/{org_id}/{file_id}_{file.filename}"
    s3.upload_fileobj(file.file, s3_key)
    
    db_upload = models.Upload(
        filename=file.filename,
        content_type=file.content_type,
        size=0,
        s3_key=s3_key,
        project_id=project_id,
        organization_id=org_id,
        status="pending"
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    process_document.delay(db_upload.id)
    return db_upload

@app.post("/projects/{project_id}/run-analysis")
def run_analysis(
    project_id: int, 
    constraints: Optional[dict] = None, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or (project.owner_id != current_user.id and current_user.role != "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    result = generate_analysis(project_id, db, constraints)
    return result

@app.get("/projects/{project_id}/results")
def get_results(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or (project.owner_id != current_user.id and current_user.role != "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    result = db.query(models.AnalysisResult).filter(models.AnalysisResult.project_id == project_id).order_by(models.AnalysisResult.version.desc()).first()
    if not result:
        return None
    return result

@app.post("/projects/{project_id}/chat")
async def chat(
    project_id: int, 
    message: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or (project.owner_id != current_user.id and current_user.role != "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1. Retrieve RAG Context (Chunks)
    try:
        query_embedding = openai_client.embeddings.create(input=[message], model="text-embedding-3-small").data[0].embedding
        results = db.query(models.ExtractedChunk).join(models.Upload).filter(
            models.Upload.project_id == project_id
        ).order_by(models.ExtractedChunk.embedding.l2_distance(query_embedding)).limit(5).all()
        rag_context = "\n".join([f"- {r.content}" for r in results])
    except Exception as e:
        print(f"Embedding failed: {e}")
        rag_context = "Context unavailable due to AI service limit."

    # 2. Retrieve Latest Analysis Result
    analysis_result = db.query(models.AnalysisResult).filter(
        models.AnalysisResult.project_id == project_id
    ).order_by(models.AnalysisResult.version.desc()).first()
    
    analysis_context = ""
    if analysis_result:
        analysis_context = f"\n\nLATEST ANALYSIS RESULT:\n{json.dumps(analysis_result.results_json, indent=2)}"

    # 3. Construct System Prompt
    system_instruction = f"""You are an intelligent assistant for this analysis project.
    
    CONTEXT FROM DOCUMENTS:
    {rag_context}
    
    {analysis_context}
    
    INSTRUCTIONS:
    - Use the 'LATEST ANALYSIS RESULT' to answer questions about recommendations, confidence scores, and comparisons.
    - If the user asks to validate or refine the output, explain the reasoning based on the 'results_json' or suggest they use the 'Refine Analysis' button for structural changes.
    - Use 'CONTEXT FROM DOCUMENTS' to verify specific claims or provide raw evidence.
    """

    history = db.query(models.ChatMessage).filter(models.ChatMessage.project_id == project_id).order_by(models.ChatMessage.created_at.asc()).all()
    
    msg_list = [{"role": "system", "content": system_instruction}]
    for msg in history:
        msg_list.append({"role": msg.role, "content": msg.content})
    msg_list.append({"role": "user", "content": message})
    
    try:
        response = openai_client.chat.completions.create(model="gpt-4o", messages=msg_list)
        answer = response.choices[0].message.content
    except Exception as e:
        # Smart Fallback: Use analysis data if available to simulate a response
        if analysis_result and "recommendations" in analysis_result.results_json:
            rec = analysis_result.results_json["recommendations"][0]
            answer = f"**Simulated Response (Offline Mode):**\n\nBased on your strategy report, I highly recommend you focus on **{rec['title']}**. This is a high-impact area with {rec['confidence']}% confidence.\n\n(Note: Live AI reasoning is currently unavailable, providing insights from cached analysis.)"
        else:
            answer = "I'm currently operating in offline mode. Please check your network or API quota. I can still help you review the static report on the dashboard."

    db.add(models.ChatMessage(project_id=project_id, role="user", content=message))
    db.add(models.ChatMessage(project_id=project_id, role="assistant", content=answer))
    db.commit()
    return {"answer": answer}
