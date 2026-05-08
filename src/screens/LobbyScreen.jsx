import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import TopBar from '../components/TopBar';
import FriendsSidebar from '../components/FriendsSidebar';
import SearchingScreen from './SearchingScreen';
import LobbyChat from '../components/LobbyChat';

const LobbyScreen = () => {
  const { 
    roomState, setRoomState, showScreen, isMuted, setIsMuted, 
    isGameSoundMuted, setIsGameSoundMuted,
    mutedPlayers, kickPlayer, toggleMutePlayer, transferLeadership, 
    addFriendToProfile, removeFriendFromProfile,
    friends, setFriends, createPrivateRoom
  } = useGame();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [showMatchOptions, setShowMatchOptions] = useState(false);
  const [matchConfig, setMatchConfig] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [selectionStep, setSelectionStep] = useState(null); 
  const [selectedGameType, setSelectedGameType] = useState(null); 

  // Security: If we are in 'type' step but have more than 1 player, auto-switch to 'add_more'
  useEffect(() => {
    if (selectionStep === 'type' && roomState.players.length > 1) {
      setSelectedGameType('group');
      setSelectionStep('add_more');
    }
  }, [selectionStep, roomState.players.length]);

  const handleAction = (action, player) => {
    setActiveMenu(null);
    if (action === 'kick') {
      kickPlayer(player.id);
      showToast(`تم طرد ${player.name} من اللوبي`);
    } else if (action === 'mute') {
      toggleMutePlayer(player.id);
    } else if (action === 'transfer') {
      transferLeadership(player.id);
      showToast(`تم نقل القيادة لـ ${player.name}`);
    } else if (action === 'addFriend') {
      const isAlreadyFriend = friends.some(f => f.name === player.name && f.isFriend);
      if (isAlreadyFriend) {
        removeFriendFromProfile(player.name);
        showToast(`تمت إزالة ${player.name} من قائمة الأصدقاء`);
      } else {
        showToast(`تم إرسال دعوة صداقة لـ ${player.name}`);
        setTimeout(() => {
          showToast(`تم قبول الدعوة! ${player.name} الآن صديقك`);
          addFriendToProfile(player.name);
        }, 2000);
      }
    }
  };

  const handleReady = () => {
    setRoomState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === 'you' ? { ...p, isReady: !p.isReady } : p
      )
    }));
  };

  const handleStartGame = () => {
    const allReady = roomState.players.every(p => p.isReady);
    if (!allReady) {
      showToast('يجب أن يكون كل الأشخاص مستعدين!');
      return;
    }

    if (roomState.isPrivateRoom) {
      showToast('جاري بدء اللعبة الخاصة...');
      setTimeout(() => {
        showScreen('game');
      }, 1500);
    } else {
      if (roomState.players.length > 1) {
        setSelectedGameType('group'); 
        if (roomState.players.length >= 4) {
          startMatchSearch('group', 0);
        } else {
          setSelectionStep('add_more');
        }
      } else {
        setSelectionStep('type');
      }
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedGameType(type);
    if (type === 'solo') {
      setSelectionStep('solo_count');
    } else {
      setSelectionStep('group_count');
    }
  };

  const startMatchSearch = (type, additionalTeammates) => {
    setSelectionStep(null);
    let teamSize = roomState.players.length;
    let searchSize = 0;
    let modeName = '';

    const actualType = type || selectedGameType || 'group';

    if (actualType === 'solo') {
      searchSize = additionalTeammates;
      teamSize = 1;
      modeName = additionalTeammates === 1 ? 'تحدي 1 ضد 1' : `تحدي 1 ضد ${additionalTeammates}`;
    } else {
      const totalTeamSize = roomState.players.length + additionalTeammates;
      teamSize = totalTeamSize;
      const totalPlayers = totalTeamSize * 2;
      searchSize = totalPlayers - roomState.players.length;
      modeName = `تحدي ${totalTeamSize} ضد ${totalTeamSize}`;
    }

    setMatchConfig({ 
      teamSize: teamSize, 
      searchSize: searchSize,
      modeName: modeName,
      matchType: actualType
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleBackdropClick = () => setActiveMenu(null);

  const getAddMoreOptions = () => {
    const currentCount = roomState.players.length;
    const options = [{ label: 'لا (نكتفي بهذا العدد)', value: 0 }];
    
    if (currentCount <= 3) options.push({ label: 'نعم، شخص واحد إضافي', value: 1 });
    if (currentCount <= 2) options.push({ label: 'نعم، شخصين إضافيين', value: 2 });
    if (currentCount <= 1) options.push({ label: 'نعم، 3 أشخاص إضافيين', value: 3 });
    
    return options;
  };

  return (
    <div className="absolute inset-0 bg-[#0d0b1f] text-white flex flex-col h-full overflow-hidden font-sans" onClick={handleBackdropClick}>
      <TopBar className="flex-shrink-0" />

      {matchConfig && (
        <SearchingScreen 
          mode={roomState.mode}
          modeName={matchConfig.modeName}
          teamSize={matchConfig.teamSize}
          searchSize={matchConfig.searchSize}
          matchType={matchConfig.matchType}
          onCancel={() => setMatchConfig(null)}
        />
      )}

      {/* Solo/Group Selection - ONLY if player is alone */}
      {selectionStep === 'type' && roomState.players.length === 1 && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectionStep(null)} />
          <div className="relative w-full max-w-[280px] bg-[#1a1635] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg font-black text-center mb-6 text-white">اختر نوع اللعب</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleTypeSelect('solo')}
                className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-between px-6 hover:brightness-110 transition-all active:scale-95 shadow-lg group"
              >
                <span className="text-xl font-black text-white">فردي</span>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">👤</span>
              </button>
              <button 
                onClick={() => handleTypeSelect('group')}
                className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-between px-6 hover:brightness-110 transition-all active:scale-95 shadow-lg group"
              >
                <span className="text-xl font-black text-white">تعاوني</span>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">👥</span>
              </button>
            </div>
            <button 
              onClick={() => setSelectionStep(null)}
              className="w-full mt-6 py-2 text-white/30 text-xs font-bold hover:text-white transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Solo Count */}
      {selectionStep === 'solo_count' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectionStep(null)} />
          <div className="relative w-full max-w-[280px] bg-[#1a1635] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg font-black text-center mb-6 text-white">قديش بدك ضدك؟</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(count => (
                <button 
                  key={count}
                  onClick={() => startMatchSearch('solo', count)}
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-95 shadow-md"
                >
                  <span className="text-lg font-black text-white">
                    {count === 1 ? 'شخص واحد' : count === 2 ? 'شخصين' : `${count} أشخاص`}
                  </span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectionStep('type')}
              className="w-full mt-6 py-2 text-white/30 text-xs font-bold hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>→</span> رجوع
            </button>
          </div>
        </div>
      )}

      {/* Group Count */}
      {selectionStep === 'group_count' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectionStep(null)} />
          <div className="relative w-full max-w-[280px] bg-[#1a1635] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg font-black text-center mb-6 text-white">كم شخص معك؟</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(count => (
                <button 
                  key={count}
                  onClick={() => startMatchSearch('group', count)}
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center hover:bg-purple-600 hover:border-purple-500 transition-all active:scale-95 shadow-md"
                >
                  <span className="text-lg font-black text-white">
                    {count === 1 ? 'شخص واحد' : count === 2 ? 'شخصين' : `${count} أشخاص`}
                  </span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectionStep('type')}
              className="w-full mt-6 py-2 text-white/30 text-xs font-bold hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>→</span> رجوع
            </button>
          </div>
        </div>
      )}

      {/* Add More (Multiplayer Lobby) */}
      {selectionStep === 'add_more' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectionStep(null)} />
          <div className="relative w-full max-w-[280px] bg-[#1a1635] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg font-black text-center mb-6 text-white leading-tight">هل تريد أشخاصاً معكم أيضاً؟</h3>
            <div className="space-y-3">
              {getAddMoreOptions().map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => startMatchSearch('group', opt.value)}
                  className={`w-full h-14 border rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-md ${
                    opt.value === 0 
                    ? 'bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/30' 
                    : 'bg-white/5 border-white/5 hover:bg-blue-600 hover:border-blue-500'
                  }`}
                >
                  <span className="text-[13px] font-black text-white">{opt.label}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setSelectionStep(null)}
              className="w-full mt-6 py-2 text-white/30 text-xs font-bold hover:text-white transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-blue-600/90 backdrop-blur-md text-white px-6 py-2 rounded-full shadow-2xl animate-in slide-in-from-top duration-300 font-bold text-xs whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="flex-1 px-6 flex flex-col items-center justify-center min-h-0">
        <div className={`grid ${roomState.players.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 w-full max-w-[210px]`}>
          {roomState.players.slice(0, 4).map((player) => (
            <div 
              key={player.id}
              className="relative aspect-square w-full bg-[#1a1635] rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center p-3 shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all duration-300"
            >
              {player.isLeader && (
                <div className="absolute -top-1.5 -right-1.5 text-xl drop-shadow-xl z-10">👑</div>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === player.id ? null : player.id);
                }}
                className="absolute top-2 left-2 w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all z-20"
              >
                ⋮
              </button>
              {activeMenu === player.id && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)} />
                  <div className="absolute top-9 left-2 bg-[#1a1635] border border-white/10 rounded-xl shadow-2xl py-1.5 w-32 z-40 animate-in fade-in zoom-in duration-150 origin-top-left overflow-hidden">
                    {player.id === 'you' ? (
                      <>
                        <button 
                          onClick={() => {
                            setIsMuted(!isMuted);
                            setActiveMenu(null);
                          }}
                          className="w-full text-right px-4 py-2 text-[10px] font-bold text-white/80 hover:bg-white/5 transition-colors border-b border-white/5"
                        >
                          {isMuted ? 'إلغاء كتم المايك' : 'كتم المايك 🎙️'}
                        </button>
                        {roomState.players.length > 1 && (
                          <button 
                            onClick={() => {
                              showToast('جاري الخروج من اللوبي...');
                              setActiveMenu(null);
                              setTimeout(() => {
                                setRoomState(prev => ({
                                  ...prev,
                                  players: prev.players.filter(p => p.id === 'you'),
                                  isLeader: true
                                }));
                              }, 1000);
                            }}
                            className="w-full text-right px-4 py-2 text-[10px] font-bold text-red-400 hover:bg-red-400/5 transition-colors"
                          >
                            الخروج من اللوبي
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleAction('mute', player)}
                          className="w-full text-right px-4 py-2 text-[10px] font-bold text-white/80 hover:bg-white/5 transition-colors"
                        >
                          {mutedPlayers.includes(player.id) ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                        </button>
                        <button 
                          onClick={() => handleAction('addFriend', player)}
                          className="w-full text-right px-4 py-2 text-[10px] font-bold text-white/80 hover:bg-white/5 transition-colors"
                        >
                          {friends.some(f => f.name === player.name && f.isFriend) ? 'إلغاء طلب الصداقة' : 'إضافة صديق'}
                        </button>
                        {roomState.isLeader && (
                          <>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button 
                              onClick={() => handleAction('transfer', player)}
                              className="w-full text-right px-4 py-2 text-[10px] font-bold text-yellow-500 hover:bg-yellow-500/5 transition-colors"
                            >
                              نقل القيادة
                            </button>
                            <button 
                              onClick={() => handleAction('kick', player)}
                              className="w-full text-right px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/5 transition-colors"
                            >
                              طرد اللاعب
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-xl bg-blue-500 overflow-hidden shadow-lg shadow-blue-500/20">
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-[#1a1635] rounded-full" />
                {player.isReady && (
                  <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#1a1635] shadow-lg animate-in zoom-in duration-300 z-20">
                    <span className="text-[10px] font-bold text-white">✓</span>
                  </div>
                )}
                {((player.id === 'you' && isMuted) || (player.id !== 'you' && mutedPlayers.includes(player.id))) && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center shadow-lg border border-[#1a1635] z-20">
                    <span className="text-[10px]">🔇</span>
                  </div>
                )}
              </div>
              <span className="font-black text-xs mt-1">
                {player.id === 'you' ? 'أنت' : player.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-4 space-y-1 flex-shrink-0">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="w-full bg-[#1a1635] border border-white/5 py-2.5 rounded-xl flex items-center justify-between px-5 group active:scale-95 transition-all shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-base">👥</span>
            <span className="font-black text-xs text-white/80 tracking-tight">الأصدقاء</span>
          </div>
          <span className="bg-green-500/80 text-white text-[9px] px-2 py-0.5 rounded-lg font-bold">
            {friends.filter(f => f.status === 'متصل').length} متصل
          </span>
        </button>

        <div 
          onClick={() => showScreen('modes')}
          className="w-full bg-[#1a1635] border border-white/5 py-2.5 px-4 rounded-xl flex items-center justify-between group cursor-pointer active:scale-95 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-lg shadow-lg">🧩</div>
            <div>
              <div className="font-black text-xs text-white leading-tight">{roomState.mode}</div>
              <div className="text-[8px] text-white/40 font-bold tracking-tight">تحدي السرعة والذكاء</div>
            </div>
          </div>
          <div className="text-sm text-white/20 group-hover:text-blue-400 transition-colors">←</div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsChatOpen(true)}
            className="flex-1 h-11 bg-[#1a1635] border border-white/5 rounded-xl flex items-center justify-center text-xl active:scale-95 transition-all shadow-md"
          >
            💬
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsGameSoundMuted(!isGameSoundMuted); }}
            className={`flex-1 h-11 border rounded-xl flex items-center justify-center text-xl active:scale-95 transition-all shadow-md ${
              isGameSoundMuted ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-inner' : 'bg-[#1a1635] border-white/5'
            }`}
          >
            {isGameSoundMuted ? '🔇' : '🔊'}
          </button>
        </div>

        <div className="flex w-full pt-1">
          {roomState.players.find(p => p.id === 'you')?.isReady ? (
            <button 
              onClick={handleStartGame}
              disabled={isSearching}
              className={`w-full ${isSearching ? 'bg-blue-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'} text-white h-12 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all relative overflow-hidden`}
            >
              {isSearching ? (
                <>
                  <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  <span className="font-black text-sm relative z-10">
                    جاري البحث... {Math.floor(searchTime / 60)}:{String(searchTime % 60).padStart(2, '0')}
                  </span>
                </>
              ) : (
                <span className="font-black text-base">بدء التحدي</span>
              )}
            </button>
          ) : (
            <button 
              onClick={handleReady}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 h-12 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <span className="font-black text-base">مستعد</span>
            </button>
          )}
        </div>
      </div>

      <FriendsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <LobbyChat 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default LobbyScreen;
