import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

const randomOpponents = [
  { name: 'أحمد', avatar: 'https://i.pravatar.cc/150?u=ahmad' },
  { name: 'محمد', avatar: 'https://i.pravatar.cc/150?u=mohamad' },
  { name: 'يوسف', avatar: 'https://i.pravatar.cc/150?u=yousef' },
  { name: 'زياد', avatar: 'https://i.pravatar.cc/150?u=ziad' },
  { name: 'علي', avatar: 'https://i.pravatar.cc/150?u=ali' },
  { name: 'خالد', avatar: 'https://i.pravatar.cc/150?u=khaled' },
  { name: 'ليلى', avatar: 'https://i.pravatar.cc/150?u=layla' },
];

const SearchingScreen = ({ mode, modeName, teamSize, opponentSize, onCancel }) => {
  const { roomState, setRoomState } = useGame();
  const [dots, setDots] = useState('');
  const [foundPlayers, setFoundPlayers] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // محاكاة البحث لمدة 3 ثوانٍ
    const timer = setTimeout(() => {
      // اختيار خصوم عشوائيين بناءً على العدد المطلوب
      const selected = [...randomOpponents]
        .sort(() => 0.5 - Math.random())
        .slice(0, opponentSize);
      
      const newPlayers = selected.map((opp, index) => ({
        id: `random-${Date.now()}-${index}`,
        name: opp.name,
        avatar: opp.avatar,
        isLeader: false,
        isReady: true // جعلهم مستعدين تلقائياً
      }));

      // عرض اللاعبين الذين تم العثور عليهم
      setFoundPlayers(newPlayers);

      // انتظار ثانية ونصف قبل العودة للوبي لإظهار النتيجة
      setTimeout(() => {
        setRoomState(prev => ({
          ...prev,
          players: [...prev.players, ...newPlayers]
        }));
        onCancel(); // إغلاق شاشة البحث والعودة للوبي
      }, 1500);

    }, 3000);

    return () => clearTimeout(timer);
  }, [opponentSize, setRoomState, onCancel]);

  const allPlayers = [
    ...roomState.players.slice(0, teamSize).map(p => ({ type: 'player', data: p })),
    ...(foundPlayers.length > 0 
        ? foundPlayers.map(p => ({ type: 'player', data: p })) 
        : Array(opponentSize).fill({ type: 'searching' }))
  ];

  return (
    <div className="absolute inset-0 bg-[#0d0b1f] z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      {/* Background Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />

      {/* Header */}
      <div className="text-center mb-12 relative">
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">جاري البحث عن خصوم{dots}</h2>
        <div className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-sm font-bold border border-blue-500/30">
          {mode} • {modeName}
        </div>
      </div>

      {/* Matching visualization - FFA Style */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-16 px-2 w-full max-w-[350px]">
        {allPlayers.map((player, index) => (
          <React.Fragment key={index}>
            {/* Player / Opponent Avatar */}
            <div className="flex flex-col items-center gap-2">
              {player.type === 'player' ? (
                <div 
                  className="w-14 h-14 rounded-2xl bg-blue-600 border-2 border-white/10 overflow-hidden shadow-xl animate-bounce" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img src={player.data.avatar} alt={player.data.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="w-14 h-14 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-2xl text-white/20 animate-pulse" 
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  ?
                </div>
              )}
              <span className={`text-[10px] font-bold ${player.type === 'player' ? 'text-blue-400' : 'text-white/30'}`}>
                {player.type === 'player' ? (player.data.id === 'you' ? 'أنت' : player.data.name) : 'يبحث...'}
              </span>
            </div>

            {/* VS Divider (except for last item) */}
            {index < allPlayers.length - 1 && (
              <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 font-black italic text-[8px] shadow-[0_0_10px_rgba(239,68,68,0.3)] z-10 shrink-0">
                VS
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Cancel Button */}
      <button 
        onClick={onCancel}
        className="relative z-[110] w-full max-w-[200px] h-12 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all active:scale-95 cursor-pointer shadow-lg"
      >
        إلغاء البحث
      </button>

      {/* Progress Tip */}
      <p className="mt-8 text-white/30 text-[10px] text-center max-w-[200px]">
        يتم الآن البحث عن لاعبين بمستوى مهارة مماثل لضمان تجربة لعب ممتعة
      </p>
    </div>
  );
};

export default SearchingScreen;
