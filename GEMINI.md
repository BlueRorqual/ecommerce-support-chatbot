# Gemini Instructions - Ecommerce Support Chatbot

This project is a functional prototype of an ecommerce chatbot with an automated ticketing system and intelligent chat capabilities.

## Project Architecture
- **Frontend:** React + TypeScript + Vite (Port 3000)
- **Backend:** Node.js + Express + TypeScript (Port 3001)
- **Data:** SQLite database in `backend/data/database.sqlite`

## Key Workflows
1. **Intelligent Chat:** Users send messages via `POST /api/chat`.
   - The bot first checks a keyword-based knowledge base in `backend/server.ts`.
   - If no match is found, it can call an LLM (OpenAI, Gemini, or Ollama) based on the `LLM_PROVIDER` environment variable.
2. **Ticketing:** If a query remains unanswered, the bot prompts for an email and order number to create a support ticket in SQLite.
3. **Admin Review:** Admin fetches all tickets via `GET /api/tickets`.

## Environment Variables (Backend)
Create a `backend/.env` file based on `backend/.env.example`:
- `LLM_PROVIDER`: Options are `keyword` (default), `openai`, `gemini`, or `ollama`.
- `OPENAI_API_KEY`: Required if provider is `openai`.
- `GEMINI_API_KEY`: Required if provider is `gemini`.
- `OLLAMA_URL`: URL for local Ollama instance (default: `http://localhost:11434/api/generate`).
- `OLLAMA_MODEL`: Model name for Ollama (default: `llama2`).

## Development Guidelines
- Always ensure both frontend and backend are running for full functionality.
- For persistent storage changes, the SQLite database schema is managed in `initDb()` within `backend/server.ts`.
