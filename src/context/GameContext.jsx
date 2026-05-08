import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [coins, setCoins] = useState(100);
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
  const [mutedPlayers, setMutedPlayers] = useState([]); 
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
    isLeader: true,
    isPrivateRoom: false,
    matchType: 'group',
    opponents: [],
    privateRoomConfig: {
      teamA: [], 
      teamB: [], 
      maxSize: 4 
    }
  });

  const kickPlayer = (playerId) => {
    setRoomState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
  };

  const toggleMutePlayer = (playerId) => {
    setMutedPlayers(prev => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

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

  const addFriendToProfile = (playerName) => {
    setFriends(prev => {
      const existing = prev.find(f => f.name === playerName);
      if (existing) {
        return prev.map(f => f.name === playerName ? { ...f, isFriend: true } : f);
      }
      return [...prev, { id: Date.now(), name: playerName, status: 'متصل', avatar: `https://i.pravatar.cc/150?u=${playerName}`, isFriend: true, level: 1 }];
    });
  };

  const removeFriendFromProfile = (playerName) => {
    setFriends(prev => prev.filter(f => f.name !== playerName));
  };

  const createPrivateRoom = (matchType = 'group') => {
    if (coins < 100) return false;
    
    setCoins(prev => prev - 100);
    setUserProfile(prev => ({
      ...prev,
      stats: { ...prev.stats, coins: prev.stats.coins - 100 }
    }));
    
    setRoomState(prev => {
      const you = prev.players.find(p => p.id === 'you');
      const leaderYou = { ...you, isLeader: true, isReady: true };
      
      return {
        ...prev,
        isPrivateRoom: true,
        matchType: matchType,
        isLeader: true,
        players: [leaderYou],
        privateRoomConfig: {
          teamA: [leaderYou],
          teamB: [],
          maxSize: 4
        },
        opponents: []
      };
    });
    
    return true;
  };

  const movePlayerToTeam = (playerId, team) => {
    setRoomState(prev => {
      const player = [...prev.privateRoomConfig.teamA, ...prev.privateRoomConfig.teamB].find(p => p.id === playerId);
      if (!player) return prev;

      const newTeamA = team === 'A' 
        ? [...prev.privateRoomConfig.teamA, player] 
        : prev.privateRoomConfig.teamA.filter(p => p.id !== playerId);
      
      const newTeamB = team === 'B' 
        ? [...prev.privateRoomConfig.teamB, player] 
        : prev.privateRoomConfig.teamB.filter(p => p.id !== playerId);

      return {
        ...prev,
        privateRoomConfig: {
          ...prev.privateRoomConfig,
          teamA: newTeamA,
          teamB: newTeamB
        }
      };
    });
  };

  const joinPrivateRoom = (player, team = 'A') => {
    setRoomState(prev => {
      if (prev.privateRoomConfig.teamA.length + prev.privateRoomConfig.teamB.length >= 8) return prev;
      
      const newTeamA = team === 'A' ? [...prev.privateRoomConfig.teamA, player] : prev.privateRoomConfig.teamA;
      const newTeamB = team === 'B' ? [...prev.privateRoomConfig.teamB, player] : prev.privateRoomConfig.teamB;

      return {
        ...prev,
        privateRoomConfig: {
          ...prev.privateRoomConfig,
          teamA: newTeamA,
          teamB: newTeamB
        }
      };
    });
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
      removeFriendFromProfile,
      createPrivateRoom,
      movePlayerToTeam,
      joinPrivateRoom
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
