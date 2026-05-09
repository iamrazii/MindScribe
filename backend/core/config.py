from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    DATABASE_URL: str

    # AI Settings
    HF_TOKEN: str
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    LLM_MODEL_NAME: str = "llama-3.3-70b-versatile"
    GROQ_API_KEY: str

    # ── JWT / Auth ─────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24   # 24 hours

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Global settings instance
settings = Settings()