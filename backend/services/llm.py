from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import settings
from .embedding import embedding_service

class ChatService:
    def __init__(self):
        # Initialize Groq chat model
        self.llm = ChatGroq(
            model=settings.LLM_MODEL_NAME, 
            api_key=settings.GROQ_API_KEY, 
            temperature=0.7
        )
        self.embedder = embedding_service

        # 1. Create a ChatPromptTemplate to separate instructions from user input
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an assistant that answers user questions using the provided context. "
                       "Only use the information in the context to answer. If the answer is not present, "
                       "reply that you don't know.\n\nContext:\n{context}"),
            ("human", "{query}")
        ])

        # 2. Use StrOutputParser to automatically extract the string from the LLM's response object
        self.output_parser = StrOutputParser()

        # 3. Build the LCEL Chain (Prompt -> LLM -> Output Parser)
        self.chain = self.prompt | self.llm | self.output_parser

    def get_answer(self, query: str, retrieved_chunks: list[dict]) -> str:
        """Generate an answer from Groq LLM given a list of retrieved chunks and a user query."""
        
        # Build context from retrieved chunks
        context_parts = []
        for c in retrieved_chunks:
            source = c.get("source")
            content = c.get("content", "")
            if source:
                context_parts.append(f"Source: {source}\n{content}")
            else:
                context_parts.append(content)

        context_text = "\n\n".join(context_parts) if context_parts else ""

        try:
            # 4. Invoke the chain with your dictionary of variables
            response = self.chain.invoke({
                "context": context_text,
                "query": query
            })
            return response
            
        except Exception as e:
            return f"LLM generation error: {e}"