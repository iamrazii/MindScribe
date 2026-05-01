from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import settings
from .embedding import embedding_service


class ChatService:
    def __init__(self):

        # ── Core LLM (Groq LLaMA 70B) — used by Q&A and Summarization ──────
        # temperature=0.7: balanced creativity for generative tasks
        self.llm = ChatGroq(
            model=settings.LLM_MODEL_NAME,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
        )
        self.embeddingService = embedding_service
        self.outputParser = StrOutputParser()

        # ── Chain 1: RAG Q&A ─────────────────────────────────────────────────
        # Answers a specific, pointed question using retrieved chunk context.
        self._qaPrompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an assistant that answers user questions using the provided context.\n"
                "Only use the information in the context to answer.\n"
                "If the answer is not present in the context, reply that you don't know.\n\n"
                "Context:\n{context}",
            ),
            ("human", "{query}"),
        ])
        self.qaChain = self._qaPrompt | self.llm | self.outputParser

        # ── Chain 2: Topic Summarization ──────────────────────────────────────
        # Synthesizes multiple notes on a topic into a structured overview.
        self._summarizationPrompt = ChatPromptTemplate.from_messages([
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
        self.summarizationChain = (
            self._summarizationPrompt | self.llm | self.outputParser
        )

        # ── Chain 3: Note Critic ──────────────────────────────────────────────
        # Evaluates a SINGLE note and returns structured, scored feedback.
        #
        # Why a separate LLM instance?
        # Critic output must be precise, repeatable, and structured.
        # temperature=0.3 suppresses hallucinated scores and keeps the
        # five-dimension breakdown consistent across repeated evaluations
        # of the same note. Sharing the 0.7-temp LLM would produce
        # inconsistent scores on identical inputs.
        self._critic_llm = ChatGroq(
            model=settings.LLM_MODEL_NAME,
            api_key=settings.GROQ_API_KEY,
            temperature=0.3,
        )
        self._criticPrompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an expert note reviewer and personal knowledge coach. "
                "Your job is to evaluate a user's personal note and return "
                "honest, structured, and actionable feedback.\n\n"

                "Evaluate the note strictly across these five dimensions:\n\n"

                "1. **Clarity** — Is the writing clear and easy to follow? "
                "Flag vague sentences, undefined jargon, or confusing phrasing.\n\n"

                "2. **Completeness** — Does the note fully cover its apparent topic? "
                "Identify missing context, undefined terms, or unexplained assumptions "
                "that would confuse the user when they re-read this note later.\n\n"

                "3. **Structure** — Is the note logically organized? "
                "Flag fragmented ideas, abrupt topic jumps, or content that would "
                "benefit from headers, bullet points, or better ordering.\n\n"

                "4. **Consistency** — Are there internal contradictions, repeated points, "
                "or conflicting statements within the note itself?\n\n"

                "5. **Actionability** — Does the note lead anywhere useful? "
                "Flag implied conclusions, decisions, or next steps that were never "
                "stated explicitly.\n\n"

                "Strict Output Format — follow this EXACTLY, do not deviate:\n\n"
                "## Note Critique: {note_title}\n\n"

                "### Overall Score\n"
                "<score out of 10> — <one sentence explaining the overall rating>\n\n"

                "### Dimension Breakdown\n"
                "- **Clarity:** <score>/10 — <1–2 sentence assessment>\n"
                "- **Completeness:** <score>/10 — <1–2 sentence assessment>\n"
                "- **Structure:** <score>/10 — <1–2 sentence assessment>\n"
                "- **Consistency:** <score>/10 — <1–2 sentence assessment>\n"
                "- **Actionability:** <score>/10 — <1–2 sentence assessment>\n\n"

                "### Key Issues\n"
                "<Bullet list of the most critical problems. Be specific — quote or "
                "closely paraphrase the exact part of the note that is problematic. "
                "Do not write generic feedback like 'the note is unclear'.>\n\n"

                "### Suggested Improvements\n"
                "<Bullet list of concrete, directly applicable suggestions. "
                "Each suggestion must reference a specific part of the note. "
                "Do not write generic advice.>\n\n"

                "### Positive Highlights\n"
                "<Bullet list of what the note does well. "
                "This section is mandatory — never return a purely negative critique. "
                "If the note is very weak, find at least one genuine positive.>",
            ),
            (
                "human",
                "Please critique the following note.\n\n"
                "Note Title: {noteTitle}\n\n"
                "Note Content:\n{noteContent}",
            ),
        ])
        self.criticChain = (
            self._criticPrompt | self._critic_llm | self.outputParser
        )

    # ── Public Method 1: RAG Q&A ─────────────────────────────────────────────

    def getAnswer(self, query: str, retrievedChunks: list[dict]) -> str:
        contextText = self._buildContext(retrievedChunks)
        if not contextText:
            return "I could not find any relevant notes to answer your question."

        try:
            return self.qaChain.invoke({"context": contextText, "query": query})
        except Exception as e:
            return f"LLM generation error: {e}"

    # ── Public Method 2: Topic Summarization ─────────────────────────────────

    def summarizeNotes(self, topic: str, retrievedChunks: list[dict]) -> str:
        if not retrievedChunks:
            return (
                f"No notes found related to '{topic}'. "
                "Try adding some notes on this topic first."
            )

        contextText = self._buildContextForSummary(retrievedChunks)

        try:
            return self.summarizationChain.invoke(
                {"context": contextText, "topic": topic}
            )
        except Exception as e:
            return f"Summarization error: {e}"

    # ── Public Method 3: Note Critic ─────────────────────────────────────────

    def critiqueNote(self, noteTitle: str, noteContent: str) -> str:
      

        # ── Guard 1: Empty note ───────────────────────────────────────────────
        if not noteContent or not noteContent.strip():
            return (
                f"The note **'{noteTitle}'** appears to be empty. "
                "Please add some content before requesting a critique."
            )

        # ── Guard 2: Note too short to critique meaningfully ──────────────────
        # Fewer than 20 words gives the LLM almost nothing to evaluate across
        # five dimensions — scores would be fabricated, not analytical.
        wordCount = len(noteContent.split())
        if wordCount < 20:
            return (
                f"The note **'{noteTitle}'** is too short to critique meaningfully "
                f"({wordCount} words). A useful critique needs at least 20 words of content. "
                "Try expanding the note before requesting feedback."
            )

        # ── Guard 3: Note extremely long ──────────────────────────────────────
        # Groq LLaMA 70B has a 128k context window. At ~4 chars/token,
        # 80,000 words (~320k chars) would approach the limit when combined
        # with the prompt. This guard fires well before that risk zone.
        if wordCount > 15_000:
            return (
                f"The note **'{noteTitle}'** is too long to critique in a single pass "
                f"({wordCount:,} words). Please split it into smaller notes and "
                "critique each section individually."
            )

        try:
            return self.criticChain.invoke(
                {
                    "noteTitle": noteTitle,
                    "noteContent": noteContent,
                }
            )
        except Exception as e:
            return (
                f"Critique generation failed for **'{noteTitle}'**: {e}\n\n"
                "Please try again. If the problem persists, check your Groq API key "
                "and model availability in settings."
            )

    # ── Private Helpers ───────────────────────────────────────────────────────

    def _buildContext(self, chunks: list[dict]) -> str:
        parts = []
        for chunk in chunks:
            source = chunk.get("source", "").strip()
            content = chunk.get("content", "").strip()
            if not content:
                continue
            header = f"Source: {source}" if source else "Source: Unknown"
            parts.append(f"{header}\n{content}")
        return "\n\n".join(parts)

    def _buildContextForSummary(self, chunks: list[dict]) -> str:

        groupedNotes: dict[str, list[str]] = {}
        for chunk in chunks:
            source = chunk.get("source", "Unknown Note").strip()
            content = chunk.get("content", "").strip()
            if not content:
                continue
            groupedNotes.setdefault(source, []).append(content)

        if not groupedNotes:
            return ""

        parts = []
        for noteTitle, contents in groupedNotes.items():
            block = f"### Note: {noteTitle}\n" + "\n".join(contents)
            parts.append(block)

        return "\n\n---\n\n".join(parts)

    # Backward-compatible aliases for existing snake_case callers.
    def get_answer(self, query: str, retrieved_chunks: list[dict]) -> str:
        return self.getAnswer(query, retrieved_chunks)

    def summarize_notes(self, topic: str, retrieved_chunks: list[dict]) -> str:
        return self.summarizeNotes(topic, retrieved_chunks)

    def critique_note(self, note_title: str, note_content: str) -> str:
        return self.critiqueNote(note_title, note_content)