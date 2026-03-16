from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True) # why 2nd parameter ?

@event.listens_for(engine, "connect")
def provide_vector_extension(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector") # toggling vecotr extension
    cursor.close()

SessionLocal = sessionmaker(bind=engine) # getting session to db 

# Dependency to get DB session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()