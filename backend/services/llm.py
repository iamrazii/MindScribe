from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.config import settings
from .embedding import embedding_service
from sqlalchemy.orm import Session
import uuid
import re
from crud.history import get_recent_history, format_history_for_llm


class ChatService:
    def __init__(self):
        self.output_parser = StrOutputParser()

        self.llm = ChatGroq(
            model=settings.LLM_MODEL_NAME,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
        )

        self.embedder = embedding_service

        self._qa_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an assistant that answers user questions using the provided context.\n"
                "Only use the information in the context to answer.\n"
                "If the answer is not present in the context, reply that you don't know.\n"
                "Return only plain text. No markdown, hashtags, bullet points, asterisks, or special formatting.\n\n"
                "User History:\n{user_history}\n\n"
                "Context:\n{context}",
            ),
            ("human", "{query}"),
        ])

        self.qa_chain = self._qa_prompt | self.llm | self.output_parser

        self._summarization_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a knowledge synthesis assistant. "
                "Your job is to read a user's personal notes and produce a clear, "
                "well-structured summary on the topic they request.\n\n"
                "Guidelines:\n"
                "Synthesize information ACROSS all provided sources — do not just list them\n"
                "Organize distinct sub-topics clearly using plain text section titles only\n"
                "After each key insight or claim, cite its origin inline using plain text: (Source: <note title>)\n"
                "Identify and surface recurring themes or contradictions between notes\n"
                "Do NOT fabricate information absent from the notes\n"
                "The summary MUST be significantly shorter than the original notes content\n"
                "Aim for approximately half the total length of the provided notes\n"
                "Keep only the most important concepts, insights, and conclusions\n"
                "Avoid unnecessary repetition and minor details\n"
                "End with a brief Key Takeaways section\n"
                "Return only plain text. No markdown, hashtags, bullet symbols, asterisks, or special formatting.\n\n"
                "User History:\n{user_history}\n\n"
                "Notes:\n{context}",
            ),
            ("human", "Please summarize my notes on the topic: {topic}"),
        ])

        self.summarization_chain = (
            self._summarization_prompt | self.llm | self.output_parser
        )

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
                "1. Clarity — Is the writing clear and easy to follow? "
                "Flag vague sentences, undefined jargon, or confusing phrasing.\n\n"
                "2. Completeness — Does the note fully cover its apparent topic? "
                "Identify missing context, undefined terms, or unexplained assumptions "
                "that would confuse the user when they re-read this note later.\n\n"
                "3. Structure — Is the note logically organized? "
                "Flag fragmented ideas, abrupt topic jumps, or content that would "
                "benefit from headers, better ordering, or clearer separation.\n\n"
                "4. Consistency — Are there internal contradictions, repeated points, "
                "or conflicting statements within the note itself?\n\n"
                "5. Actionability — Does the note lead anywhere useful? "
                "Flag implied conclusions, decisions, or next steps that were never "
                "stated explicitly.\n\n"
                "Strict Output Format — follow this EXACTLY, do not deviate:\n\n"
                "Note Critique: {note_title}\n\n"
                "Overall Score\n"
                "<score out of 10> — <one sentence explaining the overall rating>\n\n"
                "Dimension Breakdown\n"
                "Clarity: <score>/10 — <1–2 sentence assessment>\n"
                "Completeness: <score>/10 — <1–2 sentence assessment>\n"
                "Structure: <score>/10 — <1–2 sentence assessment>\n"
                "Consistency: <score>/10 — <1–2 sentence assessment>\n"
                "Actionability: <score>/10 — <1–2 sentence assessment>\n\n"
                "Key Issues\n"
                "<List the most critical problems. Be specific — quote or "
                "closely paraphrase the exact part of the note that is problematic.>\n\n"
                "Suggested Improvements\n"
                "<List concrete, directly applicable suggestions. "
                "Each suggestion must reference a specific part of the note.>\n\n"
                "Positive Highlights\n"
                "<List what the note does well. "
                "This section is mandatory — never return a purely negative critique.>\n\n"
                "Return only plain text. No markdown, hashtags, bullet symbols, asterisks, or special formatting.\n\n"
                "User History:\n{user_history}",
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
                "TITLE: <a concise, descriptive title for the note (max 10 words)>\n"
                "---\n"
                "<the full note body below the separator>\n\n"

                "2. NOTE BODY STRUCTURE: Organize the body using these sections:\n"
                "Overview:\n"
                "<2–3 sentences introducing the topic and why it matters>\n\n"

                "Key Concepts:\n"
                "<Cover the most important ideas, definitions, "
                "or components of the topic.>\n\n"

                "How It Works / Details:\n"
                "<Explain mechanisms, processes, or deeper detail. "
                "Use plain text subsection titles if needed.>\n\n"

                "Practical Applications:\n"
                "<Real-world use cases, examples, or contexts where "
                "this topic is applied.>\n\n"

                "Key Takeaways:\n"
                "<Summarize the most important things "
                "to remember about this topic.>\n\n"

                "3. QUALITY RULES:\n"
                "Be specific and informative — avoid vague filler phrases like "
                "'this is important' or 'there are many aspects'\n"
                "Do NOT include a preamble like 'Here is your note:' — "
                "start directly with TITLE:\n"
                "Do NOT add sections beyond those listed above unless the topic "
                "genuinely requires it\n"
                "Aim for 300–600 words in the note body — thorough but scannable\n"
                "Write in clear, plain English suitable for a personal knowledge base\n"
                "Return only plain text. No markdown, hashtags, bullet symbols, asterisks, or special formatting.\n\n"
                "User History:\n{user_history}",
            ),
            (
                "human",
                "Please generate a note draft on the following topic:\n\n{prompt}",
            ),
        ])

        self.autogeneration_chain = (
            self._autogen_prompt | self._autogen_llm | self.output_parser
        )

        self._cluster_naming_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are an expert taxonomy and categorization assistant. "
                "Your job is to read a collection of note titles and excerpts from a single cluster, "
                "and generate a highly descriptive, human-readable folder name for them.\n\n"
                "Rules:\n"
                "1. The name must be short (2 to 5 words max).\n"
                "2. Be specific (e.g., 'React Frontend Hooks' instead of just 'Web Dev').\n"
                "3. Output ONLY the name as plain text. No quotes, no markdown, no hashtags."
            ),
            (
                "human",
                "Please name the cluster containing these notes:\n\n{notes_context}"
            ),
        ])

        self.cluster_naming_chain = (
            self._cluster_naming_prompt | self._critic_llm | self.output_parser
        )

    def _clean_plain_text(self, text: str) -> str:
        text = re.sub(r'[#*_>`~-]+', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    def get_answer(self, db: Session, user_id: uuid.UUID, query: str, retrieved_chunks: list[dict]) -> str:
        context_text = self._build_context(retrieved_chunks)

        if not context_text:
            return "I could not find any relevant notes to answer your question."

        history_list = get_recent_history(db, user_id)
        user_history_str = format_history_for_llm(history_list)

        try:
            response = self.qa_chain.invoke({
                "context": context_text,
                "query": query,
                "user_history": user_history_str
            })

            return self._clean_plain_text(response)

        except Exception as e:
            return f"LLM generation error: {e}"

    def summarize_notes(self, db: Session, user_id: uuid.UUID, topic: str, retrieved_chunks: list[dict]) -> str:
        if not retrieved_chunks:
            return (
                f"No notes found related to '{topic}'. "
                "Try adding some notes on this topic first."
            )

        context_text = self._build_context_for_summary(retrieved_chunks)

        history_list = get_recent_history(db, user_id)
        user_history_str = format_history_for_llm(history_list)

        try:
            response = self.summarization_chain.invoke({
                "context": context_text,
                "topic": topic,
                "user_history": user_history_str
            })

            return self._clean_plain_text(response)

        except Exception as e:
            return f"Summarization error: {e}"

    def critique_note(self, db: Session, user_id: uuid.UUID, note_title: str, note_content: str) -> str:
        if not note_content or not note_content.strip():
            return (
                f"The note '{note_title}' appears to be empty. "
                "Please add some content before requesting a critique."
            )

        word_count = len(note_content.split())

        if word_count < 20:
            return (
                f"The note '{note_title}' is too short to critique meaningfully "
                f"({word_count} words). A useful critique needs at least 20 words."
            )

        if word_count > 15_000:
            return (
                f"The note '{note_title}' is too long to critique in a single pass "
                f"({word_count:,} words). Please split it into smaller notes first."
            )

        history_list = get_recent_history(db, user_id)
        user_history_str = format_history_for_llm(history_list)

        try:
            response = self.critic_chain.invoke({
                "note_title": note_title,
                "note_content": note_content,
                "user_history": user_history_str
            })

            return self._clean_plain_text(response)

        except Exception as e:
            return (
                f"Critique generation failed for '{note_title}': {e}\n\n"
                "Please try again. If the problem persists, check your Groq API key."
            )

    def generate_note_draft(self, db: Session, user_id: uuid.UUID, prompt: str) -> dict:
        if not prompt or not prompt.strip():
            return {
                "title": None,
                "content": None,
                "error": (
                    "Prompt cannot be empty. "
                    "Please describe the topic you want a note generated on."
                ),
            }

        if len(prompt.split()) < 3:
            return {
                "title": None,
                "content": None,
                "error": (
                    "Prompt is too vague. Please provide at least 3 words "
                    "describing the topic."
                ),
            }

        if len(prompt.split()) > 500:
            return {
                "title": None,
                "content": None,
                "error": (
                    "Prompt is too long for generation. "
                    "Describe the topic in under 500 words."
                ),
            }

        history_list = get_recent_history(db, user_id)
        user_history_str = format_history_for_llm(history_list)

        try:
            raw_output = self.autogeneration_chain.invoke({
                "prompt": prompt,
                "user_history": user_history_str
            })

            raw_output = self._clean_plain_text(raw_output)

        except Exception as e:
            return {
                "title": None,
                "content": None,
                "error": (
                    f"Note generation failed: {e}\n"
                    "Please try again."
                ),
            }

        parsed = self._parse_autogen_output(
            raw_output,
            fallback_title=prompt
        )

        return {
            "title": parsed["title"],
            "content": parsed["content"],
            "error": None,
        }

    def _parse_autogen_output(self, raw: str, fallback_title: str) -> dict:
        title = fallback_title.strip()
        content = raw.strip()

        if "---" in raw:
            parts = raw.split("---", 1)
            header = parts[0].strip()
            content = parts[1].strip()

            for line in header.splitlines():
                if line.upper().startswith("TITLE:"):
                    extracted = line[len("TITLE:"):].strip()

                    if extracted:
                        title = extracted

                    break

        else:
            first_line = raw.splitlines()[0].strip() if raw.strip() else ""

            if first_line.upper().startswith("TITLE:"):
                extracted = first_line[len("TITLE:"):].strip()

                if extracted:
                    title = extracted

                content = "\n".join(raw.splitlines()[1:]).strip()

        return {
            "title": self._clean_plain_text(title),
            "content": self._clean_plain_text(content)
        }

    def generate_cluster_name(self, notes_data: list[dict]) -> str:
        if not notes_data:
            return "New Cluster"

        context_parts = []

        for n in notes_data[:10]:
            title = n.get("title", "Untitled").strip()
            content_snippet = n.get("content", "")[:300].strip()

            if title or content_snippet:
                context_parts.append(
                    f"Title: {title}\nSnippet: {content_snippet}..."
                )

        notes_context = "\n\n".join(context_parts)

        if not notes_context:
            return "New Cluster"

        try:
            name = self.cluster_naming_chain.invoke({
                "notes_context": notes_context
            })

            return self._clean_plain_text(
                name.strip(' *"\'\n')
            )

        except Exception:
            return "Unnamed Cluster"

    def _build_context(self, chunks: list[dict]) -> str:
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
            block = f"Note: {note_title}\n" + "\n".join(contents)
            parts.append(block)

        return "\n\n".join(parts)