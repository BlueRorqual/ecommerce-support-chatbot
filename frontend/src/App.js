import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Ticket, LayoutDashboard, MessageSquare } from 'lucide-react';
import './App.css';
const App = () => {
    const [view, setView] = useState('chat');
    const [messages, setMessages] = useState([
        { text: "Hello! How can I help you today with our store?", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
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
        }
        catch (error) {
            console.error("Failed to fetch tickets:", error);
        }
    };
    const handleSend = async () => {
        if (!input.trim())
            return;
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
            setMessages(prev => [...prev, {
                    text: data.response,
                    isBot: true,
                    ticketId: data.ticketId
                }]);
        }
        catch (error) {
            setMessages(prev => [...prev, {
                    text: "Sorry, I'm having trouble connecting to the server.",
                    isBot: true
                }]);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "app-container", children: [_jsxs("nav", { className: "sidebar", children: [_jsx("div", { className: "logo", children: "E-Shop Bot" }), _jsxs("button", { className: view === 'chat' ? 'active' : '', onClick: () => setView('chat'), children: [_jsx(MessageSquare, { size: 20 }), _jsx("span", { children: "Chat" })] }), _jsxs("button", { className: view === 'admin' ? 'active' : '', onClick: () => setView('admin'), children: [_jsx(LayoutDashboard, { size: 20 }), _jsx("span", { children: "Admin Review" })] })] }), _jsx("main", { className: "content", children: view === 'chat' ? (_jsxs("div", { className: "chat-view", children: [_jsx("header", { children: _jsx("h2", { children: "Customer Support" }) }), _jsxs("div", { className: "messages-list", children: [messages.map((msg, i) => (_jsxs("div", { className: `message-wrapper ${msg.isBot ? 'bot' : 'user'}`, children: [_jsx("div", { className: "avatar", children: msg.isBot ? _jsx(Bot, { size: 20 }) : _jsx(User, { size: 20 }) }), _jsxs("div", { className: "message-content", children: [_jsx("p", { children: msg.text }), msg.ticketId && (_jsxs("div", { className: "ticket-badge", children: [_jsx(Ticket, { size: 14 }), _jsxs("span", { children: ["Ticket: ", msg.ticketId] })] }))] })] }, i))), loading && _jsx("div", { className: "loading", children: "Bot is typing..." }), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "input-area", children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSend(), placeholder: "Type your query here..." }), _jsx("button", { onClick: handleSend, disabled: loading, children: _jsx(Send, { size: 20 }) })] })] })) : (_jsxs("div", { className: "admin-view", children: [_jsx("header", { children: _jsx("h2", { children: "Support Tickets Review" }) }), _jsx("div", { className: "ticket-list-container", children: tickets.length === 0 ? (_jsx("div", { className: "no-tickets", children: "No tickets to review." })) : (_jsxs("table", { className: "tickets-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Query" }), _jsx("th", { children: "Timestamp" })] }) }), _jsx("tbody", { children: tickets.map(ticket => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { children: ticket.id }) }), _jsx("td", { children: ticket.query }), _jsx("td", { children: new Date(ticket.timestamp).toLocaleString() })] }, ticket.id))) })] })) })] })) })] }));
};
export default App;
//# sourceMappingURL=App.js.map