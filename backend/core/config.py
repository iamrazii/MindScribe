from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    DATABASE_URL: str
    
    # AI Settings
    HF_API_KEY: str
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    LLM_MODEL_NAME: str = "gpt-4o"

    model_config = SettingsConfigDict(env_file=".env")

# Global settings instance
settings = Settings()