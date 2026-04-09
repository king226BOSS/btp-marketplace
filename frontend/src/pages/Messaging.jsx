import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { Send, User, MessageCircle } from 'lucide-react';

export default function Messaging() {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(location.state?.selectedUser || null);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    if (location.state?.selectedUser) {
      setSelectedUser(location.state.selectedUser);
      fetchMessages(location.state.selectedUser.other_id);
    }
    
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join', user.id);

    newSocket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Update last message in conversations list
      setConversations(prev => prev.map(conv => 
        conv.other_id === (msg.sender_id === user.id ? msg.receiver_id : msg.sender_id)
        ? { ...conv, last_message: msg.content, time: msg.created_at }
        : conv
      ));
    });

    fetchConversations();

    return () => newSocket.close();
  }, []);

  const fetchConversations = async () => {
    const res = await fetch('http://localhost:5000/api/messages/conversations', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setConversations(data);
  };

  const fetchMessages = async (otherId) => {
    const res = await fetch(`http://localhost:5000/api/messages/${otherId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setMessages(data);
    scrollToBottom();
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    fetchMessages(u.other_id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    socket.emit('sendMessage', {
      senderId: user.id,
      receiverId: selectedUser.other_id,
      content: newMessage
    });
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) return <div className="container">Veuillez vous connecter.</div>;

  return (
    <div className="container" style={{ padding: '2rem', height: 'calc(100vh - 100px)', display: 'flex', gap: '2rem' }}>
      {/* Sidebar - Liste des conversations */}
      <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={20} /> Messages
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(conv => (
            <div 
              key={conv.other_id} 
              onClick={() => handleSelectUser(conv)}
              style={{ 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--border)', 
                cursor: 'pointer',
                background: selectedUser?.other_id === conv.other_id ? '#F3F4F6' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>{conv.other_name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(conv.time).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {conv.last_message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedUser.other_name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{selectedUser.other_role}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => (
                <div 
                  key={msg.id} 
                  style={{ 
                    maxWidth: '70%',
                    alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                    background: msg.sender_id === user.id ? 'var(--primary)' : '#E5E7EB',
                    color: msg.sender_id === user.id ? 'white' : 'var(--secondary)',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    borderBottomRightRadius: msg.sender_id === user.id ? '0' : '1rem',
                    borderBottomLeftRadius: msg.sender_id !== user.id ? '0' : '1rem',
                    fontSize: '0.95rem'
                  }}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
              <input 
                className="form-control" 
                placeholder="Tapez votre message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <MessageCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Sélectionnez une conversation pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
}
