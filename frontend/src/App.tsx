import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Ticket, LayoutDashboard, MessageSquare } from 'lucide-react';
import './App.css';

interface Message {
  text: string;
  isBot: boolean;
  ticketId?: string;
  needsEmail?: boolean;
}

interface TicketData {
  id: string;
  query: string;
  email: string;
  orderNumber?: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'admin'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I help you today with our store?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (view === 'admin') {
      fetchTickets();
    }
  }, [view]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || pendingQuery) return;

    const userMsg = { text: input, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      
      if (data.needsEmail) {
        setPendingQuery(input);
      }

      setMessages(prev => [...prev, { 
        text: data.response, 
        isBot: true,
        ticketId: data.ticketId,
        needsEmail: data.needsEmail
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the server.", 
        isBot: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!emailInput.trim() || !pendingQuery) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: pendingQuery, 
          email: emailInput,
          orderNumber: orderNumberInput 
        })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        text: data.response, 
        isBot: true,
        ticketId: data.ticketId 
      }]);
      setPendingQuery(null);
      setEmailInput('');
      setOrderNumberInput('');
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Failed to create ticket. Please try again.", 
        isBot: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo">E-Shop Bot</div>
        <button 
          className={view === 'chat' ? 'active' : ''} 
          onClick={() => setView('chat')}
        >
          <MessageSquare size={20} />
          <span>Chat</span>
        </button>
        <button 
          className={view === 'admin' ? 'active' : ''} 
          onClick={() => setView('admin')}
        >
          <LayoutDashboard size={20} />
          <span>Admin Review</span>
        </button>
      </nav>

      <main className="content">
        {view === 'chat' ? (
          <div className="chat-view">
            <header>
              <h2>Customer Support</h2>
            </header>
            <div className="messages-list">
              {messages.map((msg, i) => (
                <div key={i} className={`message-wrapper ${msg.isBot ? 'bot' : 'user'}`}>
                  <div className="avatar">
                    {msg.isBot ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div className="message-content">
                    <p>{msg.text}</p>
                    {msg.ticketId && (
                      <div className="ticket-badge">
                        <Ticket size={14} />
                        <span>Ticket: {msg.ticketId}</span>
                      </div>
                    )}
                    {msg.needsEmail && i === messages.length - 1 && (
                      <div className="email-collection">
                        <input 
                          type="email" 
                          placeholder="your@email.com" 
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                        />
                        <input 
                          type="text" 
                          placeholder="Order or Tracking Number (optional)" 
                          value={orderNumberInput}
                          onChange={(e) => setOrderNumberInput(e.target.value)}
                        />
                        <button onClick={handleCreateTicket} disabled={loading}>
                          Create Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div className="loading">Processing...</div>}
              <div ref={messagesEndRef} />
            </div>
            {!pendingQuery && (
              <div className="input-area">
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your query here..."
                />
                <button onClick={handleSend} disabled={loading}>
                  <Send size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="admin-view">
            <header>
              <h2>Support Tickets Review</h2>
            </header>
            <div className="ticket-list-container">
              {tickets.length === 0 ? (
                <div className="no-tickets">No tickets to review.</div>
              ) : (
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Query</th>
                      <th>Email</th>
                      <th>Order #</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket.id}>
                        <td><strong>{ticket.id}</strong></td>
                        <td>{ticket.query}</td>
                        <td>{ticket.email}</td>
                        <td>{ticket.orderNumber || '-'}</td>
                        <td>{new Date(ticket.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
