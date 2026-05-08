import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import TopBar from '../components/TopBar';
import FriendsSidebar from '../components/FriendsSidebar';
import LobbyChat from '../components/LobbyChat';

const PrivateRoomScreen = () => {
  const { 
    roomState, setRoomState, showScreen, friends, joinPrivateRoom, movePlayerToTeam, addFriendToProfile, userProfile 
  } = useGame();
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const config = roomState.privateRoomConfig;
  const allInRoom = [...config.teamA, ...config.teamB];
  const isYouReady = allInRoom.find(p => p.id === 'you')?.isReady;

  const handleInvite = (friend) => {
    if (allInRoom.some(p => p.id === friend.id)) return;
    
    setToast(`تم إرسال دعوة لـ ${friend.name}`);
    setTimeout(() => {
      joinPrivateRoom({
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar,
        isReady: true,
        isLeader: false
      }, config.teamA.length <= config.teamB.length ? 'A' : 'B');
      setToast(`✅ انضم ${friend.name} للغرفة`);
      setTimeout(() => setToast(null), 2000);
    }, 1000);
  };

  const handleStart = () => {
    if (roomState.isLeader) {
      if (config.teamA.length === 0 || config.teamB.length === 0) {
        setToast('يجب وجود لاعب واحد على الأقل في كل فريق!');
        setTimeout(() => setToast(null), 2000);
        return;
      }
      
      // Update main room players and opponents based on config
      setRoomState(prev => ({
        ...prev,
        players: prev.privateRoomConfig.teamA,
        opponents: prev.privateRoomConfig.teamB
      }));
      
      showScreen('game');
    } else {
      // Toggle ready state for members
      setRoomState(prev => {
        const newTeamA = prev.privateRoomConfig.teamA.map(p => 
          p.id === 'you' ? { ...p, isReady: !p.isReady } : p
        );
        const newTeamB = prev.privateRoomConfig.teamB.map(p => 
          p.id === 'you' ? { ...p, isReady: !p.isReady } : p
        );
        return {
          ...prev,
          privateRoomConfig: { teamA: newTeamA, teamB: newTeamB }
        };
      });
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleKick = (playerId) => {
    setRoomState(prev => ({
      ...prev,
      privateRoomConfig: {
        teamA: prev.privateRoomConfig.teamA.filter(p => p.id !== playerId),
        teamB: prev.privateRoomConfig.teamB.filter(p => p.id !== playerId)
      }
    }));
    showToast('تم طرد اللاعب من الغرفة');
    setActiveMenu(null);
  };

  const handleToggleFriend = (player) => {
    addFriendToProfile(player.name);
    showToast(friends.some(f => f.name === player.name) ? 'تم إلغاء الصداقة' : 'تم إرسال طلب صداقة');
    setActiveMenu(null);
  };

  const TeamSlot = ({ player, team }) => {
    const isFriend = friends.some(f => f.name === player.name && f.isFriend);
    
    return (
      <div className={`w-full p-1.5 rounded-xl border flex items-center justify-between mb-1.5 relative transition-all animate-in zoom-in duration-300 ${
        team === 'A' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg overflow-hidden border ${team === 'A' ? 'border-blue-400' : 'border-red-400'}`}>
            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-[9px] text-white/90">{player.name === 'أنت' ? 'أنت' : player.name}</span>
        </div>
        
        {/* Only hide swap/menu for YOURSELF. Others should have menu even for members (limited) */}
        {player.id !== 'you' && (
          <div className="relative">
            <button 
              onClick={() => setActiveMenu(activeMenu === player.id ? null : player.id)}
              className="bg-white/5 hover:bg-white/10 w-7 h-7 flex items-center justify-center rounded-lg text-sm text-white/40 transition-colors"
            >
              ⋮
            </button>

            {activeMenu === player.id && (
              <>
                <div className="fixed inset-0 z-[70]" onClick={() => setActiveMenu(null)} />
                <div className="absolute top-8 left-0 bg-[#1a1635] border border-white/10 rounded-xl shadow-2xl py-1.5 w-36 z-[80] animate-in fade-in zoom-in duration-150 origin-top-left overflow-hidden">
                  <button 
                    onClick={() => { showToast('تم كتم صوت اللاعب'); setActiveMenu(null); }}
                    className="w-full text-right px-4 py-2 text-[9px] font-bold text-white/80 hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    كتم الصوت 🔇
                  </button>
                  
                  {roomState.isLeader && (
                    <>
                      <button 
                        onClick={() => handleKick(player.id)}
                        className="w-full text-right px-4 py-2 text-[9px] font-bold text-red-400 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        طرد اللاعب 🚪
                      </button>
                      <button 
                        onClick={() => { movePlayerToTeam(player.id, team === 'A' ? 'B' : 'A'); setActiveMenu(null); }}
                        className="w-full text-right px-4 py-2 text-[9px] font-bold text-blue-400 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        نقل للفريق الثاني 🔄
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => handleToggleFriend(player)}
                    className="w-full text-right px-4 py-2 text-[9px] font-black text-yellow-400 hover:bg-white/5 transition-colors"
                  >
                    {isFriend ? 'إلغاء الصداقة ❌' : 'إضافة صديق +'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const AddSlot = ({ team }) => {
    if (!roomState.isLeader) return null;
    return (
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="w-full h-10 border-2 border-dashed border-white/5 rounded-xl mb-1.5 flex items-center justify-center text-white/20 hover:text-white/40 hover:bg-white/5 transition-all group"
      >
        <span className="text-lg group-hover:scale-125 transition-transform">+</span>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 bg-[#0d0b1f] text-white flex flex-col h-full overflow-hidden font-sans">
      <TopBar />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 px-6 py-2 rounded-full shadow-2xl animate-in fade-in duration-300 font-bold text-[10px] whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 pt-4 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center mb-3">
          <div className="bg-yellow-500/20 border border-yellow-500/30 px-3 py-0.5 rounded-full mb-1 flex items-center gap-2">
            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">إدارة الغرفة الخاصة 🏠</span>
            <div className="w-px h-3 bg-yellow-500/30" />
            <span className="text-[9px] font-black text-white/60 tabular-nums">رمز الغرفة: {roomState.id}</span>
          </div>
        </div>

        {/* Teams Layout */}
        <div className="flex gap-3 mb-3">
          {/* Team A */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-blue-400 font-black text-xs">فريق A</span>
              <span className="bg-blue-500/20 text-blue-400 text-[8px] px-2 py-0.5 rounded-md font-bold">{config.teamA.length}/4</span>
            </div>
            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-2 min-h-[100px] transition-all">
              {config.teamA.map(p => <TeamSlot key={p.id} player={p} team="A" />)}
              {config.teamA.length < 4 && <AddSlot team="A" />}
            </div>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-red-400 font-black text-xs">فريق B</span>
              <span className="bg-red-500/20 text-red-400 text-[8px] px-2 py-0.5 rounded-md font-bold">{config.teamB.length}/4</span>
            </div>
            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-2 min-h-[100px] transition-all">
              {config.teamB.map(p => <TeamSlot key={p.id} player={p} team="B" />)}
              {config.teamB.length < 4 && <AddSlot team="B" />}
            </div>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pb-4">
          
          {/* 1. Game Mode Card */}
          <div 
            onClick={() => roomState.isLeader && showScreen('modes')}
            className={`w-full bg-[#1a1635] border border-white/5 py-2.5 px-4 rounded-xl flex items-center justify-between group transition-all shadow-lg ${roomState.isLeader ? 'cursor-pointer active:scale-95' : 'opacity-80 cursor-default'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-lg shadow-lg">🧩</div>
              <div>
                <div className="font-black text-xs text-white leading-tight">{roomState.mode || 'كلمات كراش'}</div>
                <div className="text-[8px] text-white/40 font-bold tracking-tight">تحدي السرعة والذكاء</div>
              </div>
            </div>
            {roomState.isLeader && <div className="text-sm text-white/20 group-hover:text-blue-400 transition-colors">←</div>}
          </div>

          {/* 3. Quick Actions Row (Sound & Chat) */}
          <div className="flex gap-2">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex-1 h-11 border rounded-xl flex items-center justify-center text-xl active:scale-95 transition-all shadow-md ${
                isChatOpen ? 'bg-blue-500/20 border-blue-500/50 shadow-inner' : 'bg-[#1a1635] border-white/5'
              }`}
            >
              💬
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`flex-1 h-11 border rounded-xl flex items-center justify-center text-xl active:scale-95 transition-all shadow-md ${
                isMuted ? 'bg-red-500/20 border-red-500/50 shadow-inner' : 'bg-[#1a1635] border-white/5'
              }`}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </div>

      <FriendsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <LobbyChat 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Bottom Bar */}
      <div className="px-6 pb-6 pt-1 flex gap-3 flex-shrink-0">
        <button 
          onClick={() => {
            setRoomState(prev => ({ 
              ...prev, 
              isPrivateRoom: false,
              privateRoomConfig: { teamA: [{ id: 'you', name: 'أنت', avatar: userProfile.avatar, isReady: true, isLeader: true }], teamB: [] }
            }));
            showScreen('home');
          }}
          className="flex-1 bg-[#1a1635] border border-white/10 text-white h-11 rounded-xl flex items-center justify-center gap-2 group active:scale-95 transition-all"
        >
          <div className="flex flex-col items-center">
            <span className="font-black text-[10px] tracking-tight text-red-400">
              {roomState.isLeader ? 'إلغاء الغرفة' : 'خروج من الغرفة'}
            </span>
          </div>
        </button>
        <button 
          onClick={handleStart}
          disabled={!roomState.isLeader && isYouReady}
          className={`flex-[2] h-11 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${
            roomState.isLeader 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 shadow-yellow-500/10' 
            : isYouReady 
              ? 'bg-green-500/10 text-green-500 border border-green-500/30 cursor-not-allowed opacity-80'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 shadow-yellow-500/10'
          }`}
        >
          <span className="font-black text-base">
            {roomState.isLeader ? 'بدء التحدي' : isYouReady ? 'بانتظار القائد...' : 'مستعد'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PrivateRoomScreen;
