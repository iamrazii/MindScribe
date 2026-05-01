from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import settings
from .embedding import embedding_service


class ChatService:
    def __init__(self):
        # ── Core LLM (Groq LLaMA 70B) ──────────────────────────────────────
        self.llm = ChatGroq(
            model=settings.LLM_MODEL_NAME,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
        )
        self.embedder = embedding_service
        self.output_parser = StrOutputParser()

        # ── Chain 1: RAG Q&A ────────────────────────────────────────────────
        # Answers a specific, pointed question using retrieved context.
        self._qa_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an assistant that answers user questions using the provided context.\n"
                "Only use the information in the context to answer.\n"
                "If the answer is not present in the context, reply that you don't know.\n\n"
                "Context:\n{context}",
            ),
            ("human", "{query}"),
        ])
        self.qa_chain = self._qa_prompt | self.llm | self.output_parser

        # ── Chain 2: Topic Summarization ────────────────────────────────────
        self._summarization_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a knowledge synthesis assistant. "
                "Your job is to read a user's personal notes and produce a clear, "
                "well-structured summary on the topic they request.\n\n"
                "Guidelines:\n"
                "- Synthesize information ACROSS all provided sources — do not just list them\n"
                "- Use markdown headers (##) to organize distinct sub-topics if they emerge\n"
                "- After each key insight or claim, cite its origin inline: (Source: <note title>)\n"
                "- Identify and surface recurring themes or contradictions between notes\n"
                "- Do NOT fabricate information absent from the notes\n"
                "- End with a brief 'Key Takeaways' section (3–5 bullet points)\n\n"
                "Notes:\n{context}",
            ),
            ("human", "Please summarize my notes on the topic: {topic}"),
        ])
        self.summarization_chain = (
            self._summarization_prompt | self.llm | self.output_parser
        )

    # ── Public Method 1: Q&A ────────────────────────────────────────────────
    def get_answer(self, query: str, retrieved_chunks: list[dict]) -> str:
        """
        Generate a pointed answer from retrieved chunks.
        Retrieved chunks: [{"content": str, "source": str}, ...]
        """
        context_text = self._build_context(retrieved_chunks)
        if not context_text:
            return "I could not find any relevant notes to answer your question."

        try:
            return self.qa_chain.invoke({"context": context_text, "query": query})
        except Exception as e:
            return f"LLM generation error: {e}"

    # ── Public Method 2: Summarization ─────────────────────────────────────
    def summarize_notes(self, topic: str, retrieved_chunks: list[dict]) -> str:
        """
        Synthesize retrieved note chunks into a structured topic summary.

        Args:
            topic:            The user's requested topic (e.g. "machine learning").
            retrieved_chunks: List of dicts [{"content": str, "source": str}, ...]
                              — typically from retrieve_chunks_for_summary() in crud/notes.py.

        Returns:
            A markdown-formatted summary string, or an informative fallback message.
        """
        if not retrieved_chunks:
            return (
                f"No notes found related to '{topic}'. "
                "Try adding some notes on this topic first."
            )

        context_text = self._build_context_for_summary(retrieved_chunks)

        try:
            return self.summarization_chain.invoke(
                {"context": context_text, "topic": topic}
            )
        except Exception as e:
            return f"Summarization error: {e}"

    # ── Private Helpers ─────────────────────────────────────────────────────
    def _build_context(self, chunks: list[dict]) -> str:
        """
        Builds a flat context string for Q&A.
        Format: 'Source: <title>\n<content>'
        """
        parts = []
        for chunk in chunks:
            source = chunk.get("source", "").strip()
            content = chunk.get("content", "").strip()
            if not content:
                continue
            header = f"Source: {source}" if source else "Source: Unknown"
            parts.append(f"{header}\n{content}")

        return "\n\n".join(parts)

    def _build_context_for_summary(self, chunks: list[dict]) -> str:
        # Group chunks by source note title
        grouped: dict[str, list[str]] = {}
        for chunk in chunks:
            source = chunk.get("source", "Unknown Note").strip()
            content = chunk.get("content", "").strip()
            if not content:
                continue
            grouped.setdefault(source, []).append(content)

        if not grouped:
            return ""

        parts = []
        for note_title, contents in grouped.items():
            note_block = f"### Note: {note_title}\n" + "\n".join(contents)
            parts.append(note_block)

        return "\n\n---\n\n".join(parts)