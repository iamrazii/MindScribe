from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import settings
from .embedding import embedding_service

class ChatService:
    def __init__(self):
        # Assigns the LLM model from settings
        self.llm = ChatGoogleGenerativeAI(model=settings.LLM_MODEL_NAME, 
            google_api_key=settings.GOOGLE_API_KEY,temperature=1.0)
        self.embedder = embedding_service

    def get_answer(self, query: str, db_context: str):
        # Your LangChain RAG logic here...
        pass