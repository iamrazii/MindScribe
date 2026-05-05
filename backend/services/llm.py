from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import settings
from .embedding import embedding_service


class ChatService:
    def __init__(self):

        # ── Shared output parser ─────────────────────────────────────────────
        self.output_parser = StrOutputParser()

        # ── Core LLM (Groq LLaMA 70B, temp=0.7) ────────────────────────────
        # Used by Q&A and Summarization — tasks that benefit from
        # balanced, natural language generation.
        self.llm = ChatGroq(
            model=settings.LLM_MODEL_NAME,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
        )
        self.embedder = embedding_service

        # ── Chain 1: RAG Q&A ─────────────────────────────────────────────────
        # Answers a specific, pointed question using retrieved chunk context.
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

        # ── Chain 2: Topic Summarization ─────────────────────────────────────
        # Synthesizes multiple notes on a topic into a structured overview.
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

        # ── Chain 3: Note Critic ─────────────────────────────────────────────
        # Evaluates a SINGLE note across five dimensions.
        # Uses temp=0.3 — critique must be precise and repeatable, not creative.
        self._critic_llm = ChatGroq(
            model=settings.LLM_MODEL_NAME,
            api_key=settings.GROQ_API_KEY,
            temperature=0.3,
        )
        self._critic_prompt = ChatPromptTemplate.from_messages([
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
                "closely paraphrase the exact part of the note that is problematic.>\n\n"
                "### Suggested Improvements\n"
                "<Bullet list of concrete, directly applicable suggestions. "
                "Each suggestion must reference a specific part of the note.>\n\n"
                "### Positive Highlights\n"
                "<Bullet list of what the note does well. "
                "This section is mandatory — never return a purely negative critique.>",
            ),
            (
                "human",
                "Please critique the following note.\n\n"
                "Note Title: {note_title}\n\n"
                "Note Content:\n{note_content}",
            ),
        ])
        self.critic_chain = (
            self._critic_prompt | self._critic_llm | self.output_parser
        )

        # ── Chain 4: AutoGeneration ──────────────────────────────────────────
        # Generates a structured note draft from a free-text user prompt.
        #
        # Why temp=0.8?
        # Higher than Q&A (0.7) and Summarization (0.7) because generation
        # is a creative task — we want the LLM to produce rich, original
        # content rather than cautious, templated output.
        # Lower than 1.0 to prevent incoherent or hallucinated structure.
        #
        # Why a separate LLM instance?
        # Each chain in ChatService has its own temperature tuned to the
        # nature of its task. Sharing one LLM instance would force a
        # one-size-fits-all temperature that degrades output quality
        # across at least one task.
        self._autogen_llm = ChatGroq(
            model=settings.LLM_MODEL_NAME,
            api_key=settings.GROQ_API_KEY,
            temperature=0.8,
        )
        self._autogen_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an expert knowledge assistant and note-writing coach. "
                "Your job is to generate a comprehensive, well-structured note draft "
                "on a topic provided by the user.\n\n"

                "Output Rules — follow ALL of these strictly:\n\n"

                "1. OUTPUT FORMAT: Your entire response must follow this exact structure:\n"
                "   TITLE: <a concise, descriptive title for the note (max 10 words)>\n"
                "   ---\n"
                "   <the full note body below the separator>\n\n"

                "2. NOTE BODY STRUCTURE: Organize the body using these sections:\n"
                "   ## Overview\n"
                "   <2–3 sentences introducing the topic and why it matters>\n\n"
                "   ## Key Concepts\n"
                "   <Bullet points covering the most important ideas, definitions, "
                "or components of the topic. Each bullet should be 1–2 sentences.>\n\n"
                "   ## How It Works / Details\n"
                "   <A prose or bullet explanation of mechanisms, processes, or deeper detail. "
                "Use sub-headers (###) if the topic has distinct sub-components.>\n\n"
                "   ## Practical Applications\n"
                "   <Bullet points of real-world use cases, examples, or contexts where "
                "this topic is applied.>\n\n"
                "   ## Key Takeaways\n"
                "   <3–5 concise bullet points summarizing the most important things "
                "to remember about this topic.>\n\n"

                "3. QUALITY RULES:\n"
                "   - Be specific and informative — avoid vague filler phrases like "
                "     'this is important' or 'there are many aspects'\n"
                "   - Do NOT include a preamble like 'Here is your note:' — "
                "     start directly with TITLE:\n"
                "   - Do NOT add sections beyond those listed above unless the topic "
                "     genuinely requires it\n"
                "   - Aim for 300–600 words in the note body — thorough but scannable\n"
                "   - Write in clear, plain English suitable for a personal knowledge base",
            ),
            (
                "human",
                "Please generate a note draft on the following topic:\n\n{prompt}",
            ),
        ])
        self.autogeneration_chain = (
            self._autogen_prompt | self._autogen_llm | self.output_parser
        )

    # ── Public Method 1: RAG Q&A ─────────────────────────────────────────────

    def get_answer(self, query: str, retrieved_chunks: list[dict]) -> str:
        """
        Generate a pointed answer from retrieved note chunks.

        Args:
            query:            The user's question.
            retrieved_chunks: [{"content": str, "source": str}, ...]
                              from retrieve_relevant_chunks() in crud/notes.py.

        Returns:
            Plain-text answer string, or an informative fallback.
        """
        context_text = self._build_context(retrieved_chunks)
        if not context_text:
            return "I could not find any relevant notes to answer your question."

        try:
            return self.qa_chain.invoke({"context": context_text, "query": query})
        except Exception as e:
            return f"LLM generation error: {e}"

    # ── Public Method 2: Topic Summarization ─────────────────────────────────

    def summarize_notes(self, topic: str, retrieved_chunks: list[dict]) -> str:
        """
        Synthesize retrieved note chunks into a structured topic summary.

        Args:
            topic:            The user's requested topic.
            retrieved_chunks: [{"content": str, "source": str}, ...]
                              from retrieve_chunks_for_summary() in crud/notes.py.

        Returns:
            Markdown-formatted summary string, or an informative fallback.
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

    # ── Public Method 3: Note Critic ─────────────────────────────────────────

    def critique_note(self, note_title: str, note_content: str) -> str:
        """
        Evaluate a single note and return structured, scored, actionable feedback.

        Args:
            note_title:   Title of the note being critiqued.
            note_content: Full raw text of the note.

        Returns:
            Markdown-formatted critique, or a safe fallback message.
            Never raises to the caller.
        """
        if not note_content or not note_content.strip():
            return (
                f"The note **'{note_title}'** appears to be empty. "
                "Please add some content before requesting a critique."
            )

        word_count = len(note_content.split())
        if word_count < 20:
            return (
                f"The note **'{note_title}'** is too short to critique meaningfully "
                f"({word_count} words). A useful critique needs at least 20 words."
            )

        if word_count > 15_000:
            return (
                f"The note **'{note_title}'** is too long to critique in a single pass "
                f"({word_count:,} words). Please split it into smaller notes first."
            )

        try:
            return self.critic_chain.invoke(
                {"note_title": note_title, "note_content": note_content}
            )
        except Exception as e:
            return (
                f"Critique generation failed for **'{note_title}'**: {e}\n\n"
                "Please try again. If the problem persists, check your Groq API key."
            )

    # ── Public Method 4: AutoGeneration ─────────────────────────────────────

    def generate_note_draft(self, prompt: str) -> dict:

        """
    Generates a structured note draft (title and body) from a free-text prompt.
    
    This method only generates the text. It does NOT persist to the database; 
    the caller must handle saving the result via create_note().

    Args:
        prompt: Free-text description of the desired note topic.

    Returns:
        dict: {
            "title": str | None,     # Suggested title
            "content": str | None,   # Generated note body
            "error": str | None      # Error message if generation fails
        }
        """
        # ── Guard: empty prompt ───────────────────────────────────────────────
        if not prompt or not prompt.strip():
            return {
                "title"  : None,
                "content": None,
                "error"  : (
                    "Prompt cannot be empty. "
                    "Please describe the topic you want a note generated on."
                ),
            }

        # ── Guard: prompt too short ───────────────────────────────────────────
        # A one-word prompt like "python" gives the LLM almost no direction
        # and produces generic, low-value output. We require at least 3 words
        # so there's enough signal to generate a useful, focused note.
        if len(prompt.split()) < 3:
            return {
                "title"  : None,
                "content": None,
                "error"  : (
                    "Prompt is too vague. Please provide at least 3 words "
                    "describing the topic (e.g., 'transformer attention mechanism' "
                    "instead of just 'transformers')."
                ),
            }

        # ── Guard: prompt too long ────────────────────────────────────────────
        # The prompt itself becomes part of the LLM input. A 500+ word prompt
        # is likely a paste of existing content — that belongs in create_note(),
        # not the generation endpoint.
        if len(prompt.split()) > 500:
            return {
                "title"  : None,
                "content": None,
                "error"  : (
                    "Prompt is too long for generation. If you already have content, "
                    "use 'Create Note' directly. For generation, describe the topic "
                    "in under 500 words."
                ),
            }

        # ── LLM call ─────────────────────────────────────────────────────────
        try:
            raw_output = self.autogeneration_chain.invoke({"prompt": prompt})
        except Exception as e:
            return {
                "title"  : None,
                "content": None,
                "error"  : (
                    f"Note generation failed: {e}\n"
                    "Please try again. If the problem persists, "
                    "check your Groq API key and model availability."
                ),
            }

        # ── Parse LLM output ─────────────────────────────────────────────────
        # Expected format from the prompt:
        #   TITLE: <title text>
        #   ---
        #   <note body>
        #
        # We split on the separator and extract title + body defensively.
        # If the LLM deviates from the format, we still return something
        # useful rather than crashing — the whole raw output becomes the
        # content and we use the user's prompt as a fallback title.
        parsed = self._parse_autogen_output(raw_output, fallback_title=prompt)

        return {
            "title"  : parsed["title"],
            "content": parsed["content"],
            "error"  : None,
        }

    # ── Private Helpers ───────────────────────────────────────────────────────

    def _parse_autogen_output(self, raw: str, fallback_title: str) -> dict:
        """
        Parse the structured output from the autogeneration chain.

        Expected LLM output format:
            TITLE: <title>
            ---
            <body content>

        Handles gracefully if the LLM deviates from the format.
        """
        title   = fallback_title.strip()
        content = raw.strip()

        # Split on the separator line
        if "---" in raw:
            parts = raw.split("---", 1)        # split on FIRST occurrence only
            header  = parts[0].strip()
            content = parts[1].strip()

            # Extract title from the header block
            for line in header.splitlines():
                if line.upper().startswith("TITLE:"):
                    extracted = line[len("TITLE:"):].strip()
                    if extracted:
                        title = extracted
                    break
        else:
            # Separator missing — try to extract TITLE: from the first line
            first_line = raw.splitlines()[0].strip() if raw.strip() else ""
            if first_line.upper().startswith("TITLE:"):
                extracted = first_line[len("TITLE:"):].strip()
                if extracted:
                    title   = extracted
                # Remove the title line from the content
                content = "\n".join(raw.splitlines()[1:]).strip()

        return {"title": title, "content": content}

    def _build_context(self, chunks: list[dict]) -> str:
        """
        Flat context string for Q&A.
        Format per chunk: 'Source: <title>\\n<content>'
        """
        parts = []
        for chunk in chunks:
            source  = chunk.get("source", "").strip()
            content = chunk.get("content", "").strip()
            if not content:
                continue
            header = f"Source: {source}" if source else "Source: Unknown"
            parts.append(f"{header}\n{content}")
        return "\n\n".join(parts)

    def _build_context_for_summary(self, chunks: list[dict]) -> str:
        """
        Grouped context string for summarization.
        Groups chunks by source note for coherent cross-note synthesis.

        Format:
            ### Note: <title>
            <chunk_1>
            <chunk_2>
            ---
        """
        grouped: dict[str, list[str]] = {}
        for chunk in chunks:
            source  = chunk.get("source", "Unknown Note").strip()
            content = chunk.get("content", "").strip()
            if not content:
                continue
            grouped.setdefault(source, []).append(content)

        if not grouped:
            return ""

        parts = []
        for note_title, contents in grouped.items():
            block = f"### Note: {note_title}\n" + "\n".join(contents)
            parts.append(block)

        return "\n\n---\n\n".join(parts)