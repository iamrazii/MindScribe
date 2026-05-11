# 1. Project Overview

**Project name:** MindScribe

**Goal / problem statement:**

- Provide an AI-powered note taking and knowledge retrieval system that ingests free-form notes, converts them to vector embeddings, clusters related notes automatically, and supports retrieval-augmented generation (RAG) for question answering and summarization.

**What success looks like:**

- Users can create and store notes that are automatically chunked and embedded.
- Similar notes are grouped into clusters with centroid updates and automated splits when sub-topics emerge.
- Relevant chunks can be retrieved via vector search and provided as context to an LLM for accurate answers or summaries.
- A minimal React frontend provides the UI for note creation and retrieval. Backend persists notes, chunks, and cluster metadata in Postgres with vector support.

**Scope (what we are / aren’t building):**

- In scope (based on current code): note ingestion, text chunking, embedding generation, vector storage (Postgres "vector" type), clustering logic, chunk-level retrieval, a React + Vite frontend skeleton.
- Out of scope / Pending Implementation: HTTP API surface (FastAPI routes / endpoints are not present in the repo), complete user auth endpoints, automated deployment/config pipelines.

---

# 2. System Architecture

**High-level pipeline:**

- User interacts with the React frontend -> User submits a note or query -> Frontend calls backend (HTTP endpoints planned but currently not implemented) -> Backend: chunk note text -> embed chunks via EmbeddingService -> persist Note and NoteChunks (vector column) in Postgres -> compute/assign cluster via ClusterService -> For queries: compute query embedding -> vector similarity search over NoteChunks -> assemble context -> call ChatService (LLM) with context to generate answer.

**Components/modules:**

- Frontend: React + Vite app (frontend/src), UI components (shadcn, Tailwind CSS), entry at `src/main.tsx` and `app/App.tsx`.
- Backend core: configuration in `backend/core/config.py` (Pydantic settings), DB session provider in `backend/db/session.py`.
- Models: SQLAlchemy ORM models (`backend/models/entity.py`) describing `Notes`, `NoteChunks`, `Clusters`, `Messages`, and `Users`.
- CRUD layer: `backend/crud/` contains note, cluster, user, message helpers (business logic for DB operations).
- CRUD layer: `backend/crud/` contains note, cluster, user, message helpers (business logic for DB operations).
  `crud/notes.py` now also exposes `get_context_radar_suggestions()` for the Context Radar sidebar feature (retrieval-only, no LLM dependency).
- Services:
  - `backend/services/embedding.py` — embedding provider wrapper (HuggingFace endpoint via LangChain embeddings).
  - `backend/services/llm.py` — LLM wrapper (Groq LLaMA 70B via `langchain_groq`); LLM call logic implemented using modern LCEL chains.
  - `backend/services/clustering.py` — cluster assignment, centroid updates, cluster splitting (agglomerative clustering) and garbage collection.

**Data flow between components:**

- Frontend (UI) -> HTTP endpoint (planned) -> CRUD/service layer -> EmbeddingService -> Store vectors in Postgres `notechunks.embedding` -> ClusterService uses averaged per-note vectors to assign/update clusters -> Retrieval queries use per-chunk vector similarity to return top-k chunks -> ChatService consumes returned chunks and user query to produce a final response.

**Tools/frameworks used:**

- Python: SQLAlchemy, Pydantic/Settings, LangChain wrappers (langchain_huggingface, langchain_groq, langchain_core for LCEL), scikit-learn, numpy.
- DB / Vector index: PostgreSQL with `vector` extension and HNSW index settings (index created in models with `postgresql_using="hnsw"`).
- Frontend: React, Vite, Tailwind CSS, shadcn UI components.

---

# 3. Codebase Structure

**Top-level folders (repository-root):**

- backend/
- frontend/

**Representative folder tree (high level):**

- backend/
  - core/config.py
  - db/session.py
  - models/entity.py
  - crud/
    - notes.py
    - clusters.py
    - message.py
    - user.py
  - services/
    - embedding.py
    - clustering.py
    - llm.py

- frontend/
  - src/
    - main.tsx
    - app/
      - App.tsx
      - routes.tsx
      - components/ (pages, UI primitives)
  - styles/

**Key files and what they do:**

- `frontend/src/main.tsx`: React app entry; mounts `<App/>`.
- `frontend/src/app/App.tsx`: Top-level React component and app layout (router mounting point).
- `backend/core/config.py`: Pydantic settings object; loads env vars (DATABASE_URL, HF token/key names, embedding/LLM defaults, GROQ_API_KEY).
- `backend/db/session.py`: SQLAlchemy engine creation; ensures Postgres vector extension available; `get_db()` provides DB session dependency.
- `backend/models/entity.py`: SQLAlchemy ORM table definitions for `Notes`, `NoteChunks`, `Clusters`, `Messages`, `Users`. `NoteChunks.embedding` uses VECTOR(384) and declares an HNSW index.
- `backend/services/embedding.py`: Wrapper around LangChain / HuggingFace embedding endpoint; exposes embedding methods (note: implementation surface and naming inconsistent with usages elsewhere).
- `backend/services/clustering.py`: `ClusterService` with logic to find nearest cluster, update centroids, create clusters, garbage collect, and split clusters using AgglomerativeClustering.
- `backend/services/llm.py`: `ChatService` wrapper around a LangChain LLM (Groq LLaMA 70B); `get_answer` is implemented using modern LCEL chains (`ChatPromptTemplate` and `StrOutputParser`).
- `backend/crud/notes.py`: High-level note operations: chunking (RecursiveCharacterTextSplitter), embedding batch calls, averaging per-note vector, persisting `Notes` and `NoteChunks`, retrieving top-k chunks by cosine distance, update/delete helpers.

---

# 4. Data Details

**Datasets or data structures used:**

- Persistent store: PostgreSQL database (connection via `DATABASE_URL`). Uses `vector` extension and custom HNSW index for fast similarity search.
- ORM tables:
  - `notechunks` table storing `content` and `embedding` vector column (VECTOR(384)).
  - `notes` table storing note metadata (title, content, cluster_id, user_id).
  - `clusters` table storing `cluster_vector` (VECTOR(384)) and relationships to notes.

**Preprocessing steps for text chunks/embeddings:**

- Text splitting: `langchain.text_splitter.RecursiveCharacterTextSplitter` with `chunk_size=500` and `chunk_overlap=50` (used in `crud/notes.py`).
- Embedding generation: `EmbeddingService` uses a HuggingFace endpoint (via LangChain wrapper) to obtain vector embeddings. Code shows batch encoding and computing a per-note centroid by averaging chunk embeddings.
- Cluster assignment: compute averaged per-note vector and call ClusterService to either attach to nearest cluster (if distance below threshold) or create a new cluster. Clusters maintain centroid vectors and update via a moving average when adding notes.

**Limitations observed:**

- Embedding dimension: VECTOR(384) is used in models; this implies embeddings must match this dimensionality. This is configured via `EMBEDDING_MODEL_NAME` default in config (e.g., all-MiniLM-L6-v2 produces 384-dim embeddings).
- Context window constraints: no explicit LLM prompt window handling present; large aggregated contexts may exceed provider limits — RAG relies on top-k chunk retrieval (default top_k=5 in `retrieve_relevant_chunks`).
- Summarization context cap: `retrieve_chunks_for_summary` caps at `max_notes=8` distinct source notes per summary request. This is a conservative default to prevent context overflow and should be tuned based on average note/chunk sizes in production.
- Critic word-count bounds: `critique_note` rejects notes under 20 words (insufficient signal) and over 15,000 words (context window safety margin). These thresholds should be revisited once average note lengths in production are known.
- Inconsistencies in the codebase: several method names used in CRUD (e.g., `embedding_service.encode_documents`, `embedding_service.get_query_embedding`, `embedding_service.embed_documents`) do not match the method implemented in `services/embedding.py` (which currently exposes `encode`). Likewise ClusterService methods referenced (`process_and_assign_cluster`) differ from implemented names (`AssignCluster`, `DivideCluster`). These are implementation gaps that must be reconciled.

---

# 5. Interfaces / APIs

**Key backend function signatures (extracted from code):**

- `create_note(db, user_id, title: str, note_content: str) -> Notes` (creates Note, chunks, embeddings, cluster assignment)
- `delete_note_and_cleanup(db: Session, note_id, user_id) -> bool` (deletes note and triggers cluster garbage collection)
- `retrieve_relevant_chunks(db: Session, query_text: str, user_id, top_k: int = 5) -> List[dict]` (returns list of chunk dicts:{"content","source"})
- `get_note_by_id(db: Session, note_id, user_id) -> Notes | None`
- `handle_note_update(db: Session, note_id, user_id, title: str, content: str) -> Notes` (re-chunks and re-embeds updated note, reassigns cluster)
- `ClusterService.AssignCluster(title: str, content: str, document_vector: list[float]) -> int` (returns cluster_id) — implemented, but other CRUD code calls a different method name (`process_and_assign_cluster`) so mapping is needed.
- `EmbeddingService.encode(text: str) -> list[float]` (implemented) but higher-level calls expect batch and query helpers (`encode_documents`, `embed_documents`, `get_query_embedding`) — these are missing or named differently.
- `get_db()`: generator that yields SQLAlchemy `Session` (used as a dependency provider pattern for FastAPI; FastAPI routes themselves are not present).

**Input/output formats:**

- Internally the CRUD functions operate on SQLAlchemy ORM objects. For eventual HTTP APIs (not yet implemented), expected JSON payloads would include at least:
  - Create note: {"user_id": <uuid>, "title": "...", "content": "..."}
  - Query retrieval: {"user_id": <uuid>, "query": "...", "top_k": <int>}
- Retrieval output (from `retrieve_relevant_chunks`) is a list of objects: {"content": <str>, "source": <note title>} intended to be converted into prompt context for an LLM.

**Pending Implementation notes:**

- HTTP endpoints/routes (REST API) that expose the above CRUD and retrieval functions are not present and therefore the external JSON REST contract is undefined. This is marked Pending Implementation.

### Summarization API (Implemented)

- `retrieve_chunks_for_summary(db, topic, user_id, top_k=20, max_notes=8) -> List[dict]`
  Retrieval function optimized for summarization. Retrieves up to `top_k` chunks via cosine similarity, then caps distinct source notes at `max_notes` to prevent LLM context overflow. Returns chunks sorted by source-note first-appearance rank so the LLM receives coherent per-note blocks rather than interleaved chunks.

- `ChatService.summarize_notes(topic: str, retrieved_chunks: list[dict]) -> str`
  Synthesizes retrieved chunks into a structured markdown summary. Uses a dedicated `summarization_chain` (separate from the Q&A chain) with a synthesis-specific prompt that instructs the LLM to: group insights by sub-topic, cite sources inline, surface recurring themes, and produce a Key Takeaways section. Uses Groq LLaMA 70B.

**Intended call pattern (once HTTP routes exist):**

```python
chunks = retrieve_chunks_for_summary(db, topic=query, user_id=user_id)
summary = chat_service.summarize_notes(topic=query, retrieved_chunks=chunks)
```

**Design decisions:**

- `summarize_notes` uses a separate prompt chain from `get_answer` — different output contract (synthesis vs. point answer), different instruction set.
- `_build_context_for_summary()` groups chunks by note title before passing to the LLM, significantly improving cross-note synthesis quality.
- `max_notes=8` default prevents context window overflow on Groq's LLaMA 70B (128k context) while still giving broad coverage.

### Critic API (Implemented)

- `ChatService.critique_note(note_title: str, note_content: str) -> str`
  Evaluates a single note and returns structured, scored, actionable feedback.
  Retrieval-free — operates purely on raw note text. Caller is responsible for
  fetching note content via `get_note_content()` in `crud/notes.py` before calling.

**Output structure (markdown-formatted):**

- Overall Score /10 with rationale
- Dimension Breakdown: Clarity, Completeness, Structure, Consistency,
  Actionability — each scored /10 with 1–2 sentence assessment
- Key Issues: specific, quoted problems from the note
- Suggested Improvements: concrete, note-specific actions
- Positive Highlights: always present, never purely negative

**Intended call pattern (once HTTP routes exist):**

```python
content = get_note_content(db, note_id=note_id, user_id=user_id)
feedback = chat_service.critique_note(note_title=title, note_content=content)
```

**Design decisions:**

- Uses a dedicated `_critic_llm` instance at `temperature=0.3` — lower than
  the shared LLM (0.7) to produce consistent, repeatable scores rather than
  creative variance across repeated evaluations of the same note.
- Three input guards prevent low-quality LLM output: empty note, under-20-word
  note (insufficient signal for five-dimension scoring), and over-15,000-word
  note (context window safety).
- No retrieval involved — Critic is intentionally scoped to a single note.
  Cross-note evaluation is a future feature (e.g. contradiction detection
  across the knowledge base).
- Critic chain is fully independent of Q&A and Summarization chains —
  separate prompt, separate LLM instance, separate method.

### Context Radar API (Implemented)

- `get_context_radar_suggestions(db, current_note_id, current_note_content, user_id, top_k=5) -> List[dict]`
  Suggests semantically related notes based on the note currently open in the editor.
  Purely retrieval-driven — no LLM call is made. Intelligence comes entirely from
  the 384-dim HNSW vector index in the `notechunks` table.

**Output format:**

```python
[
  {
    "note_id":  ,   # parent note's DB id
    "title":    str,      # note title — displayed in the suggestions panel
    "excerpt":  str,      # closest-matching chunk text — used as preview snippet
    "distance": float,    # cosine distance (0.0 = identical, 1.0 = unrelated)
  },
  ...
]
```

**Intended call pattern (once HTTP routes exist):**

```python
note = get_note_by_id(db, note_id, user_id)
suggestions = get_context_radar_suggestions(
    db,
    current_note_id      = note.id,
    current_note_content = note.content,
    user_id              = user_id,
)
```

**Design decisions:**

- The open note is excluded from its own results via `Notes.id != current_note_id`
  in the WHERE clause — a note must never suggest itself.
- Over-fetches `top_k * 5` chunks then deduplicates to one entry per source note,
  keeping only the closest-matching chunk as the representative excerpt.
- Two input guards: empty content → empty list; fewer than 10 words → empty list.
  10-word floor is lower than the Critic's 20-word floor because vector similarity
  needs less signal than structured five-dimension analysis.
- `top_k=5` default keeps the suggestions panel uncluttered. Safe to raise
  to 8–10 once the frontend panel layout is finalized.
- No LLM call — `services/llm.py` is unchanged. This is intentional:
  Context Radar's value is speed (sub-second, no API latency) and always-on
  availability even when the Groq API is unreachable.

### AutoGeneration API (Implemented)

- `ChatService.generate_note_draft(prompt: str) -> dict`
  Generates a fully structured note draft from a free-text user prompt using
  Groq LLaMA 70B. Returns title and body content separately so the frontend
  can pre-fill the editor for user review before saving.
  Never persists to the database — persistence is always the caller's
  responsibility via `create_note()`.

**Output format:**

```python
# Success:
{
    "title":   str,   # Suggested note title extracted from LLM output
    "content": str,   # Full structured note body
    "error":   None,
}

# Failure (guard hit or LLM error):
{
    "title":   None,
    "content": None,
    "error":   str,   # Human-readable message for the UI
}
```

**Intended call pattern (once HTTP routes exist):**

```python
draft = chat_service.generate_note_draft(prompt=user_prompt)
if draft["error"]:
    raise HTTPException(status_code=400, detail=draft["error"])
saved_note = create_note(
    db,
    user_id      = current_user.id,
    title        = draft["title"],
    note_content = draft["content"],
)
```

**Design decisions:**

- Uses a dedicated `_autogen_llm` at `temperature=0.8` — higher than Q&A (0.7)
  and Summarization (0.7) because generation is a creative task requiring rich,
  original output. Lower than 1.0 to prevent incoherent structure.
- Three input guards: empty prompt → error; under 3 words → error (too vague
  for focused generation); over 500 words → error (paste belongs in
  `create_note()`, not generation).
- LLM output format is `TITLE: <title>\n---\n<body>`. A defensive
  `_parse_autogen_output()` helper extracts title and content, with graceful
  fallback to the user's original prompt as title if the LLM deviates
  from the format.
- `crud/notes.py` requires zero changes — the generated draft flows directly
  into the existing `create_note()` pipeline for chunking, embedding, and
  cluster assignment.
- Generated note body follows a fixed five-section structure: Overview,
  Key Concepts, How It Works / Details, Practical Applications, Key Takeaways.

### Cluster Naming API (Implemented)

- `ChatService.generate_cluster_name(notes_data: list[dict]) -> str`
  Generates a short, human-readable taxonomy name (2-5 words) for a mathematically grouped cluster of notes using Groq LLaMA 70B. Returns a clean string representing the category. Never persists to the database — updating the Clusters table is the caller's responsibility.

**Output format:**

```python
# Success:
"Machine Learning Basics"  # A clean string, 2-5 words, no quotes

# Failure (empty input or LLM error):
"New Cluster"  # (or "Unnamed Cluster" on API failure)
```

**Intended call pattern (once integrated in crud/clusters.py):**

```python
# When a cluster is formed or heavily updated:
notes_in_cluster = [
    {"title": n.title, "content": n.content} for n in cluster_notes
]
cluster_name = chat_service.generate_cluster_name(notes_data=notes_in_cluster)

# Save to database
db_cluster.name = cluster_name
db.commit()
```

**Design decisions:**

- Reuses the `_critic_llm` instance at temperature=0.3 — categorization and taxonomy require precise, factual, and consistent output. It avoids the creative variance or hallucinated names that higher temperatures might produce.

- Defensive context capping: Truncates input to a maximum of 10 notes per cluster, and only extracts the first 300 characters of each note's content. This prevents massive token bloat while providing ample semantic signal for the LLM to deduce the overarching topic.

- Strict formatting rules: The prompt instructs the LLM to return EXACTLY the name with no preamble, quotes, or markdown. A defensive `.strip(' *"\'\n')` ensures the string is perfectly clean before it hits the database.

- Graceful fallbacks: Returns "New Cluster" if the input list is empty, and "Unnamed Cluster" if the LLM call fails. This ensures the background clustering pipeline never crashes just because a naming API call timed out.

---

# 6. External Dependencies

**Libraries (observed in code):**

- Backend (Python): SQLAlchemy, pydantic-settings, langchain (langchain_huggingface, langchain_groq, langchain_core), numpy, scikit-learn (sklearn.cluster), langchain.text_splitter, psycopg/Postgres driver (indirect via SQLAlchemy), typing, uuid.
- Frontend (JS/TS): React, Vite, Tailwind CSS, shadcn UI components, react-dom.

**External APIs / LLM providers:**

- HuggingFace embeddings endpoint (via `HuggingFaceEndpointEmbeddings` / huggingfacehub token).
- Groq LLaMA 70B via `ChatGroq` (requires a GROQ_API_KEY) — LLM calls are implemented in `services/llm.py` using `langchain_groq` and `langchain_core` LCEL syntax.

**Tools and infra:**

- PostgreSQL database with `vector` extension and HNSW indexing options (configured in ORM model index metadata).
- Local ML libs used for clustering: scikit-learn (AgglomerativeClustering) and numpy for vector math.

**Notes on mismatches and next steps:**

- There are naming and implementation mismatches between service method signatures and their usages in CRUD (embedding service methods and cluster service methods). These must be reconciled before adding HTTP endpoints or integrating the frontend.
- FastAPI app and routes are not present; implementing HTTP endpoints and wiring `get_db()` dependency is the next step to make the backend runnable and consumable by the frontend.
- Environment variable names in `core/config.py` and usages across code (e.g., HF_TOKEN vs HF_API_KEY) should be audited and unified.
