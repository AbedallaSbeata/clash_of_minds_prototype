import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';

const ResultsScreen = ({ scores }) => {
  const { roomState, showScreen, restartGame, isGameSoundMuted } = useGame();

  const sortedPlayers = [...roomState.players].sort((a, b) => scores[b.id] - scores[a.id]);
  const isWinner = sortedPlayers[0].id === 'you';

  useEffect(() => {
    if (isGameSoundMuted) return;
    let ctx;
    let nodes = [];
    let stopped = false;

    const playWinLoop = (audioCtx) => {
      if (stopped) return;
      // Cheering/Applause
      for (let t = 0; t < 3; t += 0.1) {
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.2;
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500 + Math.random() * 500;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + t + 0.15);
        src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        src.start(audioCtx.currentTime + t);
        nodes.push(src);
      }
      // Loop every 4 seconds
      const timer = setTimeout(() => playWinLoop(audioCtx), 4000);
      nodes.push({ stop: () => clearTimeout(timer) });
    };

    const playSadLoop = (audioCtx) => {
      if (stopped) return;
      // Classic sad fail chime (C-Bb-Ab)
      [523.25, 466.16, 415.30].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.connect(g); g.connect(audioCtx.destination);
        osc.type = 'sine';
        const t = audioCtx.currentTime + i * 0.4;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.6);
        nodes.push(osc);
      });

      // Sad loop every 5 seconds
      const timer = setTimeout(() => playSadLoop(audioCtx), 5000);
      nodes.push({ stop: () => clearTimeout(timer) });
    };

    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (isWinner) playWinLoop(ctx);
      else playSadLoop(ctx);
    } catch (e) {}

    return () => {
      stopped = true;
      nodes.forEach(n => { try { n.stop(); } catch (e) {} });
      if (ctx) ctx.close();
    };
  }, [isWinner]);

  return (
    <div className="absolute inset-0 bg-[#0d0b1f] text-white flex flex-col overflow-hidden px-4">

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] rounded-full blur-[100px] pointer-events-none opacity-20"
        style={{ background: isWinner ? '#6366f1' : '#475569' }} />

      {/* Confetti - winner */}
      {isWinner && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="absolute animate-ping text-sm" style={{
              left: `${(i * 7 + 5) % 95}%`,
              top: `${(i * 11 + 3) % 80}%`,
              animationDuration: `${1.2 + (i % 3) * 0.6}s`,
              animationDelay: `${(i * 0.2) % 1.5}s`,
            }}>
              {['✨','🎊','⭐','🎉','💫'][i % 5]}
            </div>
          ))}
        </div>
      )}

      {/* Sad falling emojis - loser */}
      {!isWinner && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xl"
              style={{
                left: `${(i * 9 + 3) % 95}%`,
                top: '-10%',
                animation: `fall ${2.5 + (i % 4) * 0.7}s linear ${(i * 0.3) % 2.5}s infinite`,
                opacity: 0.35,
              }}
            >
              {['😢','💔','😞','🥺','😓'][i % 5]}
            </div>
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
              100% { transform: translateY(110vh) rotate(20deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col items-center pt-8 pb-2 shrink-0 relative z-10">
        {isWinner && <div className="text-4xl mb-1">🎉</div>}
        <h2 className={`font-black text-transparent bg-clip-text bg-gradient-to-b text-xl text-center ${
          isWinner ? 'from-yellow-300 to-yellow-600' : 'from-blue-300 to-blue-600'
        }`}>
          {isWinner ? '🏆 بطل.. أنت الأفضل!' : 'حظاً أوفر!'}
        </h2>
      </div>

      {/* Leaderboard - NO SCROLL, compact cards */}
      <div className="w-full flex flex-col gap-2 relative z-10 flex-1 justify-center py-2">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === 'you';
          const isFirst = index === 0;
          return (
            <div
              key={player.id}
              className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between ${
                isFirst
                  ? 'bg-gradient-to-r from-green-600 to-emerald-700 border-green-400/30'
                  : isMe
                    ? 'bg-white/10 border-yellow-400/50 ring-1 ring-yellow-400/40'
                    : 'bg-white/5 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-black w-5 text-center ${isFirst ? 'text-yellow-300' : isMe ? 'text-yellow-400' : 'text-white/30'}`}>
                  #{index + 1}
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/10 overflow-hidden relative shrink-0">
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                  {isFirst && <span className="absolute -top-1 -right-1 text-xs">🏆</span>}
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-black text-sm">{isMe ? 'أنت' : player.name}</span>
                  {isFirst && (
                    <span className="text-[10px] font-black text-yellow-300 tracking-wide">+10 نقاط</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-black">{scores[player.id]}</span>
                <span className="text-[9px] font-bold opacity-40">نقطة</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-2 shrink-0 pb-8 pt-2 relative z-10">
        <button
          onClick={() => restartGame()}
          className="w-full h-13 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-base"
        >
          🔄 جولة أخرى
        </button>
        <button
          onClick={() => showScreen('home')}
          className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-white/60 hover:bg-white/10 transition-all active:scale-95 text-sm"
        >
          العودة للوبي
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
