# Gemini Instructions - Ecommerce Support Chatbot

This project is a functional prototype of an ecommerce chatbot with an automated ticketing system.

## Project Architecture
- **Frontend:** React + TypeScript + Vite (Port 3000)
- **Backend:** Node.js + Express + TypeScript (Port 3001)
- **Data:** Local JSON storage in `backend/data/tickets.json`

## Key Workflows
1. **Chat Interaction:** Users send messages via `POST /api/chat`.
2. **Knowledge Base:** Keyword-based matching in `backend/server.ts`.
3. **Ticketing:** Unmatched queries generate a ticket in `tickets.json`.
4. **Admin Review:** Admin fetches all tickets via `GET /api/tickets`.

## Development Guidelines
- Always ensure both frontend and backend are running for full functionality.
- The `frontend/vite.config.ts` handles proxying `/api` requests to the backend.
- When adding new chatbot responses, update the `knowledgeBase` array in `backend/server.ts`.
- For persistent storage changes, ensure `backend/data/` directory and `tickets.json` are handled safely.
