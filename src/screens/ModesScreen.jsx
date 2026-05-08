import React from 'react';
import { useGame } from '../context/GameContext';

const ModesScreen = () => {
  const { roomState, setRoomState, showScreen } = useGame();

  const games = [
    { id: 'crush', name: 'كلمات كراش', icon: '🧩', desc: 'تحدي السرعة والذكاء في تركيب الكلمات', color: 'from-indigo-500 to-purple-600' },
  ];

  const handleSelect = (game) => {
    if (game.locked) return;
    setRoomState(prev => ({ ...prev, mode: game.name }));
    showScreen('home');
  };

  return (
    <div className="absolute inset-0 bg-[#0d0b1f] text-white flex flex-col p-6 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => showScreen('home')}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          ←
        </button>
        <h1 className="text-2xl font-black tracking-tight">اختر اللعبة</h1>
      </div>

      {/* Games List */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-8 scrollbar-hide">
        {games.map((game) => (
          <div 
            key={game.id}
            onClick={() => handleSelect(game)}
            className={`relative w-full bg-[#1a1635] border rounded-[2rem] p-5 flex items-center gap-5 transition-all active:scale-95 shadow-xl ${
              game.locked ? 'opacity-50 border-white/5' : 'border-white/10 hover:border-blue-500/50 cursor-pointer'
            } ${roomState.mode === game.name ? 'border-blue-500 bg-blue-500/5' : ''}`}
          >
            {/* Game Icon */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl shadow-lg shrink-0`}>
              {game.icon}
            </div>

            {/* Game Info */}
            <div className="flex-1 text-right">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-lg">{game.name}</span>
                {game.locked && <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/40">قريباً</span>}
                {roomState.mode === game.name && <span className="text-blue-400 font-bold text-xs">مختار ✓</span>}
              </div>
              <p className="text-xs text-white/40 font-bold leading-relaxed">{game.desc}</p>
            </div>

            {/* Selection indicator for the current game */}
            {roomState.mode === game.name && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center py-4">
        <p className="text-[10px] text-white/20 font-bold italic">سيتم إضافة المزيد من الألعاب التنافسية قريباً جداً!</p>
      </div>
    </div>
  );
};

export default ModesScreen;
