from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    DATABASE_URL: str
    
    # AI Settings
    HF_TOKEN: str
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    # Primary LLM provider: Groq LLaMA 70B by default
    LLM_MODEL_NAME: str = "llama3-70b-8192"
    GROQ_API_KEY: str

    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

# Global settings instance
settings = Settings()