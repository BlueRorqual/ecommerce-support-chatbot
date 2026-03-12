import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Ensure tickets file exists
if (!fs.existsSync(TICKETS_FILE)) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
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
  timestamp: string;
}

const getTickets = (): Ticket[] => {
  try {
    const data = fs.readFileSync(TICKETS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveTicket = (query: string): string => {
  const tickets = getTickets();
  const newTicket: Ticket = {
    id: `TCK-${uuidv4().substring(0, 8).toUpperCase()}`,
    query,
    timestamp: new Date().toISOString()
  };
  tickets.push(newTicket);
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
  return newTicket.id;
};

app.post('/api/chat', (req: Request, res: Response) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const normalizedMessage = message.toLowerCase();
  
  // Try to find a match in knowledge base
  const match = knowledgeBase.find(entry => 
    entry.keywords.some(keyword => normalizedMessage.includes(keyword))
  );

  if (match) {
    return res.json({ response: match.answer });
  } else {
    // Beyond scope, create a ticket
    const ticketId = saveTicket(message);
    return res.json({ 
      response: `I'm sorry, I don't have the answer to that query. I've created a support ticket for you. Your ticket number is ${ticketId}. A human reviewer will look into it shortly.`,
      ticketId
    });
  }
});

app.get('/api/tickets', (req: Request, res: Response) => {
  const tickets = getTickets();
  res.json(tickets);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
