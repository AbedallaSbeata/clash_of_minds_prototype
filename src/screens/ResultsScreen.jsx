import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';

const ResultsScreen = ({ scores }) => {
  const { roomState, showScreen, restartGame, isGameSoundMuted, addCoins, addFriendToProfile, friends } = useGame();
  const [toast, setToast] = React.useState(null);
  const [pendingFriends, setPendingFriends] = React.useState([]);

  const handleAddFriend = (p) => {
    if (pendingFriends.includes(p.id)) return;
    
    setPendingFriends(prev => [...prev, p.id]);
    setToast(`تم إرسال طلب صداقة لـ ${p.name}`);
    
    setTimeout(() => {
      setToast(`✅ تم قبول الطلب! أصبح ${p.name} صديقك الآن`);
      addFriendToProfile(p.name);
      setTimeout(() => setToast(null), 2000);
    }, 1500);
  };

  const allPlayers = [...roomState.players, ...(roomState.opponents || [])];
  const isSolo = roomState.matchType === 'solo';

  const teamAScore = roomState.players.reduce((sum, p) => sum + (scores[p.id] || 0), 0);
  const teamBScore = (roomState.opponents || []).reduce((sum, p) => sum + (scores[p.id] || 0), 0);
  
  const isWinner = isSolo 
    ? scores['you'] === Math.max(...Object.values(scores))
    : teamAScore > teamBScore;

  useEffect(() => {
    if (isGameSoundMuted) return;
    let ctx;
    let nodes = [];
    let stopped = false;

    const playWinLoop = (audioCtx) => {
      if (stopped) return;
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
      const timer = setTimeout(() => playWinLoop(audioCtx), 4000);
      nodes.push({ stop: () => clearTimeout(timer) });
    };

    const playSadLoop = (audioCtx) => {
      if (stopped) return;
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
      const timer = setTimeout(() => playSadLoop(audioCtx), 5000);
      nodes.push({ stop: () => clearTimeout(timer) });
    };

    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (isWinner) playWinLoop(ctx);
      else playSadLoop(ctx);
    } catch (e) {}

    // Add coins if winner
    if (isWinner && !roomState.isPrivateRoom) {
      addCoins(isSolo ? 10 : 5);
    }

    return () => {
      stopped = true;
      nodes.forEach(n => { try { n.stop(); } catch (e) {} });
      if (ctx) ctx.close();
    };
  }, [isWinner]);

  return (
    <div className="absolute inset-0 bg-[#0d0b1f] text-white flex flex-col overflow-hidden px-4">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-blue-600/90 backdrop-blur-md text-white px-6 py-2 rounded-full shadow-2xl animate-in slide-in-from-top duration-300 font-bold text-[10px] whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] rounded-full blur-[100px] pointer-events-none opacity-20"
        style={{ background: isWinner ? '#6366f1' : '#475569' }} />

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

      {!isWinner && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute text-xl" style={{
              left: `${(i * 9 + 3) % 95}%`,
              top: '-10%',
              animation: `fall ${2.5 + (i % 4) * 0.7}s linear ${(i * 0.3) % 2.5}s infinite`,
              opacity: 0.35,
            }}>
              {['😢','💔','😞','🥺','😓'][i % 5]}
            </div>
          ))}
          <style>{`@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.4; } 100% { transform: translateY(110vh) rotate(20deg); opacity: 0; } }`}</style>
        </div>
      )}

      <div className="flex flex-col items-center pt-10 pb-2 shrink-0 relative z-10">
        <h2 className={`font-black text-transparent bg-clip-text bg-gradient-to-b text-2xl text-center ${
          isWinner ? 'from-yellow-300 to-yellow-600' : 'from-blue-300 to-blue-600'
        }`}>
          {isWinner ? (isSolo ? '👑 بطل الجولة!' : '🏆 فريق أسطوري!') : 'حظاً أوفر!'}
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 relative z-10 py-4 overflow-y-auto no-scrollbar">
        {isSolo ? (
          /* Solo Results: Individual Ranking */
          <div className="w-full max-w-[300px] space-y-2">
            {allPlayers.sort((a, b) => scores[b.id] - scores[a.id]).map((p, idx) => {
              const isAlreadyFriend = friends.some(f => f.name === p.name && f.isFriend);
              const isYou = p.id === 'you';
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                  idx === 0 ? 'bg-yellow-500/20 border-yellow-500 shadow-lg scale-105' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 font-black text-[10px]">
                    {idx + 1}
                  </div>
                  <div className={`w-10 h-10 rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-yellow-500' : 'border-white/20'}`}>
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-xs">{isYou ? 'أنت' : p.name}</div>
                    <div className="text-[10px] text-white/40 font-bold">{scores[p.id]} كلمة</div>
                  </div>
                  {!isYou && !isAlreadyFriend && !pendingFriends.includes(p.id) && (
                    <button 
                      onClick={() => handleAddFriend(p)}
                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs shadow-lg border border-white"
                    >
                      ➕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Group Results: Team vs Team */
          <>
            <div className={`w-full max-w-[280px] p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all ${isWinner ? 'bg-green-600/20 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10 opacity-60'}`}>
              <div className="flex justify-between items-center px-1">
                <span className={`font-black text-xs ${isWinner ? 'text-green-400' : 'text-white/40'}`}>فريقك</span>
                <span className="text-2xl font-black">{teamAScore}</span>
              </div>
              <div className="flex gap-2">
                {roomState.players.map(p => (
                  <div key={p.id} className="relative group">
                    <div className={`w-10 h-10 rounded-xl overflow-hidden border-2 ${isWinner ? 'border-green-400' : 'border-white/20'}`}>
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[7px] font-black px-1 rounded-full border border-white">
                      {scores[p.id]}
                    </div>
                  </div>
                ))}
              </div>
              {isWinner && (
                <div className="bg-yellow-400/20 px-3 py-1 rounded-full self-start flex items-center gap-1.5">
                  <span className="text-yellow-400 font-black text-[9px] uppercase">
                    {roomState.isPrivateRoom ? '0 نقطة (غرفة خاصة)' : '+5 نقاط لكل لاعب'}
                  </span>
                  <span className="text-xs">🏆</span>
                </div>
              )}
            </div>

            <div className={`w-full max-w-[280px] p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all ${!isWinner ? 'bg-green-600/20 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10 opacity-60'}`}>
              <div className="flex justify-between items-center px-1">
                <span className={`font-black text-xs ${!isWinner ? 'text-green-400' : 'text-white/40'}`}>الفريق المنافس</span>
                <span className="text-2xl font-black">{teamBScore}</span>
              </div>
              <div className="flex gap-2">
                {(roomState.opponents || []).map(p => {
                  const isAlreadyFriend = friends.some(f => f.name === p.name && f.isFriend);
                  return (
                    <div key={p.id} className="relative group">
                      <div className={`w-10 h-10 rounded-xl overflow-hidden border-2 ${!isWinner ? 'border-green-400' : 'border-white/20'}`}>
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[7px] font-black px-1 rounded-full border border-white">
                        {scores[p.id]}
                      </div>
                      {!isAlreadyFriend && !pendingFriends.includes(p.id) && (
                        <button 
                          onClick={() => handleAddFriend(p)}
                          className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] shadow-lg border border-white active:scale-95 transition-transform"
                        >
                          ➕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

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
