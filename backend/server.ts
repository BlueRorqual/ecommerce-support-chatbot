import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
const OLD_TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

app.use(cors());
app.use(bodyParser.json());

interface KnowledgeBaseEntry {
  keywords: string[];
  answer: string;
}

const knowledgeBase: KnowledgeBaseEntry[] = [
  {
    keywords: ['return', 'policy', 'refund'],
    answer: "Our return policy allows returns within 30 days of purchase. Please ensure items are in their original condition."
  },
  {
    keywords: ['shipping', 'delivery', 'time'],
    answer: "Standard shipping takes 3-5 business days. International shipping can take 10-15 business days."
  },
  {
    keywords: ['order status', 'track', 'where is my order'],
    answer: "You can track your order using the tracking number sent to your email or by logging into your account."
  },
  {
    keywords: ['payment', 'credit card', 'paypal'],
    answer: "We accept all major credit cards, PayPal, and Apple Pay."
  }
];

interface Ticket {
  id: string;
  query: string;
  email: string;
  orderNumber?: string;
  timestamp: string;
}

let db: Database;

const initDb = async () => {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      email TEXT NOT NULL,
      orderNumber TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // Migration from JSON to SQLite
  if (fs.existsSync(OLD_TICKETS_FILE)) {
    try {
      const data = fs.readFileSync(OLD_TICKETS_FILE, 'utf-8');
      const tickets: Ticket[] = JSON.parse(data);
      
      for (const ticket of tickets) {
        await db.run(
          'INSERT OR IGNORE INTO tickets (id, query, email, orderNumber, timestamp) VALUES (?, ?, ?, ?, ?)',
          [ticket.id, ticket.query, ticket.email || 'N/A', ticket.orderNumber || null, ticket.timestamp]
        );
      }
      
      fs.renameSync(OLD_TICKETS_FILE, `${OLD_TICKETS_FILE}.bak`);
      console.log('Migrated data from tickets.json to SQLite');
    } catch (err) {
      console.error('Migration failed:', err);
    }
  }
};

const getTickets = async (): Promise<Ticket[]> => {
  return db.all('SELECT * FROM tickets ORDER BY timestamp DESC');
};

const saveTicket = async (query: string, email: string, orderNumber?: string): Promise<string> => {
  const ticketId = `TCK-${uuidv4().substring(0, 8).toUpperCase()}`;
  const timestamp = new Date().toISOString();
  
  await db.run(
    'INSERT INTO tickets (id, query, email, orderNumber, timestamp) VALUES (?, ?, ?, ?, ?)',
    [ticketId, query, email, orderNumber || null, timestamp]
  );
  
  return ticketId;
};

// --- Intelligent Chat (LLM Logic) ---
const getLLMResponse = async (message: string): Promise<{ response: string; needsEmail: boolean }> => {
  const provider = process.env.LLM_PROVIDER || 'keyword';
  const normalizedMessage = message.toLowerCase();

  // 1. Keyword-based matching (Fast first pass / Fallback)
  const match = knowledgeBase.find(entry => 
    entry.keywords.some(keyword => normalizedMessage.includes(keyword))
  );

  if (match) {
    return { response: match.answer, needsEmail: false };
  }

  // 2. LLM Call if enabled
  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      }, {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });
      return { response: res.data.choices[0].message.content, needsEmail: false };
    }

    if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
      const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        contents: [{ parts: [{ text: message }] }]
      });
      return { response: res.data.candidates[0].content.parts[0].text, needsEmail: false };
    }

    if (provider === 'ollama') {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
      const res = await axios.post(ollamaUrl, {
        model: process.env.OLLAMA_MODEL || 'llama2',
        prompt: message,
        stream: false
      });
      return { response: res.data.response, needsEmail: false };
    }
  } catch (error) {
    console.error('LLM API call failed:', error);
  }

  // 3. Fallback to ticket creation
  return { 
    response: "I'm sorry, I don't have the answer to that query. Would you like to create a support ticket? Please provide your email and optionally an order or tracking number so a human reviewer can look into it and get back to you.",
    needsEmail: true
  };
};

app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const result = await getLLMResponse(message);
  return res.json(result);
});

app.post('/api/tickets', async (req: Request, res: Response) => {
  const { query, email, orderNumber } = req.body;

  if (!query || !email) {
    return res.status(400).json({ error: 'Query and email are required' });
  }

  try {
    const ticketId = await saveTicket(query, email, orderNumber);
    res.json({ ticketId, response: `Successfully created support ticket: ${ticketId}. Our team will contact you at ${email} soon.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.get('/api/tickets', async (req: Request, res: Response) => {
  try {
    const tickets = await getTickets();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
