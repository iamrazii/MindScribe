# 🧠 MindScribe

> **The AI-Powered Knowledge Hub** > MindScribe is a full-stack, intelligent note-taking application that leverages Large Language Models (LLMs) and Vector Databases to automatically organize, evaluate, and connect your thoughts.

---

## ✨ Key Features

* **📝 Smart Note Management:** Create, edit, and organize notes with a sleek, responsive UI.
* **🤖 AI Auto-Generation:** Generate comprehensive note drafts from short prompts or get real-time continuation suggestions while writing.
* **📊 Note Evaluation & Critique:** Get instant, AI-driven feedback on your notes scored across Clarity, Completeness, Structure, Consistency, and Actionability.
* **🎯 Context Radar:** Powered by vector similarity search, this feature automatically surfaces mathematically related notes in real-time as you browse.
* **🕸️ Knowledge Map:** A dynamic, visual clustering system that automatically categorizes and maps your notes based on semantic meaning.
* **💬 Smart Search (RAG Chatbot):** Ask an AI questions about your own knowledge base. It retrieves relevant chunks from your notes and synthesizes precise answers.
* **📤 Secure Note Sharing:** Share notes directly to other users' inboxes. The system manages read receipts and automatically handles access revocation if the original note is deleted.

---

## 🛠️ Tech Stack

**Frontend**
* React 18 (TypeScript)
* React Router v6
* Tailwind CSS
* Shadcn UI & Lucide Icons

**Backend**
* FastAPI (Python)
* SQLAlchemy & Pydantic
* LangChain & LangChain Text Splitters

**Database & AI**
* PostgreSQL with `pgvector` extension
* Groq API (for ultra-fast LLM inference)
* HuggingFace Embeddings (for local vectorization)

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
* Node.js (v18+)
* Python (3.10+)
* PostgreSQL with the `pgvector` extension installed.
