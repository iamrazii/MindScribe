from typing import List
from langchain_huggingface import HuggingFaceEmbeddings
from core.config import settings

class EmbeddingService:
    def __init__(self):
        # running local mebedidng model
        self.model = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL_NAME,
            model_kwargs={'device': 'cpu'} 
        )
        
    def encode_documents(self, chunks: List[str]) -> List[List[float]]:

        return self.model.embed_documents(chunks)

    def embed_query(self, query: str) -> List[float]:

        return self.model.embed_query(query)

# instance
embedding_service = EmbeddingService()