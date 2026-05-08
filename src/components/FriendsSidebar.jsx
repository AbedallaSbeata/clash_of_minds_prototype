import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const FriendsSidebar = ({ isOpen, onClose }) => {
  const { roomState, setRoomState, friends, activeScreen, joinPrivateRoom } = useGame();
  const [toast, setToast] = useState(null);
  const [invitedIds, setInvitedIds] = useState([]);

  if (!isOpen) return null;

  const handleInvite = (friend) => {
    if (invitedIds.includes(friend.id)) return;
    
    const totalPlayers = activeScreen === 'private_room' 
      ? roomState.privateRoomConfig.teamA.length + roomState.privateRoomConfig.teamB.length
      : roomState.players.length;

    if (totalPlayers >= 8) {
      setToast('اكتمل العدد! الغرفة ممتلئة');
      setTimeout(() => setToast(null), 2000);
      return;
    }

    setToast(`تم دعوة ${friend.name} للتحدي`);
    
    setTimeout(() => {
      setToast(`✅ تم قبول الدعوة من ${friend.name}`);
      setInvitedIds(prev => [...prev, friend.id]);
      
      const newPlayer = { 
        id: friend.id, 
        name: friend.name, 
        avatar: friend.avatar, 
        isReady: true, 
        isLeader: false 
      };

      if (activeScreen === 'private_room') {
        const team = roomState.privateRoomConfig.teamA.length <= roomState.privateRoomConfig.teamB.length ? 'A' : 'B';
        joinPrivateRoom(newPlayer, team);
      } else {
        setRoomState(prev => ({
          ...prev,
          players: [...prev.players, newPlayer]
        }));
      }

      setTimeout(() => setToast(null), 2000);
    }, 1200);
  };

  const onlineCount = friends.filter(f => f.isFriend && f.status === 'متصل').length;

  return (
    <div className="absolute inset-0 z-50 overflow-hidden flex">
      {/* Backdrop (Dark Background) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      
      {/* Sidebar Panel - Slides from the Right in RTL */}
      <div className="absolute top-0 right-0 w-[85%] max-w-[320px] h-full bg-[#0d0b1f]/95 backdrop-blur-md border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.7)] flex flex-col animate-slide-in-right">
        
        {/* Toast Notification */}
        {toast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-bounce z-[60] whitespace-nowrap">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-2xl">👥</span>
            <h2 className="text-xl font-black text-white tracking-tight">الأصدقاء</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Online Count Strip */}
        <div className="bg-[#1a1635] py-2 px-6 flex items-center justify-between text-xs border-b border-white/5 flex-shrink-0">
          <span className="text-white/60 font-bold">الأصدقاء المتصلون</span>
          <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md font-black">{onlineCount}</span>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide">
          {friends.filter(f => f.isFriend).map(friend => (
            <div key={friend.id} className="bg-[#1a1635] p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden shadow-lg shadow-indigo-500/20">
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">{friend.name}</span>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider bg-white/5 px-1.5 rounded">
                      مستوى {friend.level}
                    </span>
                  </div>
                  
                  {/* Status and Action Row */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        friend.status === 'متصل' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                        friend.status === 'في تحدي' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-[10px] text-white/50 font-bold">
                        {friend.status}
                      </span>
                    </div>

                    {/* Dynamic Action Button: Check if in lobby */}
                    {([...roomState.players, ...roomState.privateRoomConfig.teamA, ...roomState.privateRoomConfig.teamB].some(p => p.name === friend.name)) ? (
                      <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        ✓
                      </div>
                    ) : friend.status === 'متصل' ? (
                      <button 
                        onClick={() => handleInvite(friend)}
                        className="w-8 h-8 rounded-xl bg-blue-500/10 hover:bg-blue-600 flex items-center justify-center text-blue-400 hover:text-white transition-all border border-blue-500/20 active:scale-90 shadow-lg"
                      >
                        +
                      </button>
                    ) : friend.status === 'في تحدي' ? (
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/10 border border-white/5 cursor-not-allowed" title="في تحدي حالياً">
                        ⏳
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendsSidebar;
