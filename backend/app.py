"""
Mindscribe – FastAPI Application Entry Point
Run with: uvicorn app:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.session import engine
from models.entity import Base

# Routers
from routers import auth, notes, clusters, messages, users

# ── DB bootstrap ────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Mindscribe API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Route registration ────────────────────────────────────────────────────────
app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(notes.router,    prefix="/api/notes",    tags=["Notes"])
app.include_router(clusters.router, prefix="/api/clusters", tags=["Clusters"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(users.router,    prefix="/api/users",    tags=["Users"])

allow_origins=["http://localhost:5173"]


@app.get("/api/health")
def health():
    return {"status": "ok"}