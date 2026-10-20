import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("kidney_ai.database")

# Database URL configuration (Supports SQLite default or PostgreSQL on Render/Neon/Supabase)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kidney_ai.db")

# Normalize legacy postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine arguments based on DB dialect
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}


def build_engine(url: str):
    return create_engine(
        url,
        connect_args=connect_args,
        pool_pre_ping=True
    )


try:
    engine = build_engine(DATABASE_URL)
except Exception as e:
    # If psycopg dialect fails or is missing, attempt fallback to alternate postgresql driver
    if "psycopg" in str(e).lower() and ("postgresql://" in DATABASE_URL or "postgresql+" in DATABASE_URL):
        if "postgresql+psycopg://" in DATABASE_URL:
            fallback_url = DATABASE_URL.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
        elif "postgresql+psycopg2://" in DATABASE_URL:
            fallback_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
        else:
            fallback_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

        logger.warning(f"Driver connection failed with initial dialect ({e}). Retrying with fallback: {fallback_url.split('@')[-1]}")
        engine = build_engine(fallback_url)
    else:
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates database tables if they do not exist."""
    Base.metadata.create_all(bind=engine)
