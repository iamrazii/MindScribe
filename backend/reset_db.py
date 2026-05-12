from sqlalchemy import text
from db.session import engine
from models.entity import Base

def reset_database():
    print("Wiping existing database schema...")
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    
    print("Recreating tables with updated models...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully!")

if __name__ == "__main__":
    reset_database()