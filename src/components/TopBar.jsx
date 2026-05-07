import React from 'react';
import { useGame } from '../context/GameContext';

const TopBar = ({ className = "" }) => {
  const { coins, userProfile, showScreen, roomState, isMuted } = useGame();

  return (
    <div className={`flex items-start justify-between p-4 z-50 ${className}`}>
      {/* Right side visually: Profile */}
      <div 
        onClick={() => showScreen('profile')}
        className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 pr-3 rounded-full cursor-pointer hover:bg-black/60 transition-all"
      >
        <div className="text-right">
          <div className="text-white font-black text-[10px] leading-none mb-0.5">{userProfile.name}</div>
          <div className="text-blue-400 font-bold text-[8px] uppercase tracking-widest">مستوى {userProfile.level}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white/10 overflow-hidden shadow-lg relative">
          <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Left side visually: Coins only */}
      <div className="flex flex-col gap-2 items-end">
        <div className="bg-black/40 border border-white/5 rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="bg-yellow-400/20 w-6 h-6 rounded-full flex items-center justify-center text-xs">💰</span>
          <span className="text-yellow-400 font-black text-base">{coins}</span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
