from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "")

# Lazy engine initialization
_engine = None
_SessionLocal = None

def get_engine():
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        if not SQLALCHEMY_DATABASE_URL:
            raise ValueError("DATABASE_URL environment variable is not set")
        _engine = create_engine(SQLALCHEMY_DATABASE_URL)
    return _engine

def get_session_local():
    """Get or create the session maker."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

# Create a lazy proxy for backward compatibility
class _EngineLazyProxy:
    def __getattr__(self, name):
        return getattr(get_engine(), name)
    
    def connect(self):
        return get_engine().connect()

engine = _EngineLazyProxy()

Base = declarative_base()

def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
