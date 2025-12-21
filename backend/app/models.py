from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="user") # super_admin, admin, user
    is_active = Column(Boolean, default=True)
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    token = Column(String, unique=True)
    expires_at = Column(DateTime)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String)
    region = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="projects")
    organizations = relationship("Organization", back_populates="project", cascade="all, delete-orphan")
    uploads = relationship("Upload", back_populates="project")
    results = relationship("AnalysisResult", back_populates="project")

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_base = Column(Boolean, default=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    project = relationship("Project", back_populates="organizations")
    extracted_data = Column(JSON) # Normalized structure

class Upload(Base):
    __tablename__ = "uploads"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String)
    size = Column(Integer)
    s3_key = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, processing, completed, failed
    project_id = Column(Integer, ForeignKey("projects.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    project = relationship("Project", back_populates="uploads")
    chunks = relationship("ExtractedChunk", back_populates="upload")

class ExtractedChunk(Base):
    __tablename__ = "extracted_chunks"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536)) # Assuming OpenAI embeddings
    metadata_json = Column(JSON) # source info, page, etc.
    upload_id = Column(Integer, ForeignKey("uploads.id"))

    upload = relationship("Upload", back_populates="chunks")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    version = Column(Integer, default=1)
    results_json = Column(JSON) # Side-by-side, recommendations, scores
    constraints = Column(JSON) # budget, tech stack etc for refinement
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="results")
    feedback = relationship("Feedback", back_populates="result")

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("analysis_results.id"))
    recommendation_id = Column(String) # ID within results_json
    rating = Column(Integer) # 1 or -1
    comment = Column(String)
    status = Column(String) # implemented, not implemented
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    result = relationship("AnalysisResult", back_populates="feedback")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    role = Column(String) # user, assistant
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
