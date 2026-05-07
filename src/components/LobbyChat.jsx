import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

const LobbyChat = ({ isOpen, onClose }) => {
  const { roomState } = useGame();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'النظام', text: 'مرحباً بك في الدردشة!', type: 'system' },
    { id: 2, sender: 'سارة', text: 'أهلاً بالجميع، هل أنتم مستعدون؟', type: 'user', avatar: 'س' }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'أنت',
      text: message,
      type: 'user',
      avatar: 'أ',
      isMe: true
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[150] flex flex-col justify-end pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Chat Container */}
      <div className="relative w-full h-[60%] bg-[#1a1635] rounded-t-[2.5rem] border-t border-white/10 flex flex-col shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-black text-white">دردشة اللوبي</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              {msg.type === 'system' ? (
                <div className="w-full text-center py-2">
                  <span className="text-[10px] font-bold text-white/20 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">{msg.text}</span>
                </div>
              ) : (
                <div className={`flex gap-3 max-w-[85%] ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shrink-0 ${msg.isMe ? 'bg-blue-600' : 'bg-purple-600'}`}>
                    {msg.avatar}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold ${msg.isMe ? 'text-blue-400 text-left' : 'text-purple-400'}`}>
                      {msg.sender}
                    </span>
                    <div className={`p-3 rounded-2xl text-xs font-bold leading-relaxed shadow-sm ${
                      msg.isMe 
                        ? 'bg-blue-600/20 text-blue-100 rounded-tr-none' 
                        : 'bg-white/5 text-white/80 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSend}
          className="p-6 bg-[#0d0b1f]/50 border-t border-white/5"
        >
          <div className="flex gap-3">
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 h-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LobbyChat;
