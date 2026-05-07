import React from 'react';
import { useGame } from '../context/GameContext';

const SplashScreen = () => {
  const { showScreen } = useGame();

  return (
    <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-500/20 blur-xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />
          <div className="text-8xl mb-4">🧠</div>
          <h1 className="text-6xl font-black text-white mb-2 drop-shadow-2xl">صراع العقول</h1>
          <p className="text-2xl text-yellow-400 font-bold tracking-widest">CLASH OF MINDS</p>
          <p className="text-blue-300 mt-2 opacity-80 text-lg">تحدّى العالم — بدهائك</p>
        </div>

        <button
          onClick={() => showScreen('home')}
          className="pulse-btn bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-slate-900 font-black px-12 py-5 rounded-2xl text-2xl shadow-[0_0_40px_rgba(250,204,21,0.3)] transition-all flex items-center gap-4"
        >
          <span>ابدأ اللعب</span>
          <span className="text-3xl">←</span>
        </button>

        <p className="text-slate-500 font-medium pt-8">نسخة تجريبية · Prototype v0.1</p>
      </div>
    </div>
  );
};

export default SplashScreen;
