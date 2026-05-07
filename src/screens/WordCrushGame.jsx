import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import ResultsScreen from './ResultsScreen';

const puzzles = [
  {
    words: ['إبرة', 'دواء', 'مصل', 'حقنة'],
    grid: [
      ['ح', 'ق', 'ن', 'ة'],
      ['د', 'و', 'ا', 'ء'],
      ['إ', 'ب', 'ر', 'ة'],
      ['م', 'ص', 'ل', 'ط'],
    ].map(row => row.sort(() => Math.random() - 0.5)) // Shuffling each row
  },
  {
    words: ['شمس', 'نور', 'دفء', 'نهار'],
    grid: [
      ['ن', 'ه', 'ا', 'ر'],
      ['ش', 'م', 'س', 'د'],
      ['ن', 'و', 'ر', 'ف'],
      ['د', 'ف', 'ء', 'ل'],
    ].map(row => row.sort(() => Math.random() - 0.5))
  }
];

const WordCrushGame = () => {
  const { roomState, showScreen, isGameSoundMuted } = useGame();
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [scores, setScores] = useState(
    roomState.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  );
  const [coins, setCoins] = useState(100); // Default balance
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);

  const [hintedLetters, setHintedLetters] = useState({}); // { word: [indices] }
  const [toast, setToast] = useState({ message: '', visible: false });

  const playSFX = (type) => {
    if (isGameSoundMuted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const g = ctx.createGain();
      g.connect(ctx.destination);
      
      if (type === 'click') {
        const osc = ctx.createOscillator();
        osc.connect(g);
        osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(f, now + i * 0.1);
          gain.gain.setValueAtTime(0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
        });
      } else if (type === 'hint') {
        const osc = ctx.createOscillator();
        osc.connect(g);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  };

  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      setGameFinished(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Simulate other players scoring
  useEffect(() => {
    const interval = setInterval(() => {
      const otherPlayers = roomState.players.filter(p => p.id !== 'you');
      if (otherPlayers.length > 0 && Math.random() > 0.5) {
        const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        const puzzle = puzzles[currentPuzzle];
        const remainingWords = puzzle.words.filter(w => !foundWords.includes(w));
        
        if (remainingWords.length > 0) {
          const foundWord = remainingWords[0];
          setFoundWords(prev => [...prev, foundWord]);
          setScores(prev => ({ ...prev, [randomPlayer.id]: prev[randomPlayer.id] + 1 }));
          
          if (foundWords.length + 1 === puzzle.words.length) {
            setTimeout(() => {
              setFoundWords([]);
              setHintedLetters({});
              setCurrentPuzzle((currentPuzzle + 1) % puzzles.length);
            }, 1000);
          }
        }
      }
    }, 2500); 
    return () => clearInterval(interval);
  }, [roomState.players, currentPuzzle, foundWords]);

  const handleLetterClick = (char, rIdx, cIdx) => {
    playSFX('click');
    const pos = `${rIdx}-${cIdx}`;
    if (selectedLetters.find(l => l.pos === pos)) {
      setSelectedLetters(selectedLetters.filter(l => l.pos !== pos));
      return;
    }
    
    const newSelection = [...selectedLetters, { char, pos }];
    setSelectedLetters(newSelection);

    const currentString = newSelection.map(l => l.char).join('');
    const puzzle = puzzles[currentPuzzle];
    
    if (puzzle.words.includes(currentString) && !foundWords.includes(currentString)) {
      playSFX('success');
      setFoundWords([...foundWords, currentString]);
      setScores(prev => ({ ...prev, you: prev.you + 1 }));
      setSelectedLetters([]);

      if (foundWords.length + 1 === puzzle.words.length) {
        setTimeout(() => {
          setFoundWords([]);
          setHintedLetters({});
          setCurrentPuzzle((currentPuzzle + 1) % puzzles.length);
        }, 1000);
      }
    }
  };

  const handleHint = () => {
    if (coins < 10) {
      showToast('لا يوجد لديك رصيد كافي ⚠️');
      return;
    }

    const puzzle = puzzles[currentPuzzle];
    const remainingWords = puzzle.words.filter(w => !foundWords.includes(w));
    
    if (remainingWords.length > 0) {
      const targetWord = remainingWords[0];
      const revealed = hintedLetters[targetWord] || [];
      
      let nextIdx = -1;
      for (let i = 0; i < targetWord.length; i++) {
        if (!revealed.includes(i)) {
          nextIdx = i;
          break;
        }
      }

      if (nextIdx !== -1) {
        const charToHint = targetWord[nextIdx];
        
        // Find this character in the grid to simulate a click
        let foundPos = null;
        for (let r = 0; r < puzzle.grid.length; r++) {
          for (let c = 0; c < puzzle.grid[r].length; c++) {
            if (puzzle.grid[r][c] === charToHint) {
              const pos = `${r}-${c}`;
              if (!selectedLetters.find(l => l.pos === pos)) {
                foundPos = pos;
                break;
              }
            }
          }
          if (foundPos) break;
        }

        if (foundPos) {
          handleLetterClick(charToHint, parseInt(foundPos.split('-')[0]), parseInt(foundPos.split('-')[1]));
        }

        setHintedLetters(prev => ({
          ...prev,
          [targetWord]: [...(prev[targetWord] || []), nextIdx]
        }));
        setCoins(prev => prev - 10);
        playSFX('hint');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedPlayers = [...roomState.players].sort((a, b) => scores[b.id] - scores[a.id]);

  if (gameFinished) {
    return <ResultsScreen scores={scores} />;
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#005a5a] to-[#003333] text-white flex flex-col overflow-hidden animate-in fade-in duration-500 font-sans">
      {/* Top Bar - Refined Leaderboard */}
      <div className="px-4 pt-10 pb-3 flex items-center justify-between z-30 bg-black/20 backdrop-blur-md border-b border-white/10 shadow-lg">
        {/* Players Section - Closer together */}
        <div className="flex gap-2.5">
          {sortedPlayers.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-0.5 transition-all hover:scale-105">
              <span className={`text-[8px] font-black uppercase tracking-tighter ${player.id === 'you' ? 'text-yellow-400 animate-pulse' : 'text-white/40'}`}>
                {player.id === 'you' ? 'أنت' : player.name}
              </span>
              <div className="relative">
                <div className={`w-9 h-9 rounded-full border-2 border-white/20 overflow-hidden shadow-lg ${player.id === 'you' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[#000] text-[8px] font-black px-1.5 rounded-full border border-white shadow-sm">
                  {scores[player.id]}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Section - Coins ABOVE Timer */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Total Coins Balance - Match Lobby Style */}
          <div className="bg-black/40 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
            <span className="bg-yellow-400/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">💰</span>
            <span className="text-yellow-400 font-black text-xs">{coins}</span>
          </div>

          {/* Timer Section - Sleek Look */}
          <div className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 flex items-center gap-2 shadow-inner">
            <span className="text-white/80 font-black text-xs tabular-nums tracking-wider">{formatTime(timeLeft)}</span>
            <span className="text-red-400 text-[10px] animate-pulse">⏱️</span>
          </div>
        </div>
      </div>

      {/* 1. Hint Image Area - Smaller to save space */}
      <div className="h-[22%] flex flex-col items-center justify-center p-2">
        <div className="relative h-full aspect-square bg-[#002b2b]/40 rounded-2xl border-4 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <span className="text-6xl group-hover:scale-110 transition-transform duration-500">
            {currentPuzzle === 0 ? '💉' : '☀️'}
          </span>
        </div>
      </div>

      {/* 2. Word Bubbles Area */}
      <div className="px-4 py-1 flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-1 max-w-sm">
          {puzzles[currentPuzzle].words.map((word) => (
            <div 
              key={word}
              className={`px-2.5 py-1 rounded-full text-[9px] font-black border-2 transition-all duration-300 shadow-sm ${
                foundWords.includes(word) 
                  ? 'bg-[#a3e635] border-[#4d7c0f] text-[#064e3b] shadow-[0_2px_0_#4d7c0f]' 
                  : 'bg-[#134e4e] border-white/10 text-white/20'
              }`}
            >
              {foundWords.includes(word) 
                ? word 
                : word.split('').map((char, idx) => (hintedLetters[word]?.includes(idx) ? char : '_')).join(' ')
              }
            </div>
          ))}
        </div>
        
        {/* Current Selection Visualizer - The "Writing Space" */}
        <div className="h-10 w-full max-w-[200px] bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center gap-1.5 border border-white/5 shadow-inner">
          {selectedLetters.length > 0 ? (
            selectedLetters.map((l, i) => (
              <div key={i} className="w-7 h-7 bg-yellow-400 text-[#005a5a] font-black rounded-lg flex items-center justify-center text-sm animate-in zoom-in shadow-lg border border-yellow-200">
                {l.char}
              </div>
            ))
          ) : (
            <span className="text-white/20 text-[10px] font-bold italic">اختر الحروف...</span>
          )}
        </div>
      </div>

      {/* 3. The Colorful Grid - Tight & Smaller */}
      <div className="px-4 flex-1 flex flex-col items-center justify-start mt-2 mb-14">
        <div className="grid grid-cols-4 gap-0 max-w-[220px] mx-auto border-2 border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {puzzles[currentPuzzle].grid.map((row, rIdx) => 
            row.map((char, cIdx) => {
              const isSelected = selectedLetters.find(l => l.pos === `${rIdx}-${cIdx}`);
              const cellColors = [
                'bg-[#ff9f43]', // Orange
                'bg-[#28c76f]', // Green
                'bg-[#ea5455]', // Red/Pink
                'bg-[#ea5455]', // Re-using for symmetry
                'bg-[#00cfe8]', // Cyan
                'bg-[#f39c12]', // Yellow
              ];
              const colorClass = cellColors[(rIdx + cIdx) % cellColors.length];
              
              return (
                <button 
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleLetterClick(char, rIdx, cIdx)}
                  className={`w-11 h-11 flex items-center justify-center text-lg font-black transition-all transform active:scale-95 border-[0.5px] border-black/10 ${
                    isSelected 
                      ? 'bg-white text-[#005a5a] z-10 shadow-inner' 
                      : `${colorClass} text-white hover:brightness-105`
                  }`}
                >
                  {char}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer - Hint Button - Lowered and showing price 10 */}
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center z-40 pointer-events-none">
        <button 
          onClick={handleHint}
          className="pointer-events-auto group h-11 px-7 bg-white rounded-full flex items-center gap-3 shadow-[0_4px_0_#ccc] active:shadow-none active:translate-y-1 transition-all"
        >
          <span className="text-[#005a5a] font-black text-base">تلميح</span>
          <div className="flex items-center gap-1.5 bg-[#f1f5f9] px-2.5 py-1 rounded-full border border-slate-200">
            <span className="text-[10px]">💰</span>
            <span className="text-[#005a5a] font-black text-sm">10</span>
          </div>
        </button>
      </div>

      {/* Toast Notification - Centered on screen */}
      {toast.visible && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20 shadow-2xl animate-in zoom-in fade-in duration-300">
          <span className="text-white font-black text-sm text-center">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default WordCrushGame;
