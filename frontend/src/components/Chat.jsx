import { useState, useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../App';
import { Send, Smile } from 'lucide-react';

export default function Chat({ roomId }) {
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);

  const emojis = ['👍', '❤️', '🔥', '😂', '🎉', '🎶'];

  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    const onReaction = (reaction) => {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'reaction',
        ...reaction
      }]);
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:reaction', onReaction);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:reaction', onReaction);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('chat:message', { roomId, message: input });
    setInput('');
  };

  const sendReaction = (emoji) => {
    socket.emit('chat:reaction', { roomId, emoji });
    setShowEmoji(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontWeight: 600 }}>Live Chat</h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.senderId === socket.id ? 'flex-end' : 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{msg.senderName}</span>
            {msg.type === 'reaction' ? (
              <div style={{ fontSize: '2rem', animation: 'bounce 0.5s' }}>{msg.emoji}</div>
            ) : (
              <div style={{ 
                background: msg.senderId === socket.id ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                maxWidth: '80%'
              }}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
        {showEmoji && (
          <div style={{ position: 'absolute', bottom: '100%', left: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.5rem', display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {emojis.map(e => (
              <button type="button" key={e} onClick={() => sendReaction(e)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
        )}
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}>
            <Smile size={20} />
          </button>
          <input 
            type="text" 
            className="glass-input" 
            style={{ padding: '0.5rem 1rem' }}
            placeholder="Type a message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem', width: 'auto' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
