# Ecommerce Chatbot with Ticketing System

This project is a functional prototype of an ecommerce chatbot designed to handle customer queries. If a query is beyond its predefined scope, the bot automatically creates a support ticket, provides the ticket number to the user, and lists these tickets for human reviewers in a dedicated admin interface.

## Features
- **Smart Chatbot:** Responds to common ecommerce queries (shipping, returns, order status, payments).
- **Automated Ticketing:** Creates a unique ticket for unanswered queries.
- **Admin Dashboard:** A simple interface for human reviewers to see all support tickets.
- **Modern UI:** Built with React, TypeScript, and Vanilla CSS.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1.  Clone the repository.
2.  Install dependencies for both frontend and backend:
    ```bash
    npm run install-all
    ```

### Running the Application
To start both the backend and frontend in development mode, run:
```bash
npm run dev
```
The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

## Project Structure
- `backend/`: Node.js/Express server handling chat logic and ticket persistence.
- `frontend/`: React/Vite application for the user and admin interfaces.
- `backend/data/tickets.json`: Local JSON file storing support tickets.
