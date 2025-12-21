from worker.celery_app import celery_app
from worker.extraction import extract_content
from app.database import SessionLocal
from app import models
from app.openai_client import openai_client
from common.s3_utils import S3Service
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()

import os

# Using the imported openai_client from app.openai_client

def get_embedding(text):
    text = text.replace("\n", " ")
    return openai_client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding

@celery_app.task(name="process_document")
def process_document(upload_id: int):
    db = SessionLocal()
    try:
        upload = db.query(models.Upload).filter(models.Upload.id == upload_id).first()
        if not upload:
            return "Upload not found"
        
        upload.status = "processing"
        db.commit()
        
        s3 = S3Service()
        # Download file from S3
        # Since we're in a shared filesystem in some cases, or need to download to memory
        # For simplicity, download to memory
        bucket_name = os.getenv("MINIO_BUCKET_NAME")
        response = s3.s3_client.get_object(Bucket=bucket_name, Key=upload.s3_key)
        file_bytes = response['Body'].read()
        
        # Extract content
        text_content = extract_content(file_bytes, upload.content_type, upload.filename)
        
        # Chunking
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_text(text_content)
        
        # Embed and Store
        for i, chunk_text in enumerate(chunks):
            embedding = get_embedding(chunk_text)
            db_chunk = models.ExtractedChunk(
                content=chunk_text,
                embedding=embedding,
                metadata_json={"page": i+1, "filename": upload.filename},
                upload_id=upload.id
            )
            db.add(db_chunk)
        
        upload.status = "completed"
        db.commit()
        print(f"Finished processing for upload {upload_id}")
        return {"status": "completed", "upload_id": upload_id}
        
    except Exception as e:
        print(f"Error processing document: {e}")
        if upload:
            upload.status = "failed"
            db.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()
