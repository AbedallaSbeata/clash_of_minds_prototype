import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [coins, setCoins] = useState(250);
  const [activeScreen, setActiveScreen] = useState('splash');
  const [gameKey, setGameKey] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isGameSoundMuted, setIsGameSoundMuted] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'أحمد',
    username: 'ahmad_99',
    level: 8,
    avatar: 'https://i.pravatar.cc/150?u=you',
    xp: 650,
    maxXp: 1000,
    stats: {
      wins: 45,
      games: 120,
      coins: 250
    },
    achievements: [
      { id: 1, title: 'القناص', icon: '🎯', desc: 'إيجاد 10 كلمات في دقيقة' },
      { id: 2, title: 'الأسطورة', icon: '👑', desc: 'الفوز في 10 جولات متتالية' },
      { id: 3, title: 'الذكي', icon: '🧠', desc: 'حل لغز صعب بدون تلميحات' }
    ],
    lastWheelSpin: null
  });

  const addCoins = (amount) => {
    setCoins(prev => prev + amount);
    setUserProfile(prev => ({
      ...prev,
      stats: { ...prev.stats, coins: prev.stats.coins + amount }
    }));
  };

  const updateProfile = (newData) => {
    setUserProfile(prev => ({ ...prev, ...newData }));
  };
  const [mutedPlayers, setMutedPlayers] = useState([]); // Track IDs of muted players
  const [friends, setFriends] = useState([
    { id: 1, name: 'سارة', status: 'متصل', avatar: 'https://i.pravatar.cc/150?u=sara', isFriend: true, level: 12 },
    { id: 2, name: 'عمر', status: 'في تحدي', avatar: 'https://i.pravatar.cc/150?u=omar', isFriend: true, level: 8 },
    { id: 3, name: 'ليلى', status: 'غير متصل', avatar: 'https://i.pravatar.cc/150?u=layla', isFriend: true, level: 15 }
  ]);

  const [roomState, setRoomState] = useState({
    id: '123-456',
    mode: 'كلمات كراش',
    players: [
      { id: 'you', name: 'أنت', avatar: 'https://i.pravatar.cc/150?u=you', isLeader: true, isReady: false }
    ],
    isLeader: true
  });

  // Action: Kick Player
  const kickPlayer = (playerId) => {
    setRoomState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
    // If kicked, we need to notify sidebar (this is handled by roomState dependency)
  };

  // Action: Toggle Mute
  const toggleMutePlayer = (playerId) => {
    setMutedPlayers(prev => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  // Action: Transfer Leadership
  const transferLeadership = (newLeaderId) => {
    setRoomState(prev => ({
      ...prev,
      isLeader: false,
      players: prev.players.map(p => ({
        ...p,
        isLeader: p.id === newLeaderId
      }))
    }));
  };

  // Action: Add Friend
  const addFriendToProfile = (playerName) => {
    setFriends(prev => {
      const existing = prev.find(f => f.name === playerName);
      if (existing) {
        return prev.map(f => f.name === playerName ? { ...f, isFriend: true } : f);
      }
      return [...prev, { id: Date.now(), name: playerName, status: 'متصل', avatar: `https://i.pravatar.cc/150?u=${playerName}`, isFriend: true, level: 1 }];
    });
  };

  // Action: Remove Friend
  const removeFriendFromProfile = (playerName) => {
    setFriends(prev => prev.filter(f => f.name !== playerName));
  };

  const showScreen = (screenId) => setActiveScreen(screenId);

  const restartGame = () => {
    setGameKey(prev => prev + 1);
    setActiveScreen('game');
  };

  return (
    <GameContext.Provider value={{
      coins,
      addCoins,
      activeScreen,
      showScreen,
      gameKey,
      restartGame,
      userProfile,
      updateProfile,
      roomState,
      setRoomState,
      isMuted,
      setIsMuted,
      isGameSoundMuted,
      setIsGameSoundMuted,
      mutedPlayers,
      kickPlayer,
      toggleMutePlayer,
      transferLeadership,
      friends,
      setFriends,
      addFriendToProfile,
      removeFriendFromProfile
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
