from db.session import engine
from sqlalchemy import text

def add_profile_picture_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture_url TEXT;"))
            conn.commit()
            print("Successfully added profile_picture_url column.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    add_profile_picture_column()
