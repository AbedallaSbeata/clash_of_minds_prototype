import React, { useEffect, useRef } from 'react';
import { useGame, GameProvider } from './context/GameContext';
import SplashScreen from './screens/SplashScreen';
import LobbyScreen from './screens/LobbyScreen';
import ModesScreen from './screens/ModesScreen';
import WordCrushGame from './screens/WordCrushGame';
import ProfileScreen from './screens/ProfileScreen';
import PrivateRoomScreen from './screens/PrivateRoomScreen';
import MobileWrapper from './components/MobileWrapper';

const BackgroundMusic = () => {
  const { isGameSoundMuted, activeScreen } = useGame();
  const audioCtx = useRef(null);

  useEffect(() => {
    if (isGameSoundMuted || activeScreen === 'splash') {
      if (audioCtx.current) audioCtx.current.close();
      audioCtx.current = null;
      return;
    }

    const startBGM = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.current = ctx;
        
        const playLoop = () => {
          if (!audioCtx.current) return;
          const now = audioCtx.current.currentTime;
          // Simple relaxing synth loop
          [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const osc = audioCtx.current.createOscillator();
            const g = audioCtx.current.createGain();
            osc.connect(g); g.connect(audioCtx.current.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            g.gain.setValueAtTime(0, now + i * 2);
            g.gain.linearRampToValueAtTime(0.15, now + i * 2 + 1);
            g.gain.linearRampToValueAtTime(0, now + i * 2 + 2);
            osc.start(now + i * 2);
            osc.stop(now + i * 2 + 2);
          });
          setTimeout(playLoop, 8000);
        };
        playLoop();
      } catch (e) {}
    };

    const handleInteraction = () => {
      if (!audioCtx.current) startBGM();
      window.removeEventListener('click', handleInteraction);
    };
    
    window.addEventListener('click', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      if (audioCtx.current) audioCtx.current.close();
    };
  }, [isGameSoundMuted, activeScreen]);

  return null;
};

const AppContent = () => {
  const { activeScreen, gameKey } = useGame();

  return (
    <div className="w-full h-full min-h-screen">
      <BackgroundMusic />
      {activeScreen === 'splash' && <SplashScreen />}
      {activeScreen === 'home' && <LobbyScreen />}
      {activeScreen === 'modes' && <ModesScreen />}
      {activeScreen === 'game' && <WordCrushGame key={gameKey} />}
      {activeScreen === 'profile' && <ProfileScreen />}
      {activeScreen === 'private_room' && <PrivateRoomScreen />}
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <MobileWrapper>
        <AppContent />
      </MobileWrapper>
    </GameProvider>
  );
}

export default App;
