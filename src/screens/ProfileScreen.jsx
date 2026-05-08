import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const ProfileScreen = () => {
  const { userProfile, updateProfile, showScreen, addFriendToProfile, friends, coins, createPrivateRoom, setRoomState } = useGame();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userProfile.name);
  const [tempAvatar, setTempAvatar] = useState(userProfile.avatar);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    updateProfile({ name: tempName, avatar: tempAvatar });
    setIsEditing(false);
  };

  const handleCreatePrivate = () => {
    const success = createPrivateRoom();
    if (success) {
      showToast('✅ تم إنشاء غرفة خاصة بنجاح (-100 نقطة)');
      setTimeout(() => showScreen('private_room'), 1000);
    } else {
      showToast('⚠️ رصيدك غير كافٍ! تحتاج 100 نقطة');
    }
  };

  const handleJoinPrivate = () => {
    if (!roomCode.trim()) {
      showToast('⚠️ يرجى إدخال رمز الغرفة');
      return;
    }
    showToast('جاري الانضمام للغرفة...');
    
    // Simulate joining an existing room after a short delay
    setTimeout(() => {
      setRoomState(prev => ({
        ...prev,
        isPrivateRoom: true,
        isLeader: false, // You are NOT the leader when joining
        privateRoomConfig: {
          teamA: [
            { id: 'leader_123', name: 'صاحب الغرفة', avatar: 'https://i.pravatar.cc/150?u=admin', isReady: true, isLeader: true },
            { id: 'you', name: 'أنت', avatar: userProfile.avatar, isReady: true, isLeader: false }
          ],
          teamB: []
        }
      }));
      showScreen('private_room');
    }, 1000);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Simulate finding a user with stats and achievements
    const found = {
      name: searchQuery,
      username: searchQuery + '_fan',
      level: Math.floor(Math.random() * 20) + 1,
      avatar: `https://i.pravatar.cc/150?u=${searchQuery}`,
      isFriend: friends.some(f => f.name === searchQuery && f.isFriend),
      stats: { wins: 32, games: 80, coins: 150 },
      achievements: [
        { id: 1, title: 'القناص', icon: '🎯', desc: 'إيجاد 10 كلمات في دقيقة' },
        { id: 3, title: 'الذكي', icon: '🧠', desc: 'حل لغز صعب بدون تلميحات' }
      ]
    };
    setSearchedUser(found);
  };

  const toggleFriend = (user) => {
    addFriendToProfile(user.name);
    setSearchedUser(prev => ({ ...prev, isFriend: true }));
  };

  return (
    <div className="absolute inset-0 bg-[#0d0b1f] text-white flex flex-col overflow-y-auto animate-in slide-in-from-bottom duration-500 font-sans scrollbar-hide pb-20">
      {/* Header with Glassmorphism */}
      <div className="sticky top-0 z-[60] bg-[#0d0b1f]/80 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 px-6 py-2 rounded-full shadow-2xl animate-in slide-in-from-top duration-300 font-bold text-[10px] whitespace-nowrap">
            {toast}
          </div>
        )}
        <button 
          onClick={() => {
            if (searchedUser) setSearchedUser(null);
            else showScreen('home');
          }}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90"
        >
          ←
        </button>
        <h1 className="text-xl font-black">{searchedUser ? 'ملف تعريف' : 'ملفي الشخصي'}</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 py-8">
        {searchedUser ? (
          /* Searched User View */
          <div className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl">
                  <img src={searchedUser.avatar} className="w-full h-full rounded-[2.3rem] object-cover" alt="" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full font-black text-xs shadow-lg">
                  مستوى {searchedUser.level}
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black mb-1">{searchedUser.name}</h2>
                <span className="text-white/40 font-bold text-sm">@{searchedUser.username}</span>
              </div>
            </div>

            <div className="flex gap-4 w-full px-2">
              <div className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                <div className="text-yellow-400 font-black text-lg">{searchedUser.stats.wins}</div>
                <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">فوز</div>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                <div className="text-blue-400 font-black text-lg">{searchedUser.stats.games}</div>
                <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">لعبة</div>
              </div>
            </div>

            <button 
              onClick={() => toggleFriend(searchedUser)}
              disabled={searchedUser.isFriend}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                searchedUser.isFriend 
                ? 'bg-white/5 border border-white/10 text-white/40' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/30'
              }`}
            >
              {searchedUser.isFriend ? '✓ صديقك' : 'إضافة صديق +'}
            </button>

            {/* Searched User Achievements */}
            <div className="space-y-4">
              <h3 className="text-lg font-black px-2 flex items-center gap-2">
                <span>🏆</span> الإنجازات
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {searchedUser.achievements.map((ach) => (
                  <div key={ach.id} className="bg-[#1a1635] border border-white/5 p-4 rounded-2xl flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                      {ach.icon}
                    </div>
                    <div>
                      <div className="font-black text-sm">{ach.title}</div>
                      <div className="text-[10px] text-white/30 font-bold">{ach.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Personal Profile View */
          <div className="space-y-8">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text"
                placeholder="ابحث عن لاعب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 pr-12 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all group-focus-within:bg-white/10"
              />
              <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 hover:scale-110 transition-transform">🔍</button>
            </form>

            {/* Profile Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -z-10" />
              
              <div className="flex flex-col items-center gap-5">
                <div className="relative group cursor-pointer" onClick={() => isEditing && setTempAvatar(`https://i.pravatar.cc/150?u=${Math.random()}`)}>
                  <div className="w-28 h-28 rounded-[2.2rem] bg-gradient-to-br from-yellow-400 to-orange-500 p-1 shadow-2xl transition-transform group-hover:scale-105">
                    <img src={isEditing ? tempAvatar : userProfile.avatar} className="w-full h-full rounded-[2rem] object-cover" alt="" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-slate-900 px-3 py-0.5 rounded-full font-black text-[10px] shadow-lg border-2 border-[#1a1635]">
                    مستوى {userProfile.level}
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center text-xs font-black animate-in fade-in">
                      تغيير 🔄
                    </div>
                  )}
                </div>

                <div className="text-center w-full">
                  {isEditing ? (
                    <input 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center text-xl font-black w-full focus:outline-none focus:border-yellow-400"
                    />
                  ) : (
                    <h2 className="text-2xl font-black mb-1">{userProfile.name}</h2>
                  )}
                  <div className="mt-1">
                    <span className="text-white/40 font-bold text-sm bg-white/5 px-3 py-1 rounded-full">@{userProfile.username}</span>
                  </div>
                </div>

                <div className="flex gap-4 w-full pt-4">
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                    <div className="text-yellow-400 font-black text-2xl">{userProfile.stats.wins}</div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">مرات الفوز</div>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                    <div className="text-blue-400 font-black text-2xl">{userProfile.stats.games}</div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">إجمالي الألعاب</div>
                  </div>
                </div>

                <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`w-full mt-2 py-3 rounded-xl font-black text-sm transition-all active:scale-95 ${
                    isEditing ? 'bg-green-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {isEditing ? 'حفظ التعديلات' : 'تعديل الملف الشخصي'}
                </button>
              </div>
            </div>


            {/* Achievements Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-black px-2 flex items-center gap-2">
                <span>🏆</span> الإنجازات
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {userProfile.achievements.map((ach) => (
                  <div key={ach.id} className="bg-[#1a1635] border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-white/20 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {ach.icon}
                    </div>
                    <div>
                      <div className="font-black text-sm">{ach.title}</div>
                      <div className="text-[10px] text-white/30 font-bold">{ach.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lucky Wheel Section */}
            <div className="bg-[#1a1635] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-center">
              <h3 className="text-lg font-black mb-6 flex items-center justify-center gap-2">
                <span>🎡</span> دولاب الحظ اليومي
              </h3>
              
              <LuckyWheel />
            </div>

            {/* Private Room Actions - NEW SECTION */}
            {!searchedUser && (
              <div className="space-y-4 pb-10">
                <h3 className="text-lg font-black px-2 flex items-center gap-2">
                  <span>🏠</span> الغرف الخاصة
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Create Room Button */}
                  <button 
                    onClick={handleCreatePrivate}
                    className="group bg-gradient-to-r from-indigo-600 to-purple-700 border border-indigo-400/30 p-5 rounded-3xl flex items-center justify-between shadow-xl active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏠</div>
                      <div className="text-right">
                        <div className="font-black text-sm text-white">إنشاء غرفة خاصة</div>
                        <div className="text-[10px] text-white/60 font-bold">التكلفة: 100 نقطة</div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 group-hover:text-white">+</div>
                  </button>

                  {/* Join Room Section */}
                  <div className="bg-[#1a1635] border border-white/5 p-5 rounded-3xl space-y-4 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">🔑</div>
                      <div className="text-right">
                        <div className="font-black text-sm text-white">الانضمام لغرفة</div>
                        <div className="text-[10px] text-white/30 font-bold">أدخل رمز الغرفة للمشاركة</div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-stretch">
                      <input 
                        type="text"
                        placeholder="أدخل الرمز..."
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="flex-[2] h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-[11px] font-bold focus:outline-none focus:border-indigo-500 transition-all text-white placeholder:text-white/20"
                      />
                      <button 
                        onClick={handleJoinPrivate}
                        className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] active:scale-95 transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap px-2"
                      >
                        انضمام
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LuckyWheel = () => {
  const { addCoins, userProfile, updateProfile } = useGame();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState(null);

  const canSpin = !userProfile.lastWheelSpin || 
                  (Date.now() - new Date(userProfile.lastWheelSpin).getTime() > 24 * 60 * 60 * 1000);

  const prizes = [
    { value: 10, label: '10 💰', color: '#3b82f6' },
    { value: 50, label: '50 💰', color: '#8b5cf6' },
    { value: 20, label: '20 💰', color: '#10b981' },
    { value: 100, label: '100 💰', color: '#f59e0b' },
    { value: 5, label: '5 💰', color: '#ef4444' },
    { value: 30, label: '30 💰', color: '#ec4899' },
  ];

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;
    
    setIsSpinning(true);
    const spinCount = 5 + Math.random() * 5; // 5-10 full spins
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const extraRotation = (360 / prizes.length) * prizeIndex;
    const totalRotation = rotation + (spinCount * 360) + extraRotation;
    
    setRotation(totalRotation);

    setTimeout(() => {
      const actualPrize = prizes[(prizes.length - (Math.floor(totalRotation / (360 / prizes.length)) % prizes.length)) % prizes.length];
      setPrize(actualPrize);
      addCoins(actualPrize.value);
      updateProfile({ lastWheelSpin: new Date().toISOString() });
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-48 h-48">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl z-20">👇</div>
        
        {/* The Wheel */}
        <div 
          className="w-full h-full rounded-full border-4 border-white/20 relative shadow-2xl overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {prizes.map((p, i) => (
            <div 
              key={i}
              className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
              style={{ 
                transform: `rotate(${i * (360 / prizes.length)}deg) skewY(-30deg)`,
                backgroundColor: p.color
              }}
            >
              <div 
                className="absolute bottom-4 left-4 text-xs font-black text-white transform -rotate-45"
                style={{ skewY: '30deg' }}
              >
                {p.label}
              </div>
            </div>
          ))}
          {/* Center Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg z-10 border-4 border-[#1a1635]" />
        </div>
      </div>

      {prize ? (
        <div className="animate-in zoom-in duration-500 text-center">
          <div className="text-green-400 font-black text-2xl mb-1">مبروك! 🎉</div>
          <div className="text-white font-bold">لقد ربحت {prize.value} عملة</div>
        </div>
      ) : (
        <button 
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          className={`px-12 py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${
            canSpin && !isSpinning 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 shadow-yellow-500/20' 
            : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
          }`}
        >
          {isSpinning ? 'جاري السحب...' : canSpin ? 'العب الآن!' : 'عد غداً! ✨'}
        </button>
      )}

      {!canSpin && !prize && (
        <p className="text-[10px] text-white/30 font-bold italic">يمكنك المحاولة مرة أخرى بعد 24 ساعة</p>
      )}
    </div>
  );
};

export default ProfileScreen;
