from langchain_huggingface import HuggingFaceEndpointEmbeddings

from core.config import settings

class EmbeddingService:
    def __init__(self):
        # Dynamically sets model from .env
        self.model = HuggingFaceEndpointEmbeddings( model=settings.EMBEDDING_MODEL_NAME,
    huggingfacehub_api_token=settings.HF_TOKEN)
        
    def encode(self, text: str): # need custom script to make it appropiate for langchain
        return self.model.encode(text).tolist()

# Single instance to be reused across the app
embedding_service = EmbeddingService()