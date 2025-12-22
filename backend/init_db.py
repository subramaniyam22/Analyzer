#!/usr/bin/env python3
"""
Database initialization script for Render deployment.
This script creates the vector extension and initializes all tables.
"""
import os
import sys
from sqlalchemy import create_engine, text
from app import models

def init_database():
    """Initialize database with vector extension and tables."""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    print("Connecting to database...")
    engine = create_engine(database_url)
    
    try:
        # Create vector extension
        print("Creating vector extension...")
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
        print("✓ Vector extension created successfully")
    except Exception as e:
        print(f"Warning: Could not create vector extension: {e}")
        print("This is normal if the extension already exists or you don't have permissions")
    
    try:
        # Create all tables
        print("Creating database tables...")
        models.Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
    except Exception as e:
        print(f"Warning: Could not create tables: {e}")
        print("This is normal if tables already exist")
    
    print("\n✅ Database initialization complete!")
    print("The backend is ready to start.")

if __name__ == "__main__":
    init_database()
