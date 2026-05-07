// --- Global State ---
let coins = 250;
let selectedMode = 'crush'; // Default to Word Crush
let crushSubMode = 'circle'; 
let crushWords = [];
let crushFoundWords = [];
let crushScores = [0,0,0,0];
let currentPuzzle = null;
let micEnabled = true;
let isLeader = true;
let isReady = false;
let enemiesFound = false;
let currentGameInterval = null;
let currentGameTimeout = null;
let crushTimer = null;
let crushTimeLeft = 120;

// --- DOM Elements ---
const screens = document.querySelectorAll('.screen');
const coinDisplays = [document.getElementById('coins-display'), document.getElementById('lobby-coins'), document.getElementById('shop-coins')];
const toastEl = document.getElementById('toast');

// --- Navigation ---
// --- Initial UI State ---
updateStageLayout();

function updateStageLayout() {
    // New card layout - just show/hide the add slot
    const addSlot = document.getElementById('lobby-add-slot');
    if (!addSlot) return;
    const count = getPlayerCount();
    addSlot.style.display = count >= 4 ? 'none' : 'flex';
}

function toggleFriendsSidebar() {
    const sidebar = document.getElementById('friends-sidebar');
    const overlay = document.getElementById('friends-overlay');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

function showScreen(screenId) {
    // Clear any running game timers
    clearInterval(currentGameInterval);
    clearTimeout(currentGameTimeout);
    
    screens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if(target) target.classList.add('active');

    // Always return to lobby in a non-ready state for the local player.
    if (screenId === 'screen-home') {
        isReady = false;
        const myReadyCheck = document.getElementById('ready-check-you');
        if (myReadyCheck) {
            myReadyCheck.classList.remove('active');
            myReadyCheck.innerText = '';
        }
        updateMainButton();
    }
}

// --- Economy ---
function updateCoins(amount) {
    coins += amount;
    coinDisplays.forEach(el => {
        if(el) el.innerText = coins;
    });
}

function showToast(msg, isError = false) {
    toastEl.innerText = msg;
    toastEl.style.backgroundColor = isError ? 'var(--danger)' : 'var(--success)';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// --- Home & Lobby Actions ---
function showModesModal() {
    document.getElementById('modal-modes').style.display = 'flex';
}

function closeModesModal() {
    document.getElementById('modal-modes').style.display = 'none';
}

function renderRoomModeLabel(modeName) {
    const label = document.getElementById('room-mode-label');
    if (!label) return;
    if (modeName === 'الفواكه') {
        label.innerHTML = '<span class="room-mode-fruit-wrap"><span class="room-mode-fruit" aria-hidden="true">🍓</span><span>لعبة الفواكه</span></span>';
    } else {
        label.innerText = modeName;
    }
    const countdownMode = document.getElementById('countdown-mode-name');
    if (countdownMode) countdownMode.innerText = modeName;
}

function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-card').forEach(c => c.style.transform = 'scale(1)');
    document.querySelector(`.mode-${mode}`).style.transform = 'scale(1.05)';
    
    let modeName = "الفواكه";
    if(mode === 'memory-clash') modeName = "صراع الذاكرة";
    if(mode === 'math-duel') modeName = "تحدي الحساب";
    if(mode === 'word-hunt') modeName = "صيد الكلمات";
    if(mode === 'stacker') modeName = "برج التوازن";
    
    renderRoomModeLabel(modeName);
    showToast(`تم اختيار مود: ${modeName}`);
    setTimeout(closeModesModal, 500);
}

// --- Interactivity ---
function toggleReady(btn) {
    if(btn.style.color === 'black') {
        btn.style.color = 'white';
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.innerHTML = 'غير<br>جاهز';
        showToast('حالتك: غير جاهز');
    } else {
        btn.style.color = 'black';
        btn.style.background = 'var(--success)';
        btn.innerHTML = 'جاهز<br>✔';
        showToast('حالتك: جاهز للعب!');
    }
}

function toggleMic() {
    const btn = document.getElementById('mic-btn');
    if(btn.innerText === '🎤') {
        btn.innerText = '🔇';
        btn.style.color = 'var(--danger)';
        showToast('تم كتم المايك');
    } else {
        btn.innerText = '🎤';
        btn.style.color = 'white';
        showToast('تم تفعيل المايك');
    }
}

function toggleSpeaker() {
    const btn = document.getElementById('speaker-btn');
    if(btn.innerText === '🔊') {
        btn.innerText = '🔈';
        btn.style.color = 'var(--danger)';
        showToast('تم كتم صوت اللعبة');
    } else {
        btn.innerText = '🔊';
        btn.style.color = 'white';
        showToast('تم تفعيل صوت اللعبة');
    }
}

function togglePlayerMute(el) {
    el.classList.toggle('is-muted');
    const isMuted = el.classList.contains('is-muted');
    el.innerText = isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت';
    
    const card = el.closest('.lobby-player-card');
    const avatarWrap = card.querySelector('.lpc-avatar-wrap');
    if (avatarWrap) {
        if (isMuted) avatarWrap.classList.add('muted');
        else avatarWrap.classList.remove('muted');
    }
    
    showToast(isMuted ? 'تم كتم اللاعب' : 'تم تفعيل الصوت');
}

function transferLeader(el) {
    // 1. Remove crown from EVERYONE
    document.querySelectorAll('.lpc-leader').forEach(badge => {
        badge.remove();
    });
    
    // 2. Assign crown to the player whose menu was clicked
    const card = el.closest('.lobby-player-card');
    if(card) {
        const crown = document.createElement('div');
        crown.className = 'lpc-leader';
        crown.innerText = '👑';
        card.appendChild(crown);
        
        const nameEl = card.querySelector('.lpc-name');
        const name = nameEl ? nameEl.innerText : 'اللاعب';
        showToast(`تم نقل القيادة إلى ${name} 👑`);
        
        // Role Update: Local player loses leadership
        isLeader = false;
        updateRoleBasedUI();
    }
}

function updateRoleBasedUI() {
    // Hide leader-only buttons if not leader
    const findBtn = document.getElementById('find-enemies-btn');
    if (findBtn) {
        if (isLeader) findBtn.style.display = 'flex';
        else findBtn.style.display = 'none';
    }
    
    // Update main button text
    updateMainButton();
    
    // Remove leader-only options from menus if not leader
    if (!isLeader) {
        document.querySelectorAll('.lpc-dropdown').forEach(menu => {
            const transferBtn = Array.from(menu.children).find(c => c.innerText.includes('نقل القيادة'));
            const kickBtn = Array.from(menu.children).find(c => c.innerText.includes('طرد'));
            if (transferBtn) transferBtn.style.display = 'none';
            if (kickBtn) kickBtn.style.display = 'none';
        });
    }
}

// Close menus on click outside
window.addEventListener('click', (e) => {
    if (!e.target.matches('.lpc-menu-btn') && !e.target.closest('.lpc-dropdown')) {
        document.querySelectorAll('.lpc-dropdown').forEach(d => d.classList.remove('open'));
    }
});

function isFriend(name) {
    const friendNames = Array.from(document.querySelectorAll('.f-name')).map(el => el.innerText);
    return friendNames.includes(name);
}

function toggleFriendship(name, el) {
    if(isFriend(name)) {
        removeFriendFromSidebar(name);
        el.innerText = 'إضافة صديق';
        showToast(`تم إزالة ${name} من الأصدقاء`);
    } else {
        addFriendToSidebar(name);
        el.innerText = 'إلغاء الصداقة';
        showToast(`تم إرسال طلب صداقة لـ ${name}... تم القبول!`);
    }
}

function addFriendToSidebar(name) {
    const list = document.querySelector('.friends-list');
    const item = document.createElement('div');
    item.className = 'friend-item';
    item.innerHTML = `
        <div class="f-avatar">${name[0]}</div>
        <div class="f-details"><span class="f-name">${name}</span><span class="f-status online">متصل</span></div>
        <div class="f-action"><button class="f-invite-btn">✔</button></div>
    `;
    list.appendChild(item);
}

function removeFriendFromSidebar(name) {
    const friends = document.querySelectorAll('.friend-item');
    friends.forEach(item => {
        if(item.querySelector('.f-name').innerText === name) {
            item.remove();
        }
    });
}

function kickPlayer(btn) {
    if(!isLeader) {
        showToast('فقط القائد يمكنه طرد اللاعبين!', true);
        return;
    }
    const char = btn.closest('.pubg-character');
    const name = char.querySelector('.lpc-name') ? char.querySelector('.lpc-name').innerText : '';
    
    char.style.opacity = '0';
    char.style.transform = 'translateY(50px)';
    setTimeout(() => {
        char.style.display = 'none';
        char.style.opacity = '1';
        char.style.transform = 'none';
        char.innerHTML = ''; // Clear content
        
        // Reset sidebar button if this was an invited friend
        const friends = document.querySelectorAll('.friend-item');
        friends.forEach(item => {
            const fNameEl = item.querySelector('.f-name');
            if(fNameEl && fNameEl.innerText === name) {
                const actionBtn = item.querySelector('.f-action');
                if(actionBtn) {
                    // Try to extract ID suffix if it exists in the original structure
                    // For simplicity, we'll recreate the invite button
                    const initials = name[0];
                    // We need a way to know the idSuffix. Let's just find the button and reset it.
                    actionBtn.innerHTML = `<button class="f-invite-btn" onclick="inviteSpecificFriend('${name}', '${initials}', '${name.toLowerCase()}')">+</button>`;
                }
            }
        });

        updateStageLayout(); // Update layout after kicking
        showToast(`تم طرد ${name} من التحدي`);
    }, 300);
}

function handleFindEnemies() {
    if(!isLeader) {
        showToast('فقط القائد يمكنه البحث عن خصوم!', true);
        return;
    }
    
    if(getPlayerCount() >= 4) {
        showToast('الفريق ممتلئ بالفعل! لا يمكن إضافة المزيد من الخصوم.', true);
        return;
    }

    // How many people are already in the lobby (excluding me)
    const enemiesAlreadyPresent = getPlayerCount() - 1;
    openMatchSelection(enemiesAlreadyPresent);
}

function handleMainAction() {
    if(isLeader) {
        // For leader: first click sets ready state only.
        // Second click (while ready) starts the game.
        if(!isReady) {
            toggleReadySelf();
            showToast('تم تجهيزك. اضغط مرة ثانية لبدء التحدي.');
            return;
        }
        startGame();
    } else {
        toggleReadySelf();
    }
}

function toggleReadySelf() {
    isReady = !isReady;
    // Support both old and new class names
    const readyCheck = document.getElementById('ready-check-you');
    if(readyCheck) {
        readyCheck.classList.toggle('active', isReady);
        readyCheck.innerText = isReady ? '✔' : '';
    }
    updateMainButton();
    showToast(isReady ? 'أنت جاهز الآن!' : 'ألغيت الجاهزية');
}

function updateMainButton() {
    const btn = document.getElementById('main-action-btn');
    if(!btn) return;
    
    if(isLeader) {
        btn.innerText = isReady ? 'ابدأ اللعب' : 'تجهيز';
    } else {
        btn.innerText = isReady ? 'إلغاء التجهيز' : 'تجهيز';
    }
}

function getPlayerCount() {
    const grid = document.getElementById('pubg-stage');
    if (!grid) return 1;
    return Array.from(grid.querySelectorAll('.lobby-player-card')).filter(el => {
        return !el.classList.contains('lpc-add-slot') && el.style.display !== 'none';
    }).length;
}

function checkAllReady() {
    const grid = document.getElementById('pubg-stage');
    const players = Array.from(grid.querySelectorAll('.lobby-player-card')).filter(el => {
        return !el.classList.contains('lpc-add-slot') && el.style.display !== 'none';
    });
    return players.every(p => {
        const check = p.querySelector('.lpc-ready');
        return check && check.classList.contains('active');
    });
}

function toggleLpcMenu(btn) {
    const dropdown = btn.nextElementSibling;
    if (!dropdown) return;
    // Close all others
    document.querySelectorAll('.lpc-dropdown').forEach(d => d.classList.remove('open'));
    dropdown.classList.toggle('open');
}

function kickPlayerCard(btn) {
    if(!isLeader) { showToast('فقط القائد يمكنه طرد اللاعبين!', true); return; }
    const card = btn.closest('.lobby-player-card');
    const name = card.querySelector('.lpc-name') ? card.querySelector('.lpc-name').innerText : 'اللاعب';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8)';
    card.style.transition = 'all 0.3s';
    setTimeout(() => {
        card.style.display = 'none';
        card.innerHTML = '';
        card.style.opacity = '1';
        card.style.transform = '';
        updateStageLayout();
        showToast(`تم طرد ${name} من التحدي`);
    }, 300);
}

window.addEventListener('click', (e) => {
    if (!e.target.matches('.lpc-menu-btn') && !e.target.closest('.lpc-dropdown')) {
        document.querySelectorAll('.lpc-dropdown').forEach(d => d.classList.remove('open'));
    }
});

function handleFindEnemies() {
    if (!isLeader) {
        showToast('فقط القائد يمكنه البحث عن خصوم', true);
        return;
    }
    // Count enemies already in lobby
    let enemiesAlreadyPresent = 0;
    document.querySelectorAll('.pubg-character:not(.you)').forEach(card => {
        if (card.style.display !== 'none' && card.id !== 'lobby-add-slot') {
            enemiesAlreadyPresent++;
        }
    });
    openMatchSelection(enemiesAlreadyPresent);
}

function openMatchSelection(enemiesAlreadyPresent) {
    const overlay = document.getElementById('screen-match-selection');
    if (!overlay) return;

    overlay.dataset.enemiesAlreadyPresent = String(enemiesAlreadyPresent);

    const sub1 = document.getElementById('match-sub-1');
    const sub2 = document.getElementById('match-sub-2');
    const sub3 = document.getElementById('match-sub-3');

    if (sub1) sub1.innerText = `مواجهة شخص واحد (سنجد ${Math.max(0, 1 - enemiesAlreadyPresent)} إضافيين)`;
    if (sub2) sub2.innerText = `مواجهة شخصين (سنجد ${Math.max(0, 2 - enemiesAlreadyPresent)} إضافيين)`;
    if (sub3) sub3.innerText = `مواجهة ثلاثة أشخاص (سنجد ${Math.max(0, 3 - enemiesAlreadyPresent)} إضافيين)`;

    overlay.classList.add('active');
    overlay.style.display = 'flex';
}

function closeMatchSelection() {
    const overlay = document.getElementById('screen-match-selection');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }
}

function chooseMatchOption(totalEnemiesDesired) {
    const enemiesAlreadyPresent = Number(
        (document.getElementById('screen-match-selection') || {}).dataset.enemiesAlreadyPresent || '0'
    );
    const friendsInLobby = [];
    document.querySelectorAll('.pubg-character:not(.you)').forEach(char => {
        const nameEl = char.querySelector('.lpc-name');
        if (char.style.display !== 'none' && nameEl) friendsInLobby.push(nameEl.innerText);
    });

    const label = `1 ضد ${totalEnemiesDesired}`;
    closeMatchSelection();
    findMatch(label, totalEnemiesDesired, friendsInLobby);
}

function findMatch(matchType, totalEnemiesCount, friendsNames = []) {
    console.log(`Starting match: ${matchType}, Total Enemies Needed: ${totalEnemiesCount}, Friends joining:`, friendsNames);
    
    // 1. Show Matchmaking Modal
    document.getElementById('screen-matchmaking').style.display = 'flex';
    
    document.getElementById('mm-title').innerText = 'جاري البحث عن خصوم...';
    document.getElementById('mm-status').innerText = `نظام التحدي: ${matchType}`;
    
    const neededToFind = totalEnemiesCount - friendsNames.length;
    showToast(`جاري البحث عن ${neededToFind} خصوم إضافيين...`);
    
    // Robust visibility control
    const allSlots = [
        document.getElementById('mm-p1'),
        document.getElementById('mm-p2'),
        document.getElementById('mm-p3'),
        document.getElementById('mm-p4')
    ];
    const allVs = [
        document.getElementById('mm-vs-1'),
        document.getElementById('mm-vs-2'),
        document.getElementById('mm-vs-3')
    ];

    // Show/Hide based on totalEnemiesCount
    allSlots.forEach((slot, idx) => {
        if(slot) {
            const shouldShow = idx <= totalEnemiesCount; 
            slot.style.display = shouldShow ? 'flex' : 'none';
            
            if(shouldShow && idx > 0) {
                // If this slot is for a friend who is already in the lobby
                if (idx <= friendsNames.length) {
                    const fName = friendsNames[idx-1];
                    slot.innerHTML = `<div class="mm-avatar">${fName[0]}</div><span>${fName}</span>`;
                    slot.className = 'mm-slot found';
                } else {
                    slot.innerHTML = '<div class="mm-avatar spin">?</div><span>بحث...</span>';
                    slot.className = 'mm-slot searching';
                }
            }
        }
    });

    allVs.forEach((vs, idx) => {
        if(vs) {
            const shouldShow = (idx + 1) <= totalEnemiesCount;
            vs.style.display = shouldShow ? 'inline-block' : 'none';
        }
    });

    const enemyPool = ['جاسر', 'ليلى', 'رعد', 'صقر', 'نورة', 'سارة', 'خالد', 'فيصل'];
    let foundCount = 0;
    const currentlyFoundEnemies = [];

    const findNext = () => {
        if(foundCount < neededToFind) {
            foundCount++;
            const slotIdx = 1 + friendsNames.length + foundCount;
            const slot = document.getElementById(`mm-p${slotIdx}`);
            if(slot) {
                const name = enemyPool[Math.floor(Math.random() * enemyPool.length)];
                currentlyFoundEnemies.push({name: name});
                slot.innerHTML = `<div class="mm-avatar">${name[0]}</div><span>${name}</span>`;
                slot.className = 'mm-slot found';
            }
            
            if(foundCount === neededToFind) {
                setTimeout(() => {
                    showToast('تم العثور على الخصوم! جاري الانتقال للوبي...');
                    displayEnemiesInLobby(currentlyFoundEnemies); 
                }, 1000);
            } else {
                setTimeout(findNext, 1000 + Math.random() * 800);
            }
        }
    };
    setTimeout(findNext, 1200);
}

function displayEnemiesInLobby(enemies) {
    document.getElementById('screen-matchmaking').style.display = 'none';
    enemiesFound = true;
    let enemyIdx = 0;
    for(let i = 2; i <= 4; i++) {
        const slot = document.getElementById(`pubg-char-${i}`);
        if(slot && (slot.style.display === 'none' || slot.innerHTML === '') && enemyIdx < enemies.length) {
            const enemy = enemies[enemyIdx];
            const isAlreadyFriend = isFriend(enemy.name);
            const colors = ['linear-gradient(135deg,#ef4444,#dc2626)', 'linear-gradient(135deg,#f59e0b,#d97706)', 'linear-gradient(135deg,#10b981,#059669)'];
            const color = colors[(i - 2) % colors.length];
            slot.style.display = 'flex';
            slot.style.opacity = '0';
            slot.className = 'lobby-player-card pubg-character';
            slot.innerHTML = `
                <button class="lpc-menu-btn" onclick="toggleLpcMenu(this)">⋮</button>
                <div class="lpc-dropdown" id="lpc-drop-${i}">
                    <div onclick="togglePlayerMute(this)">كتم الصوت</div>
                    <div onclick="transferLeader(this)">نقل القيادة</div>
                    <div class="danger" onclick="kickPlayerCard(this)">طرد اللاعب</div>
                </div>
                <div class="lpc-avatar-wrap">
                    <div class="lpc-mute-icon">🔇</div>
                    <div class="lpc-avatar" style="background:${color}">${enemy.name[0]}</div>
                    <span class="lpc-online-dot"></span>
                </div>
                <div class="lpc-name">${enemy.name}</div>
                <span class="lpc-ready active">✔ جاهز</span>
            `;
            setTimeout(() => { slot.style.opacity = '1'; slot.style.transition = 'opacity 0.4s'; }, 50);
            enemyIdx++;
        }
    }
    updateStageLayout();
    updateMainButton();
}


function quickMatch() {
    document.getElementById('screen-matchmaking').style.display = 'flex';
    
    // Reset matchmaking UI just in case
    document.getElementById('mm-p2').innerHTML = '<div class="mm-avatar spin">?</div><span>بحث...</span>';
    document.getElementById('mm-p2').classList.replace('found', 'searching');
    document.getElementById('mm-p3').innerHTML = '<div class="mm-avatar spin">?</div><span>بحث...</span>';
    document.getElementById('mm-p3').classList.replace('found', 'searching');

    setTimeout(() => {
        document.getElementById('mm-p2').innerHTML = '<div class="mm-avatar">س</div><span>سارة</span>';
        document.getElementById('mm-p2').classList.replace('searching', 'found');
    }, 1500);
    setTimeout(() => {
        document.getElementById('mm-p3').innerHTML = '<div class="mm-avatar">ف</div><span>فيصل</span>';
        document.getElementById('mm-p3').classList.replace('searching', 'found');
        setTimeout(() => {
            // Fill Lobby with new players
            const charSlot2 = document.getElementById('pubg-char-2');
            if(charSlot2) {
                charSlot2.style.display = 'flex';
                charSlot2.className = 'lobby-player-card pubg-character';
                charSlot2.innerHTML = `
                    <button class="lpc-menu-btn" onclick="toggleLpcMenu(this)">⋮</button>
                    <div class="lpc-dropdown">
                        <div onclick="togglePlayerMute(this)">كتم الصوت</div>
                        <div onclick="transferLeader(this)">نقل القيادة</div>
                        <div class="danger" onclick="kickPlayerCard(this)">طرد اللاعب</div>
                    </div>
                    <div class="lpc-avatar-wrap">
                        <div class="lpc-mute-icon">🔇</div>
                        <div class="lpc-avatar" style="background:linear-gradient(135deg,#f43f5e,#e11d48)">س</div>
                        <span class="lpc-online-dot"></span>
                    </div>
                    <div class="lpc-name">سارة</div>
                    <span class="lpc-ready active">✔ جاهز</span>
                `;
            }
            
            const charSlot3 = document.getElementById('pubg-char-3');
            if(charSlot3) {
                charSlot3.style.display = 'flex';
                charSlot3.className = 'lobby-player-card pubg-character';
                charSlot3.innerHTML = `
                    <button class="lpc-menu-btn" onclick="toggleLpcMenu(this)">⋮</button>
                    <div class="lpc-dropdown">
                        <div onclick="togglePlayerMute(this)">كتم الصوت</div>
                        <div onclick="transferLeader(this)">نقل القيادة</div>
                        <div class="danger" onclick="kickPlayerCard(this)">طرد اللاعب</div>
                    </div>
                    <div class="lpc-avatar-wrap">
                        <div class="lpc-mute-icon">🔇</div>
                        <div class="lpc-avatar" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">ف</div>
                        <span class="lpc-online-dot"></span>
                    </div>
                    <div class="lpc-name">فيصل</div>
                    <span class="lpc-ready active">✔ جاهز</span>
                `;
            }

            // Update internal state
            currentSquadSlot = 4;
            updateStageLayout(); // Update layout after matchmaking

            showScreen('screen-home');
            showToast('انضموا إلى التحدي!');
        }, 1000);
    }, 3000);
}

function cancelMatchmaking() {
    document.getElementById('screen-matchmaking').style.display = 'none';
    showToast('تم إلغاء البحث');
}

function toggleMic() {
    micEnabled = !micEnabled;
    const btn = document.getElementById('mic-btn');
    btn.innerText = micEnabled ? '🎤' : '🔇';
    btn.style.background = micEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.2)';
    showToast(micEnabled ? 'تم تفعيل المايك' : 'تم كتم المايك');
}

function inviteFriend() {
    document.getElementById('invite-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('invite-modal').style.display = 'none';
}

function copyCode() {
    showToast('تم نسخ رمز الغرفة!');
}

let currentSquadSlot = 2;
function inviteSpecificFriend(name, initial, idSuffix) {
    if(getPlayerCount() >= 4) {
        showToast('الفريق ممتلئ! لا يمكنك إضافة المزيد من اللاعبين.', true);
        return;
    }

    // Change button to spinner or disabled while waiting
    const actionDiv = document.getElementById(`action-${idSuffix}`);
    if (actionDiv) {
        actionDiv.innerHTML = `<button class="f-invite-btn" disabled>⌛</button>`;
    }
    
    showToast(`تم إرسال دعوة إلى ${name}...`);

    // Simulate them accepting the invite
    setTimeout(() => {
        // Find first empty slot
        let targetSlot = null;
        for(let i=2; i<=4; i++) {
            const slot = document.getElementById(`pubg-char-${i}`);
            if(slot && (slot.style.display === 'none' || slot.innerHTML === '')) {
                targetSlot = slot;
                break;
            }
        }

        if(targetSlot) {
            targetSlot.style.display = 'flex';
            targetSlot.className = 'lobby-player-card pubg-character';
            const isAlreadyFriend = isFriend(name);
            const colors = ['linear-gradient(135deg,#06b6d4,#0891b2)', 'linear-gradient(135deg,#a855f7,#9333ea)', 'linear-gradient(135deg,#f97316,#ea580c)'];
            const slotNum = parseInt(targetSlot.id.replace('pubg-char-',''));
            const color = colors[(slotNum - 2) % colors.length];
            targetSlot.innerHTML = `
                <button class="lpc-menu-btn" onclick="toggleLpcMenu(this)">⋮</button>
                <div class="lpc-dropdown">
                    <div onclick="togglePlayerMute(this)">كتم الصوت</div>
                    <div onclick="transferLeader(this)">نقل القيادة</div>
                    <div class="danger" onclick="kickPlayerCard(this)">طرد اللاعب</div>
                </div>
                <div class="lpc-avatar-wrap">
                    <div class="lpc-mute-icon">🔇</div>
                    <div class="lpc-avatar" style="background:${color}">${name[0]}</div>
                    <span class="lpc-online-dot"></span>
                </div>
                <div class="lpc-name">${name}</div>
                <span class="lpc-ready active">✔ جاهز</span>
            `;
            if (actionDiv) {
                actionDiv.innerHTML = `<button class="f-invite-btn" style="cursor:default;background:#10b981">✔</button>`;
            }
            const statusSpan = document.getElementById(`status-${idSuffix}`);
            if (statusSpan) statusSpan.innerText = 'في الغرفة';
            showToast(`انضم ${name} إلى التحدي!`);
            updateStageLayout();
        } else {
            showToast('الفريق ممتلئ!');
            // Reset button if full
            if (actionDiv) {
                actionDiv.innerHTML = `<button class="f-invite-btn" onclick="inviteSpecificFriend('${name}', '${initial}', '${idSuffix}')">+</button>`;
            }
        }
    }, 1500);
}

function simulateJoin() {
    const sbSlot = document.getElementById('sidebar-slot-3');
    if(sbSlot) {
        sbSlot.classList.remove('empty');
        sbSlot.innerHTML = `
            <div class="member-avatar">س</div>
            <div class="member-info"><span class="member-name">سالم</span><span class="member-status ready">جاهز</span></div>
        `;
    }
    
    const charSlot = document.getElementById('char-slot-3');
    if(charSlot) {
        charSlot.classList.remove('empty-char');
        charSlot.innerHTML = `
            <div class="char-name">سالم</div>
            <div class="char-model">🧍🏻‍♂️</div>
        `;
    }
    
    closeModal();
    showToast('انضم سالم إلى الغرفة');
}

function toggleChat() {
    const modal = document.getElementById('chat-modal');
    modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
    if(modal.style.display === 'flex') {
        document.getElementById('chat-input').focus();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;

    addChatMessage('أنت', text, true);
    input.value = '';

    // Simulate team response
    setTimeout(() => {
        const visibleNames = Array.from(document.querySelectorAll('.lobby-player-card:not(.you):not(.lpc-add-slot)'))
            .filter(c => c.style.display !== 'none')
            .map(c => c.querySelector('.lpc-name') ? c.querySelector('.lpc-name').innerText : '');
        
        const validNames = visibleNames.filter(Boolean);
        if(validNames.length > 0) {
            const randomFriend = validNames[Math.floor(Math.random() * validNames.length)];
            const responses = ['تمام', 'جاهز يا بطل', 'يلا نبدأ', 'أنا معك', 'منورين يا شباب'];
            addChatMessage(randomFriend, responses[Math.floor(Math.random() * responses.length)], false);
        }
    }, 1000);
}

function addChatMessage(name, text, isMe) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.style.display = 'flex';
    msg.style.flexDirection = 'column';
    msg.style.alignItems = isMe ? 'flex-end' : 'flex-start';
    
    msg.innerHTML = `
        <small style="opacity:0.6; margin-bottom:4px; font-size:0.75rem;">${name}</small>
        <div style="background: ${isMe ? '#facc15' : 'rgba(255,255,255,0.1)'}; color: ${isMe ? '#000' : '#fff'}; padding: 8px 12px; border-radius: 8px; max-width: 80%; word-break: break-word; font-size:0.9rem;">
            ${text}
        </div>
    `;
    
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

// Add Enter key listener for chat
document.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && document.activeElement.id === 'chat-input') {
        sendChatMessage();
    }
});

function setupFruitPlayersFromLobby() {
    const opponents = getLobbyOpponentNames();
    fruitPlayerNames = ['أنت', ...opponents];
    fruitPlayerCount = fruitPlayerNames.length;

    fruitPlayerCount = Math.min(Math.max(fruitPlayerCount, 2), 4);
    fruitPlayerNames = fruitPlayerNames.slice(0, fruitPlayerCount);

    const slotIds = ['fruit-p2', 'fruit-p3', 'fruit-p4'];
    slotIds.forEach((slotId, idx) => {
        const slot = document.getElementById(slotId);
        if(!slot) return;
        const playerIdx = idx + 1;
        const isVisible = playerIdx < fruitPlayerCount;
        slot.style.display = isVisible ? 'flex' : 'none';
        if(isVisible) {
            const nameEl = slot.querySelector('.fp-name');
            if(nameEl) nameEl.innerText = fruitPlayerNames[playerIdx];
        }
    });
}

function startCountdown() {
    showScreen('screen-countdown');
    let count = 3;
    const countEl = document.getElementById('cd-number');
    const nameEl = document.getElementById('cd-game-name');
    
    let modeName = "🧩 كلمات كراش";

    if(nameEl) nameEl.innerText = modeName;
    countEl.innerText = "3";

    const iv = setInterval(() => {
        count--;
        if(count > 0) countEl.innerText = count;
        else if (count === 0) countEl.innerText = "انطلق!";
        else { 
            clearInterval(iv); 
            if(selectedMode === 'crush') startWordCrush();
            else playFruitGame(); 
        }
    }, 1000);
}


// --- Fruit Game Logic ---
let playerHands = [[], [], [], []]; 
let selectedFruitIdx = -1;
let currentTurn = 0; // 0: You, 1: Salem, 2: Raad, 3: Saqr
let fruitPlayerCount = 4;
let fruitPlayerNames = ['أنت', 'سالم', 'رعد', 'صقر'];
const HAND_SIZE = 3;
let fruitTypeCount = 3;
let revealPowerUsed = false;
let passFeedTimeout = null;
let revealedCardsByPlayer = [[], [], [], []]; // تتبع الكروت المكشوفة لكل لاعب

function getLobbyOpponentNames() {
    return Array.from(document.querySelectorAll('.lobby-player-card:not(.you):not(.lpc-add-slot)'))
        .filter(char => char.style.display !== 'none')
        .map(char => {
            const nameEl = char.querySelector('.lpc-name');
            return nameEl ? nameEl.innerText.trim() : '';
        })
        .filter(Boolean);
}

function startGame() {
    if(!isLeader) {
        showToast('فقط القائد يمكنه بدء اللعب!', true);
        return;
    }
    if(!checkAllReady()) {
        showToast('انتظر حتى يجهز الجميع!', true);
        return;
    }
    startCountdown();
}


// --- Fruit Game Logic ---
function playFruitGame() {
    showScreen('screen-game-fruit');
    selectedFruitIdx = -1;
    currentTurn = 0;
    revealPowerUsed = false;
    revealedCardsByPlayer = [[], [], [], []]; // Reset revealed cards
    setupFruitPlayersFromLobby();
    // Fruit TYPES scale with players, hand size stays fixed at 3 cards.
    // 2 players -> 3 types, 3 players -> 4 types, 4 players -> 5 types
    fruitTypeCount = fruitPlayerCount + 1;
    
    const fullPool = ['🍎', '🍌', '🍇', '🍓', '🍉'];
    const activePool = fullPool.slice(0, fruitTypeCount);
    
    // إنشاء مجموعة كروت تضمن وجود 3 كروت من كل نوع (لضمان إمكانية الفوز)
    let deckTemplate = [];
    for(let i=0; i<fruitPlayerCount; i++) {
        const fruit = activePool[i % activePool.length];
        deckTemplate.push(fruit, fruit, fruit);
    }
    
    let validDeal = false;
    while (!validDeal) {
        // خلط الكروت
        let deck = [...deckTemplate];
        deck.sort(() => Math.random() - 0.5);
        
        // توزيع تجريبي
        let tempHands = Array.from({ length: fruitPlayerCount }, () => []);
        for(let i=0; i<HAND_SIZE; i++) {
            for(let p=0; p<fruitPlayerCount; p++) {
                tempHands[p].push(deck.pop());
            }
        }
        
        // التحقق من وجود فائز فوري
        const hasInstantWinner = tempHands.some(hand => hand[0] === hand[1] && hand[1] === hand[2]);
        
        if (!hasInstantWinner) {
            playerHands = tempHands;
            validDeal = true;
        }
    }
    
    updateTurnUI();
    renderFruitUI();
    hideWinnerReveal();
    const feed = document.getElementById('fruit-pass-feed');
    if(feed) {
        feed.innerHTML = '';
        feed.style.display = 'none';
    }
    hideRevealFeed();

    // Immediate-win check after dealing (valid with dynamic set sizes).
    const instantWinnerIdx = playerHands.findIndex((_, idx) => hasWinningHand(idx));
    if (instantWinnerIdx !== -1) {
        const instantWinnerName = fruitPlayerNames[instantWinnerIdx] || 'لاعب';
        currentGameTimeout = setTimeout(() => {
            endGameFruit(instantWinnerIdx === 0, instantWinnerName, instantWinnerIdx);
        }, 300);
    }
}

function renderFruitUI() {
    const myContainer = document.getElementById('my-fruit-cards');
    if(!myContainer) return;
    myContainer.innerHTML = '';
    
    playerHands[0].forEach((fruit, idx) => {
        const card = document.createElement('div');
        card.className = `f-card ${selectedFruitIdx === idx ? 'selected' : ''}`;
        card.innerText = fruit;
        card.onclick = () => {
            if(currentTurn !== 0) return;
            selectedFruitIdx = idx;
            renderFruitUI();
        };
        myContainer.appendChild(card);
    });
    
    // Keep opponents' cards hidden in the same card style (3 fixed slots).
    for(let p=1; p<fruitPlayerCount; p++) {
        const botCards = document.querySelector(`#fruit-p${p+1} .fp-cards`);
        if(botCards) {
            const rev = revealedCardsByPlayer[p] || [];
            const hiddenCount = Math.max(0, HAND_SIZE - rev.length);
            let html = '';
            
            // أظهر الكروت المكشوفة أولاً
            rev.forEach(c => {
                html += `<div class="f-card revealed-card" style="background-color: #8b5cf6; color: #fff; font-weight: bold; border: 2px solid #fff;">${c}</div>`;
            });
            
            // أظهر الكروت المخفية المتبقية
            for(let i=0; i<hiddenCount; i++) {
                html += '<div class="f-card back hidden-fruit">?</div>';
            }
            
            botCards.innerHTML = html;
        }
    }
}

function updateTurnUI() {
    document.querySelectorAll('.fruit-player').forEach(p => p.classList.remove('active-turn'));
    const currentPlayerEl = document.getElementById(`fruit-p${currentTurn + 1}`);
    if(currentPlayerEl) currentPlayerEl.classList.add('active-turn');
    
    const passBtn = document.getElementById('fruit-pass-btn');
    if(passBtn) passBtn.disabled = (currentTurn !== 0);
    const revealBtn = document.getElementById('fruit-reveal-btn');
    if (revealBtn) {
        const isDisabled = (currentTurn !== 0) || (fruitPlayerCount < 2) || (coins < 50);
        revealBtn.disabled = isDisabled;
        revealBtn.innerText = coins >= 50 ? '🔍 كشف ورقة (50 نقطة)' : '🔍 لا تملك نقاط كافية';
    }
}

function passFruitCard() {
    if(currentTurn !== 0) return;
    if(selectedFruitIdx === -1) {
        showToast('اختر ورقة لتمسيرها أولاً!', true);
        return;
    }
    
    executePass(0, selectedFruitIdx);
}

function executePass(playerIdx, cardIdx) {
    const passedCard = playerHands[playerIdx].splice(cardIdx, 1)[0];
    const nextPlayer = (playerIdx + 1) % fruitPlayerCount;
    
    // التعامل مع الكروت المكشوفة: إذا مرر لاعب كرتاً مكشوفاً، تنتقل صفة "المكشوف" معه
    const revIndex = revealedCardsByPlayer[playerIdx].indexOf(passedCard);
    if (revIndex !== -1) {
        revealedCardsByPlayer[playerIdx].splice(revIndex, 1);
        // لا نضيفها للمستقبل إذا كان هو "أنت" لأنك تعرف أوراقك أصلاً
        if (nextPlayer !== 0) {
            revealedCardsByPlayer[nextPlayer].push(passedCard);
        }
    }
    
    playerHands[nextPlayer].push(passedCard);
    showPassFeed(passedCard, fruitPlayerNames[playerIdx], fruitPlayerNames[nextPlayer]);
    
    selectedFruitIdx = -1;
    renderFruitUI();
    
    if(checkWin(playerIdx) || checkWin(nextPlayer)) return;

    // Move to next turn
    currentTurn = (currentTurn + 1) % fruitPlayerCount;
    updateTurnUI();
    
    if(currentTurn !== 0) {
        currentGameTimeout = setTimeout(botPlayTurn, 10000);
    }
}

function botPlayTurn() {
    const hand = playerHands[currentTurn];
    // Bot AI: keep the strongest set and pass least useful card.
    const counts = {};
    hand.forEach(f => counts[f] = (counts[f] || 0) + 1);
    const bestFruit = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const candidates = hand
        .map((fruit, idx) => ({ fruit, idx, count: counts[fruit] }))
        .filter(item => item.fruit !== bestFruit);

    let passIdx = 0;
    if (candidates.length > 0) {
        candidates.sort((a, b) => a.count - b.count);
        passIdx = candidates[0].idx;
    } else {
        // If all fruits same or no alternative, pass first card.
        passIdx = 0;
    }
    
    executePass(currentTurn, passIdx);
}

function checkWin(pIdx) {
    if(hasWinningHand(pIdx)) {
        endGameFruit(pIdx === 0, fruitPlayerNames[pIdx] || 'لاعب', pIdx);
        return true;
    }
    return false;
}

function hasWinningHand(playerIdx) {
    const hand = playerHands[playerIdx];
    return !!hand && hand.length === HAND_SIZE && hand.every(card => card === hand[0]);
}

function hideWinnerReveal() {
    const reveal = document.getElementById('fruit-win-reveal');
    if(reveal) reveal.style.display = 'none';
}

function hidePassFeed() {
    const feed = document.getElementById('fruit-pass-feed');
    if(feed) {
        feed.style.display = 'none';
        feed.innerHTML = ''; // تفريغ التمريرات القديمة تماماً
    }
    clearTimeout(passFeedTimeout);
}

function hideRevealFeed() {
    const feed = document.getElementById('fruit-reveal-feed');
    if(feed) feed.style.display = 'none';
}

function showPassFeed(card, fromName, toName) {
    const feed = document.getElementById('fruit-pass-feed');
    if(!feed) return;
    
    // حدّد مؤشرات اللاعبين
    const fromIdx = fruitPlayerNames.indexOf(fromName);
    const toIdx = fruitPlayerNames.indexOf(toName);
    
    if(fromIdx === -1 || toIdx === -1) return;
    
    // معرف فريد لكل "ممر" تمريرة بين شخصين (نستخدم الصغير أولاً لضمان نفس المعرف في الاتجاهين)
    const pMin = Math.min(fromIdx, toIdx);
    const pMax = Math.max(fromIdx, toIdx);
    const laneId = `pass-lane-${pMin}-${pMax}`;
    
    // إحداثيات ثابتة لكل ممر لمنع التداخل (بناءً على توزيع اللاعبين)
    const lanePositions = {
        '0-1': { x: 22, y: 70 }, // أنت - يسار
        '0-2': { x: 38, y: 40 }, // أنت - فوق (يسار المركز)
        '0-3': { x: 78, y: 70 }, // أنت - يمين
        '1-2': { x: 22, y: 30 }, // يسار - فوق
        '1-3': { x: 62, y: 40 }, // يسار - يمين (يمين المركز)
        '2-3': { x: 78, y: 30 }  // فوق - يمين
    };
    
    const pos = lanePositions[`${pMin}-${pMax}`] || { x: 50, y: 50 };
    
    // اذا كانت هناك تمريرة قديمة من نفس الشخصين، احذفها
    const oldPass = document.getElementById(laneId);
    if(oldPass) {
        oldPass.remove();
    }
    
    // إنشاء عنصر جديد للتمريرة
    const passItem = document.createElement('div');
    passItem.id = laneId;
    passItem.className = 'pass-history-item';
    passItem.style.left = `${pos.x}%`;
    passItem.style.top = `${pos.y}%`;
    passItem.style.transform = 'translate(-50%, -50%)';
    
    passItem.innerHTML = `
        <span style="color: #8b5cf6; font-weight: bold;">${fromName}</span>
        <span style="color: #cbd5e1; font-size: 0.75rem;">مرر</span>
        <span style="font-size: 1.1rem; margin: 0 4px;">${card}</span>
        <span style="color: #cbd5e1; font-size: 0.75rem;">لـ</span>
        <span style="color: #10b981; font-weight: bold;">${toName}</span>
    `;
    
    // أضف التمريرة للقائمة
    feed.appendChild(passItem);
    feed.style.display = 'block';
}

function useRevealPower() {
    if (currentTurn !== 0) return;
    
    // التحقق من وجود نقاط كافية
    if (coins < 50) {
        showToast('ما في 50 نقطة عندك!', true);
        return;
    }
    
    const opponentIndexes = [];
    for (let i = 1; i < fruitPlayerCount; i++) opponentIndexes.push(i);
    if (opponentIndexes.length === 0) return;
    
    showRevealSelectionMenu(opponentIndexes);
}

function showRevealSelectionMenu(opponentIndexes) {
    const container = document.querySelector('.fruit-controls-area') || document.getElementById('my-fruit-cards').parentElement;
    
    // إنشاء modal للاختيار
    const modal = document.createElement('div');
    modal.className = 'reveal-selection-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid #8b5cf6;
        border-radius: 16px;
        padding: 20px;
        z-index: 10000;
        min-width: 300px;
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
    `;
    
    let buttonsHTML = '<div style="text-align: center; margin-bottom: 15px;"><strong style="color: #f8fafc; font-size: 1.2rem;">اختر لاعب لكشف ورقته (50 نقطة)</strong></div>';
    
    opponentIndexes.forEach(idx => {
        const playerName = fruitPlayerNames[idx];
        buttonsHTML += `
            <button onclick="executeRevealPower(${idx})" style="
                display: block;
                width: 100%;
                padding: 12px;
                margin: 8px 0;
                background: #8b5cf6;
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1rem;
            ">🔍 كشف عن ${playerName}</button>
        `;
    });
    
    buttonsHTML += `
        <button onclick="closeRevealSelectionModal()" style="
            display: block;
            width: 100%;
            padding: 10px;
            margin-top: 15px;
            background: #475569;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        ">إلغاء</button>
    `;
    
    modal.innerHTML = buttonsHTML;
    document.body.appendChild(modal);
    modal.id = 'reveal-selection-modal';
}

function closeRevealSelectionModal() {
    const modal = document.getElementById('reveal-selection-modal');
    if (modal) modal.remove();
}

function executeRevealPower(targetIdx) {
    const targetHand = playerHands[targetIdx] || [];
    const alreadyRevealed = revealedCardsByPlayer[targetIdx] || [];
    
    // تصفية اليد لاختيار ورقة غير مكشوفة
    const unrevealedHand = [...targetHand];
    alreadyRevealed.forEach(revCard => {
        const idx = unrevealedHand.indexOf(revCard);
        if (idx !== -1) unrevealedHand.splice(idx, 1);
    });
    
    if (unrevealedHand.length === 0) {
        closeRevealSelectionModal();
        showToast(`كل أوراق ${fruitPlayerNames[targetIdx]} مكشوفة بالفعل!`, true);
        return;
    }

    // خصم النقاط وتحديث الحالة
    updateCoins(-50);
    // revealPowerUsed = true; // تم حذف هذا السطر للسماح بالكشف المتعدد
    updateTurnUI();
    
    const revealedCard = unrevealedHand[Math.floor(Math.random() * unrevealedHand.length)];
    
    // حفظ الكرت المكشوف بشكل دائم
    revealedCardsByPlayer[targetIdx].push(revealedCard);
    
    closeRevealSelectionModal();
    renderFruitUI(); 
    showRevealFeed(revealedCard, fruitPlayerNames[targetIdx]);
}

function showRevealFeed(card, playerName) {
    // تحديث الإشعار النصي فقط (التحديث الدائم للكروت يتم عبر renderFruitUI)
    const feed = document.getElementById('fruit-reveal-feed');
    const nameEl = document.getElementById('reveal-player-name');
    const cardEl = document.getElementById('reveal-card');
    
    if (feed && nameEl && cardEl) {
        nameEl.innerText = playerName;
        cardEl.innerText = card;
        feed.style.display = 'flex';
        
        // إخفاء الإشعار بعد 3 ثوانٍ
        setTimeout(() => {
            feed.style.display = 'none';
        }, 3000);
    }
    
    showToast(`🔍 كشفت ورقة من ${playerName}: ${card}`);
}

function showWinnerReveal(winnerName, winnerIdx) {
    const reveal = document.getElementById('fruit-win-reveal');
    const winnerNameEl = document.getElementById('fruit-winner-name');
    const winnerCardsEl = document.getElementById('fruit-winner-cards');
    if(!reveal || !winnerNameEl || !winnerCardsEl) return;

    const winnerCards = playerHands[winnerIdx] || [];
    winnerNameEl.innerText = `${winnerName} فاز!`;
    winnerCardsEl.innerHTML = winnerCards
        .map(card => `<div class="f-card reveal-card">${card}</div>`)
        .join('');
    reveal.style.display = 'flex';
}

function endGameFruit(won, winnerName, winnerIdx) {
    showWinnerReveal(winnerName, winnerIdx);
    showToast(`${winnerName} جمع 3 فواكه متشابهة وفاز!`);

    currentGameTimeout = setTimeout(() => {
        const players = fruitPlayerNames.map((name, idx) => ({
            name,
            score: idx === winnerIdx ? 100 : 0, // In fruit game, winner is first to get 3
            isYou: idx === 0
        }));
        showFinalResults(players);
    }, 1800);
}

function showFinalResults(playersData) {
    // Sort players by score descending
    playersData.sort((a, b) => b.score - a.score);
    
    const isYouWinner = playersData[0].isYou;
    const winnerName = playersData[0].isYou ? 'أنت' : playersData[0].name;

    showScreen('screen-results');
    const title = document.getElementById('results-title');
    const sub = document.getElementById('results-subtitle');
    const rewardBox = document.getElementById('reward-box');
    const rewardAmountEl = document.querySelector('.reward-amount');
    const rewardTotalEl = document.getElementById('reward-total');
    const resultRows = Array.from(document.querySelectorAll('.results-scores .result-row'));
    const rankIcons = ['🥇', '🥈', '🥉', '🏅'];

    resultRows.forEach((row, i) => {
        const player = playersData[i];
        const nameEl = row.querySelector('.result-name');
        const ptsEl = row.querySelector('.result-pts');
        const rankEl = row.querySelector('.result-rank');

        if (!player) {
            row.style.display = 'none';
            return;
        }

        row.style.display = 'flex';
        row.classList.toggle('you-result', player.isYou);
        if (nameEl) nameEl.innerText = player.isYou ? `أنت` : player.name;
        if (rankEl) rankEl.innerText = rankIcons[i] || '🏅';
        if (ptsEl) {
            ptsEl.innerText = (i === 0) ? '+10 نقاط' : '+0 نقطة';
            ptsEl.classList.toggle('lost', i !== 0);
        }
    });
    
    if(isYouWinner) {
        title.innerText = 'مبروك! لقد فزت 🏆';
        title.style.color = '#10b981';
        sub.innerText = 'لقد كنت الأفضل في هذا التحدي!';
        updateCoins(10);
        if(rewardBox) rewardBox.style.display = 'block';
        if(rewardAmountEl) rewardAmountEl.innerText = '🪙 +10 نقاط';
        if(rewardTotalEl) rewardTotalEl.innerText = `رصيدك الجديد: ${coins} نقطة`;
    } else {
        title.innerText = 'محاولة جيدة! 😞';
        title.style.color = '#ef4444';
        sub.innerText = `الفائز هو: ${winnerName}`;
        if(rewardBox) rewardBox.style.display = 'none';
    }
}

function updateMainButton() {
    const btn = document.getElementById('main-action-btn');
    const findBtn = document.getElementById('find-enemies-btn');
    if (!btn) return;

    if(findBtn) {
        findBtn.style.display = isLeader ? 'flex' : 'none';
    }

    if(isLeader) {
        if(!isReady) {
            btn.innerHTML = 'جاهز<br><small>READY</small>';
            btn.style.background = 'linear-gradient(135deg,#facc15,#f59e0b)';
            btn.style.color = '#000';
        } else {
            btn.innerHTML = 'ابدأ اللعب<br><small>START GAME</small>';
            btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
            btn.style.color = '#fff';
        }
    } else if(!isReady) {
        btn.innerHTML = 'جاهز<br><small>READY</small>';
        btn.style.background = 'linear-gradient(135deg,#facc15,#f59e0b)';
        btn.style.color = '#000';
    } else {
        btn.innerHTML = 'في الانتظار...<br><small>WAITING</small>';
        btn.style.background = 'rgba(71,85,105,0.8)';
        btn.style.color = '#fff';
    }
}


function startGame() {
    if(!isLeader) {
        showToast('فقط القائد يمكنه بدء اللعب!', true);
        return;
    }
    if(getPlayerCount() < 2) {
        showToast('لازم يكون في خصم واحد على الأقل قبل بدء اللعب!', true);
        return;
    }
    startCountdown();
}

function playAgain() {
    // Start a fresh fruit round from results screen.
    selectedFruitIdx = -1;
    hideWinnerReveal();
    startCountdown();
}


// --- Shop & Profile Actions ---
function buyCoins(amount, price) {
    showToast(`جاري شراء ${amount} نقطة...`);
    setTimeout(() => {
        updateCoins(amount);
        showToast(`تم إضافة ${amount} نقطة بنجاح!`, false);
    }, 1000);
}

function buySkin(icon, price) {
    if(coins >= price) {
        updateCoins(-price);
        document.getElementById('profile-avatar').innerText = icon;
        // Update character model in lobby if on lobby
        const youModel = document.querySelector('.character-wrapper.you .char-model');
        if(youModel) youModel.innerText = icon;
        
        showToast(`تم شراء وتفعيل شخصية ${icon}`);
    } else {
        showToast('نقاطك لا تكفي!', true);
    }
}

function buyBackground(bgName, cssBg, price) {
    if(coins >= price) {
        updateCoins(-price);
        document.querySelector('.lobby-pubg').style.background = cssBg;
        showToast(`تم شراء وتفعيل خلفية ${bgName}`);
    } else {
        showToast('نقاطك لا تكفي!', true);
    }
}

function claimDaily() {
    const btn = document.getElementById('daily-btn');
    if(btn.disabled) return;
    
    updateCoins(25);
    btn.innerText = "تم الاستلام ✓";
    btn.disabled = true;
    btn.style.background = "rgba(255,255,255,0.2)";
    showToast('تم استلام المكافأة اليومية!');
}

function updateScale() {
    const wrapper = document.getElementById('app-scale-wrapper');
    if(!wrapper) return;
    const viewportW = Math.max(320, window.innerWidth);
    const viewportH = Math.max(480, window.innerHeight);
    const scale = Math.min(viewportW / 1080, viewportH / 1920);
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', updateScale);
window.addEventListener('load', updateScale);
window.addEventListener('orientationchange', updateScale);

// --- Competitive Sidebar Helper ---
function renderOpponentsSidebar(containerId, scores = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    fruitPlayerNames.forEach((name, idx) => {
        const score = scores[idx] || 0;
        const isYou = idx === 0;
        const item = document.createElement('div');
        item.className = 'opponent-item' + (isYou ? ' you-item' : '');
        item.id = `${containerId}-opp-${idx}`;
        item.innerHTML = `
            <div class="opp-avatar">${isYou ? 'أ' : name[0]}</div>
            <div class="opp-info">
                <span class="opp-name">${isYou ? 'أنت' : name}</span>
                <span class="opp-score" id="${containerId}-score-${idx}">${score} نقطة</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateOpponentScore(containerId, playerIdx, score) {
    const scoreEl = document.getElementById(`${containerId}-score-${playerIdx}`);
    if (scoreEl) {
        scoreEl.innerText = `${score} نقطة`;
        const item = document.getElementById(`${containerId}-opp-${playerIdx}`);
        item.classList.add('active-turn');
        setTimeout(() => item.classList.remove('active-turn'), 1000);
    }
}

/* Legacy games commented out */
/* // let mathEnemyScore = 0;
let currentEquation = {};
let mathTimer = null;
let mathTimeLeft = 30;

function startMathDuel() {
    showScreen('screen-game-math-duel');
    mathEnemyScore = 0;
    mathTimeLeft = 30;
    updateMathUI();
    generateMathQuestion();
    
    // Initialize sidebar
    setupFruitPlayersFromLobby();
    const scores = {};
    fruitPlayerNames.forEach((_, i) => scores[i] = 0);
    renderOpponentsSidebar('math-duel-opponents', scores);
    
    if (mathTimer) clearInterval(mathTimer);
    mathTimer = setInterval(() => {
        mathTimeLeft--;
        const timerBar = document.getElementById('math-duel-timer-bar');
        if (timerBar) timerBar.style.width = (mathTimeLeft / 30) * 100 + '%';
        
        if (mathTimeLeft <= 0) {
            endMathDuel();
        }
    }, 1000);
    
    // Enemy AI: answers every few seconds
    startMathAI();
}

function generateMathQuestion() {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    let answer;
    if (op === '+') answer = num1 + num2;
    else if (op === '-') answer = num1 - num2;
    else answer = num1 * num2;
    
    currentEquation = { num1, num2, op, answer };
    document.getElementById('math-equation').innerText = `${num1} ${op} ${num2} = ?`;
    
    // Choices
    const choices = [answer];
    while (choices.length < 4) {
        const wrong = answer + (Math.floor(Math.random() * 10) - 5);
        if (!choices.includes(wrong)) choices.push(wrong);
    }
    choices.sort(() => Math.random() - 0.5);
    
    const container = document.getElementById('math-choices');
    container.innerHTML = '';
    choices.forEach(val => {
        const btn = document.createElement('button');
        btn.className = 'math-choice-btn';
        btn.innerText = val;
        btn.onclick = () => checkMathAnswer(val);
        container.appendChild(btn);
    });
}

function checkMathAnswer(val) {
    if (val === currentEquation.answer) {
        mathScore += 10;
        showToast('إجابة صحيحة! 🎉');
        updateOpponentScore('math-duel-opponents', 0, mathScore);
    } else {
        mathScore = Math.max(0, mathScore - 5);
        showToast('خطأ! ❌', true);
    }
    updateMathUI();
    generateMathQuestion();
}

function updateMathUI() {
    document.getElementById('math-duel-score').innerText = mathScore;
    document.getElementById('math-duel-enemy-score').innerText = mathEnemyScore;
}

function startMathAI() {
    const aiInterval = setInterval(() => {
        if (mathTimeLeft <= 0) {
            clearInterval(aiInterval);
            return;
        }
        // AI answers correctly 70% of the time
        if (Math.random() > 0.3) {
            mathEnemyScore += 10;
            updateOpponentScore('math-duel-opponents', 1, mathEnemyScore);
            showToast('الخصم أجاب أولاً! ⚡', true);
            generateMathQuestion();
        } else {
            mathEnemyScore = Math.max(0, mathEnemyScore - 5);
        }
        updateMathUI();
    }, 4000 + Math.random() * 3000);
}

function endMathDuel() {
    clearInterval(mathTimer);
    const winner = mathScore > mathEnemyScore ? 'أنت' : 'الخصم';
    showToast(`انتهى الوقت! الفائز: ${winner}`);
    setTimeout(() => {
        const players = fruitPlayerNames.map((name, idx) => ({
            name: name,
            score: idx === 0 ? mathScore : (idx === 1 ? mathEnemyScore : 0),
            isYou: idx === 0
        }));
        showFinalResults(players);
    }, 1500);
}

//
// ==========================================================
// GAME 3: WORD HUNT (صيد الكلمات) - [MOVED TO COMMENTS]
// البحث عن كلمة محددة في شبكة حروف، المنافسة تعتمد على سرعة الملاحظة.
// ==========================================================
let wordScore = 0;
// Game logic commented out
//
let wordEnemyScore = 0;
let wordTarget = "";
let selectedLetters = [];
let wordTimer = null;
let wordTimeLeft = 45;

const wordPool = ['عقل', 'فكر', 'ذكاء', 'تحدي', 'سرعة', 'لعب', 'فوز', 'مرح'];

function startWordHunt() {
    showScreen('screen-game-word-hunt');
    wordScore = 0;
    wordEnemyScore = 0;
    wordTimeLeft = 45;
    updateWordUI();
    generateWordGrid();
    
    // Initialize sidebar
    setupFruitPlayersFromLobby();
    const scores = {};
    fruitPlayerNames.forEach((_, i) => scores[i] = 0);
    renderOpponentsSidebar('word-hunt-opponents', scores);
    
    if (wordTimer) clearInterval(wordTimer);
    wordTimer = setInterval(() => {
        wordTimeLeft--;
        const timerBar = document.getElementById('word-hunt-timer-bar');
        if (timerBar) timerBar.style.width = (wordTimeLeft / 45) * 100 + '%';
        if (wordTimeLeft <= 0) endWordHunt();
    }, 1000);
    
    startWordAI();
}

function generateWordGrid() {
    wordTarget = wordPool[Math.floor(Math.random() * wordPool.length)];
    document.getElementById('word-hunt-target').innerText = wordTarget;
    selectedLetters = [];
    
    const grid = document.getElementById('word-hunt-grid');
    grid.innerHTML = '';
    
    // Create an 8x8 grid with the target word hidden inside
    const letters = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي';
    const totalCells = 64;
    const gridArray = Array.from({ length: totalCells }, () => letters[Math.floor(Math.random() * letters.length)]);
    
    // Place target word randomly
    const startIdx = Math.floor(Math.random() * (totalCells - wordTarget.length));
    for (let i = 0; i < wordTarget.length; i++) {
        gridArray[startIdx + i] = wordTarget[i];
    }
    
    gridArray.forEach((char, idx) => {
        const el = document.createElement('div');
        el.className = 'grid-letter';
        el.innerText = char;
        el.onclick = () => handleLetterClick(el, char, idx);
        grid.appendChild(el);
    });
}

function handleLetterClick(el, char, idx) {
    if (el.classList.contains('selected')) return;
    
    el.classList.add('selected');
    selectedLetters.push(char);
    
    const currentStr = selectedLetters.join('');
    if (currentStr === wordTarget) {
        wordScore += 20;
        showToast('وجدتها! 🏆');
        updateWordUI();
        updateOpponentScore('word-hunt-opponents', 0, wordScore);
        setTimeout(generateWordGrid, 500);
    } else if (!wordTarget.startsWith(currentStr)) {
        // Wrong path
        setTimeout(() => {
            document.querySelectorAll('.grid-letter.selected').forEach(l => l.classList.remove('selected'));
            selectedLetters = [];
        }, 300);
    }
}

function updateWordUI() {
    document.getElementById('word-hunt-score').innerText = wordScore;
    document.getElementById('word-hunt-enemy-score').innerText = wordEnemyScore;
}

function startWordAI() {
    const aiInterval = setInterval(() => {
        if (wordTimeLeft <= 0) {
            clearInterval(aiInterval);
            return;
        }
        if (Math.random() > 0.4) {
            wordEnemyScore += 20;
            updateWordUI();
            updateOpponentScore('word-hunt-opponents', 1, wordEnemyScore);
            showToast('الخصم وجد الكلمة! أسرع في التالية ⚡', true);
            generateWordGrid();
        }
    }, 6000 + Math.random() * 4000);
}

function endWordHunt() {
    clearInterval(wordTimer);
    const winner = wordScore > wordEnemyScore ? 'أنت' : 'الخصم';
    showToast(`انتهى الوقت! الفائز: ${winner}`);
    setTimeout(() => {
        const players = fruitPlayerNames.map((name, idx) => ({
            name: name,
            score: idx === 0 ? wordScore : (idx === 1 ? wordEnemyScore : 0),
            isYou: idx === 0
        }));
        showFinalResults(players);
    }, 1500);
}

//
// ==========================================================
// GAME 4: STACKER BATTLE (برج التوازن) - [MOVED TO COMMENTS]
// الجميع يبني نفس البرج بالتناوب، الخاسر هو من يتسبب في سقوط البرج.
// ==========================================================
let stackerScores = [0, 0, 0, 0];
... (etc)
//
let stackerTurn = 0;
let stackerBlocks = [];
let stackerCanvas, stackerCtx;
let stackerCurrentBlock = null;
let stackerIsRunning = false;

function startStacker() {
    showScreen('screen-game-stacker');
    stackerScores = [0, 0, 0, 0];
    stackerTurn = 0;
    stackerBlocks = [];
    stackerIsRunning = true;
    
    // Initialize sidebar
    setupFruitPlayersFromLobby();
    const scoresMap = {};
    fruitPlayerNames.forEach((_, i) => scoresMap[i] = 0);
    renderOpponentsSidebar('stacker-opponents', scoresMap);
    
    stackerCanvas = document.getElementById('stacker-canvas');
    stackerCtx = stackerCanvas.getContext('2d');
    stackerCanvas.width = 400;
    stackerCanvas.height = 500;
    
    // Initial base block
    const base = { x: 100, y: 450, w: 200, h: 30, color: '#8b5cf6' };
    stackerBlocks.push(base);
    
    updateStackerUI();
    spawnStackerBlock();
    requestAnimationFrame(stackerLoop);
}

function updateStackerUI() {
    document.getElementById('stacker-score').innerText = stackerScores[0];
    const btn = document.querySelector('.stacker-drop-btn');
    if (btn) {
        btn.disabled = stackerTurn !== 0;
        btn.style.opacity = stackerTurn === 0 ? '1' : '0.5';
        btn.innerText = stackerTurn === 0 ? 'وضع الكتلة' : `انتظر دور الخصم...`;
    }
    
    // Highlight sidebar
    document.querySelectorAll('#stacker-opponents .opponent-item').forEach((el, idx) => {
        el.classList.toggle('active-turn', idx === stackerTurn);
    });
}

function spawnStackerBlock() {
    const prev = stackerBlocks[stackerBlocks.length - 1];
    stackerCurrentBlock = {
        x: 0,
        y: prev.y - 30,
        w: prev.w,
        h: 30,
        speed: 3 + (stackerBlocks.length * 0.3),
        dir: 1,
        color: stackerTurn === 0 ? '#8b5cf6' : `hsl(${Math.random() * 360}, 70%, 60%)`
    };
}

function stackerLoop() {
    if (!stackerIsRunning) return;
    
    stackerCtx.clearRect(0, 0, stackerCanvas.width, stackerCanvas.height);
    
    // Draw stacks
    stackerBlocks.forEach(b => {
        stackerCtx.fillStyle = b.color;
        stackerCtx.fillRect(b.x, b.y, b.w, b.h);
    });
    
    // Update current
    if (stackerCurrentBlock) {
        stackerCurrentBlock.x += stackerCurrentBlock.speed * stackerCurrentBlock.dir;
        if (stackerCurrentBlock.x + stackerCurrentBlock.w > stackerCanvas.width || stackerCurrentBlock.x < 0) {
            stackerCurrentBlock.dir *= -1;
        }
        
        stackerCtx.fillStyle = stackerCurrentBlock.color;
        stackerCtx.fillRect(stackerCurrentBlock.x, stackerCurrentBlock.y, stackerCurrentBlock.w, stackerCurrentBlock.h);
    }
    
    requestAnimationFrame(stackerLoop);
}

function stackerDrop() {
    if (stackerTurn !== 0 || !stackerCurrentBlock || !stackerIsRunning) return;
    processStackerPlacement();
}

function processStackerPlacement() {
    const prev = stackerBlocks[stackerBlocks.length - 1];
    const diff = stackerCurrentBlock.x - prev.x;
    
    if (Math.abs(diff) >= prev.w) {
        // Tower falls! Current player loses.
        endStackerGame(false);
        return;
    }
    
    // Cut the block
    if (diff > 0) stackerCurrentBlock.w -= diff;
    else {
        stackerCurrentBlock.w += diff;
        stackerCurrentBlock.x = prev.x;
    }
    
    stackerBlocks.push(stackerCurrentBlock);
    stackerScores[stackerTurn] += 10;
    updateOpponentScore('stacker-opponents', stackerTurn, stackerScores[stackerTurn]);
    
    if (stackerBlocks.length > 12) {
        stackerBlocks.forEach(b => b.y += 30);
    }
    
    // Next player's turn
    stackerTurn = (stackerTurn + 1) % fruitPlayerCount;
    updateStackerUI();
    
    spawnStackerBlock();
    
    if (stackerTurn !== 0) {
        // Bot "thinking" delay
        setTimeout(enemyStackerAction, 1000 + Math.random() * 2000);
    }
}

function enemyStackerAction() {
    if (!stackerIsRunning || stackerTurn === 0) return;
    
    // AI Strategy: wait until block is close to center or randomly drop
    const checkInterval = setInterval(() => {
        if (!stackerIsRunning || stackerTurn === 0) {
            clearInterval(checkInterval);
            return;
        }
        
        const prev = stackerBlocks[stackerBlocks.length - 1];
        const currentCenter = stackerCurrentBlock.x + (stackerCurrentBlock.w / 2);
        const prevCenter = prev.x + (prev.w / 2);
        const distance = Math.abs(currentCenter - prevCenter);
        
        // AI skill: 70% chance to drop when very close, otherwise wait
        if (distance < 10 || Math.random() < 0.05) {
            clearInterval(checkInterval);
            processStackerPlacement();
        }
    }, 100);
}

function endStackerGame(isWin) {
    stackerIsRunning = false;
    const loserName = stackerTurn === 0 ? 'أنت' : fruitPlayerNames[stackerTurn];
    showToast(`سقط البرج! الخاسر: ${loserName} 💥`, true);
    
    setTimeout(() => {
        const players = fruitPlayerNames.map((name, idx) => ({
            name: name,
            score: stackerScores[idx],
            isYou: idx === 0
        }));
        showFinalResults(players);
    }, 1500);
}
 // */

// ==========================================================
// UNIVERSAL WORD CRUSH LOGIC (عالم كلمات كراش)
// ==========================================================
crushWords = [];
crushFoundWords = [];
crushScores = [0,0,0,0];
currentPuzzle = null;

const puzzlesPool = {
    'circle': [
        { letters: ['ب', 'ح', 'ر'], words: ['بحر', 'حرب', 'بر'] },
        { letters: ['ع', 'ق', 'ل'], words: ['عقل', 'قل'] }
    ],
    'grid': [
        { words: ['تفاح', 'موز', 'توت'], grid: ['ت','ف','ا','ح','خ','و','م','و','ز','ا','ي','ل','ت','و','ت','ب','ر','ق'] },
    ],
    'scrambled': [
        { words: ['برتقال'], letters: ['ق', 'ل', 'ت', 'ا', 'ر', 'ب'] },
        { words: ['كمبيوتر'], letters: ['ر', 'ت', 'و', 'ي', 'ب', 'م', 'ك'] }
    ],
    'image': [
        { words: ['شمس'], hint: '☀️' },
        { words: ['كتاب'], hint: '📚' }
    ],
    'discover': [
        { 
            words: ['فرجار', 'دائرة', 'هندسة'], 
            hint: ['📏'], 
            grid: ['ف','ر','ج','ا','ر','د','ا','ئ','ر','ة','ه','ن','د','س','ة','ا','ب','ج','د','ه','و','ز','ح','ط','ي'],
            rows: 5, cols: 5 
        }
    ],
    'proverb': [
        {
            words: ['الصبر', 'مفتاح', 'الفرج'],
            hint: ['🧘', '🔑', '🔓'], 
            grid: ['ا','ل','ص','ب','ر','م','ف','ت','ا','ح','ا','ل','ف','ر','ج','س','ب','ي','س','ك','ي','ف','ن','و','ر'],
            rows: 5, cols: 5
        },
        {
            words: ['الوقت', 'كالسيف'],
            hint: ['⌚', '🗡️'],
            grid: ['ا','ل','و','ق','ت','ك','ا','ل','س','ي','ف','خ','ط','ر','م','ا','ر','س','ا','م','ل','ي','س','ا','ب'],
            rows: 5, cols: 5
        },
        {
            words: ['العلم', 'نور'],
            hint: ['📚', '💡'],
            grid: ['ا','ل','ع','ل','م','ن','و','ر','خ','ي','ر','د','ل','ي','ل','ا','س','د','و','ر','د','ة','ق','ل','م'],
            rows: 5, cols: 5
        }
    ],
    'secret': [
        {
            words: ['سجادة', 'صلاة', 'مسجد'],
            hint: '🕌', 
            grid: ['س','ج','ا','د','ة','ص','ل','ا','ة','ب','م','س','ج','د','خ','ر','ك','و','ع','ا','م','ص','ح','ف','ي'],
            rows: 5, cols: 5
        }
    ],
    'crossword': [
        { 
            grid: [
                ['','ب','ق','ع','ة','','م'],
                ['','','','','','','ل'],
                ['','','ل','ج','أ','','ا'],
                ['ز','م','ن','','','','ك'],
                ['','','','ا','ر','ا','م']
            ],
            words: ['بقعة', 'ملاك', 'لجأ', 'زمن', 'ارام'],
            hints: {
                '0,1,h': '🧼', // بقعة
                '0,6,v': '👑', // ملاك
                '2,2,h': '🆘', // لجأ
                '3,0,h': '⌛', // زمن
                '4,3,h': '🦌'  // ارام
            },
            rows: 5, cols: 7
        },
        {
            grid: [
                ['ت','ف','ا','ح'],
                ['','','','ل'],
                ['ب','ص','ل','ي'],
                ['','','ح','ب'],
                ['','','م','']
            ],
            words: ['تفاح', 'حليب', 'بصل', 'لحم'],
            hints: {
                '0,0,h': '🍎', // تفاح
                '0,3,v': '🥛', // حليب
                '2,0,h': '🧅', // بصل
                '2,2,v': '🥩'  // لحم
            },
            rows: 5, cols: 4
        },
        {
            grid: [
                ['ق','م','ر',''],
                ['','','م',''],
                ['','م','ل','ح'],
                ['','','','ب'],
                ['','','','ل']
            ],
            words: ['قمر', 'رمل', 'ملح', 'حبل'],
            hints: {
                '0,0,h': '🌙', // قمر
                '0,2,v': '🏖️', // رمل
                '2,1,h': '🧂', // ملح
                '2,3,v': '🧶'  // حبل
            },
            rows: 5, cols: 4
        }
    ]
};

function selectMode(mode) {
    if(mode.startsWith('crush-')) {
        selectedMode = 'crush';
        crushSubMode = mode.split('-')[1];
        
        const icons = { 'circle': '⭕', 'grid': '🔠', 'scrambled': '🔀', 'image': '🖼️', 'discover': '🔍', 'proverb': '📖', 'secret': '🔑', 'crossword': '🧩' };
        const names = {
            'circle': 'حلقة الحروف',
            'grid': 'شبكة الكلمات',
            'scrambled': 'كلمات مبعثرة',
            'image': 'كلمة وصورة',
            'discover': 'اكتشف الصورة',
            'proverb': 'اكتشف المثل',
            'secret': 'كلمة السر',
            'crossword': 'كلمات متقاطعة'
        };
        
        const label = document.getElementById('room-mode-label');
        if(label) label.innerHTML = `<span style="margin-left:5px">${icons[crushSubMode]}</span> ${names[crushSubMode]}`;
        
        const cdLabel = document.getElementById('cd-game-name');
        if(cdLabel) cdLabel.innerText = (icons[crushSubMode] || '🧩') + " " + names[crushSubMode];
    } else {
        selectedMode = mode;
        const label = document.getElementById('room-mode-label');
        if(label) label.innerHTML = '🍓 لعبة الفواكه';
        
        const cdLabel = document.getElementById('cd-game-name');
        if(cdLabel) cdLabel.innerText = '🍓 لعبة الفواكه';
    }
    closeModesModal();
}

// --- Crossword Logic ---
let activeCrosswordCell = null; // {r, c, el}
let activeCrosswordWord = null; // {r, c, dir, word, cells}

function renderCrushCrossword(puzzle) {
    const container = document.getElementById('crush-grid');
    container.innerHTML = '';
    container.className = 'crush-grid-container crossword-mode';
    container.style.gridTemplateColumns = `repeat(${puzzle.cols}, 45px)`;
    
    // Show global hint if exists
    if(puzzle.hints.global) {
        document.getElementById('crush-hint-area').style.display = 'block';
        document.getElementById('crush-hint-img').innerText = puzzle.hints.global;
    }

    puzzle.grid.forEach((row, r) => {
        row.forEach((char, c) => {
            const cell = document.createElement('div');
            cell.className = 'crush-grid-cell' + (char === '' ? ' black-cell' : ' crossword-cell');
            cell.innerText = ""; 
            cell.id = `cross-cell-${r}-${c}`;
            
            if(char !== '') {
                cell.onclick = () => activateCell(r, c, puzzle);
            }
            container.appendChild(cell);
        });
    });
    
    renderCrushKeyboard(puzzle);
}

function activateCell(r, c, puzzle) {
    const el = document.getElementById(`cross-cell-${r}-${c}`);
    
    // Clear letter if it's not a permanently found word
    if(el.innerText !== "" && !el.classList.contains('found-permanent')) {
        el.innerText = "";
    }

    // Determine direction: toggle if same cell clicked, otherwise default to horizontal
    let dir = 'h';
    if(activeCrosswordWord && activeCrosswordWord.r === r && activeCrosswordWord.c === c) {
        dir = activeCrosswordWord.dir === 'h' ? 'v' : 'h';
    }
    
    // Find word start
    let sR = r, sC = c;
    if(dir === 'h') { while(sC > 0 && puzzle.grid[r][sC-1] !== '') sC--; }
    else { while(sR > 0 && puzzle.grid[sR-1][c] !== '') sR--; }
    
    // Check if hint exists for this word
    if(!puzzle.hints[`${sR},${sC},${dir}`]) {
        // Try other direction if no hint
        dir = dir === 'h' ? 'v' : 'h';
        sR = r; sC = c;
        if(dir === 'h') { while(sC > 0 && puzzle.grid[r][sC-1] !== '') sC--; }
        else { while(sR > 0 && puzzle.grid[sR-1][c] !== '') sR--; }
    }
    
    // Highlight full line
    document.querySelectorAll('.crossword-cell').forEach(cell => {
        cell.classList.remove('active-line');
        cell.classList.remove('active-cell');
    });
    
    let cells = [];
    let word = "";
    let currR = sR, currC = sC;
    while(currR < puzzle.rows && currC < puzzle.cols && puzzle.grid[currR][currC] !== '') {
        const cellEl = document.getElementById(`cross-cell-${currR}-${currC}`);
        cellEl.classList.add('active-line');
        cells.push(cellEl);
        word += puzzle.grid[currR][currC];
        if(dir === 'h') currC++; else currR++;
    }
    
    const activeEl = document.getElementById(`cross-cell-${r}-${c}`);
    activeEl.classList.add('active-cell');
    
    activeCrosswordCell = { r, c, el: activeEl };
    activeCrosswordWord = { r: sR, c: sC, dir, word, cells };
    
    // Update Hint
    const hint = puzzle.hints[`${sR},${sC},${dir}`];
    if(hint) {
        document.getElementById('crush-hint-area').style.display = 'block';
        document.getElementById('crush-hint-img').innerText = hint;
    }
}

function handleKeyboardInput(char) {
    if(!activeCrosswordCell || !activeCrosswordWord) return;
    
    activeCrosswordCell.el.innerText = char;
    
    // Check if word is complete
    const typed = activeCrosswordWord.cells.map(el => el.innerText).join('');
    const allFilled = activeCrosswordWord.cells.every(el => el.innerText !== "");

    if(allFilled) {
        if(typed === activeCrosswordWord.word) {
            activeCrosswordWord.cells.forEach(el => el.classList.add('found-permanent'));
            checkCrushWord(typed, 0);
            activeCrosswordCell = null;
            activeCrosswordWord = null;
            document.querySelectorAll('.crossword-cell').forEach(el => {
                el.classList.remove('active-line');
                el.classList.remove('active-cell');
            });
        } else {
            // WRONG WORD - RED FLASH
            activeCrosswordWord.cells.forEach(el => el.classList.add('wrong-word'));
            setTimeout(() => {
                activeCrosswordWord.cells.forEach(el => {
                    el.classList.remove('wrong-word');
                    el.innerText = "";
                });
                // Return to first cell of this word
                const parts = activeCrosswordWord.cells[0].id.split('-');
                activateCell(parseInt(parts[2]), parseInt(parts[3]), currentPuzzle);
            }, 800);
        }
    } else {
        // Auto-advance to next empty cell in the same word
        const nextCell = activeCrosswordWord.cells.find(el => el.innerText === "");
        if(nextCell) {
            const parts = nextCell.id.split('-');
            activateCell(parseInt(parts[2]), parseInt(parts[3]), currentPuzzle);
        }
    }
}

function renderCrushKeyboard(puzzle) {
    const kb = document.getElementById('crush-keyboard');
    kb.innerHTML = '';
    kb.style.display = 'flex';
    
    // Get unique letters from puzzle words
    let letters = [];
    puzzle.words.forEach(w => letters.push(...w.split('')));
    // Add some randoms
    const extra = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
    for(let i=0; i<5; i++) letters.push(extra[Math.floor(Math.random()*extra.length)]);
    
    // Shuffle and unique
    letters = [...new Set(letters)].sort(() => Math.random() - 0.5);
    
    letters.forEach(char => {
        const key = document.createElement('button');
        key.className = 'crush-key';
        key.innerText = char;
        key.onclick = () => handleKeyboardInput(char);
        kb.appendChild(key);
    });
}

// Old handleKeyboardInput removed
function renderCrushSlots() {
    const container = document.getElementById('crush-slots');
    container.innerHTML = '';
    
    if(crushSubMode === 'crossword') {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';
    
    crushWords.forEach(word => {
        const slot = document.createElement('div');
        slot.className = 'crush-word-slot';
        slot.setAttribute('data-word', word);
        word.split('').forEach(() => {
            const box = document.createElement('div');
            box.className = 'crush-letter-box';
            slot.appendChild(box);
        });
        container.appendChild(slot);
    });
}

function startWordCrush(isRefresh = false) {
    showScreen('screen-game-word-crush');
    if(!isRefresh) {
        crushScores = [0,0,0,0];
        crushTimeLeft = 120;
        document.getElementById('crush-score').innerText = '0';
        startCrushTimer();
    }
    crushFoundWords = [];
    
    // Reset all sub-areas
    document.getElementById('crush-circle').style.display = 'none';
    document.getElementById('crush-grid').style.display = 'none';
    document.getElementById('crush-scrambled').style.display = 'none';
    document.getElementById('crush-hint-area').style.display = 'none';
    document.getElementById('crush-keyboard').style.display = 'none';
    document.getElementById('crush-slots').style.display = 'none';
    document.getElementById('crush-current-preview').style.display = 'none';
    
    // Pick random puzzle
    const pool = puzzlesPool[crushSubMode] || puzzlesPool['circle'];
    currentPuzzle = pool[Math.floor(Math.random() * pool.length)];
    crushWords = currentPuzzle.words;

    if(crushSubMode !== 'crossword') {
        document.getElementById('crush-slots').style.display = 'flex';
        document.getElementById('crush-current-preview').style.display = 'block';
        renderCrushSlots();
    }

    if(crushSubMode === 'circle') {
        document.getElementById('crush-circle').style.display = 'block';
        renderCrushCircle(currentPuzzle.letters);
    } else if(crushSubMode === 'grid' || crushSubMode === 'discover' || crushSubMode === 'proverb' || crushSubMode === 'secret') {
        const gridEl = document.getElementById('crush-grid');
        gridEl.style.display = 'grid';
        gridEl.className = 'crush-grid-container' + (crushSubMode === 'secret' ? ' secret-mode' : '');
        renderCrushGrid(currentPuzzle.grid);
        
        if(crushSubMode === 'discover' || crushSubMode === 'proverb' || crushSubMode === 'secret') {
            document.getElementById('crush-hint-area').style.display = 'block';
            const hintImg = document.getElementById('crush-hint-img');
            hintImg.innerHTML = ""; 
            const hints = Array.isArray(currentPuzzle.hint) ? currentPuzzle.hint : [currentPuzzle.hint];
            hints.forEach(h => {
                const span = document.createElement('span');
                span.innerText = h;
                span.style.margin = "0 8px";
                span.style.fontSize = "2.5rem";
                hintImg.appendChild(span);
            });
            gridEl.style.gridTemplateColumns = `repeat(${currentPuzzle.cols || 5}, 55px)`;
        }
    } else if(crushSubMode === 'scrambled') {
        document.getElementById('crush-scrambled').style.display = 'flex';
        renderCrushScrambled(currentPuzzle.letters);
    } else if(crushSubMode === 'image') {
        document.getElementById('crush-hint-area').style.display = 'block';
        document.getElementById('crush-scrambled').style.display = 'flex';
        document.getElementById('crush-hint-img').innerText = currentPuzzle.hint;
        const scrambledLetters = currentPuzzle.words[0].split('').sort(() => Math.random() - 0.5);
        renderCrushScrambled(scrambledLetters);
    } else if(crushSubMode === 'crossword') {
        document.getElementById('crush-grid').style.display = 'grid';
        renderCrushCrossword(currentPuzzle);
    }
    
    setupFruitPlayersFromLobby();
    const scoresMap = {};
    fruitPlayerNames.forEach((_, i) => scoresMap[i] = crushScores[i]);
    renderOpponentsSidebar('word-crush-opponents', scoresMap);
    startCrushAI();
}

function startCrushTimer() {
    if(crushTimer) clearInterval(crushTimer);
    crushTimer = setInterval(() => {
        crushTimeLeft--;
        const timeEl = document.getElementById('crush-time');
        if(timeEl) timeEl.innerText = crushTimeLeft;
        
        const bar = document.getElementById('crush-timer-bar');
        if(bar) bar.style.width = (crushTimeLeft / 120) * 100 + '%';
        
        if(crushTimeLeft <= 0) {
            clearInterval(crushTimer);
            finalizeCrushRound();
        }
    }, 1000);
}

function renderCrushSlots() {
    const container = document.getElementById('crush-slots');
    container.innerHTML = '';
    crushWords.forEach(word => {
        const slot = document.createElement('div');
        slot.className = 'crush-word-slot';
        slot.dataset.word = word;
        word.split('').forEach(char => {
            const box = document.createElement('div');
            box.className = 'crush-letter-box';
            box.innerText = char;
            slot.appendChild(box);
        });
        container.appendChild(slot);
    });
}

let crushSelectedLetters = [];
let crushIsMouseDown = false;

function renderCrushCircle(letters) {
    const circle = document.getElementById('crush-circle');
    circle.innerHTML = '';
    letters.forEach((letter, i) => {
        const angle = (i / letters.length) * Math.PI * 2;
        const radius = 110;
        const center = 160;
        const x = center + radius * Math.cos(angle) - 32.5;
        const y = center + radius * Math.sin(angle) - 32.5;
        const btn = document.createElement('div');
        btn.className = 'crush-circle-letter';
        btn.innerText = letter;
        btn.style.left = x + 'px'; btn.style.top = y + 'px';
        
        // Use both mouse and touch for mobile support
        btn.onmousedown = btn.ontouchstart = (e) => {
            e.preventDefault();
            startCrushLink(btn, letter);
        };
        btn.onmouseenter = (e) => {
            continueCrushLink(btn, letter);
        };
        // For touch move we need global tracking
        circle.appendChild(btn);
    });
    
    window.onmouseup = window.ontouchend = endCrushLink;
}

function startCrushLink(el, char) {
    crushIsMouseDown = true;
    crushSelectedLetters = [{ el, char }];
    el.classList.add('selected');
    updateCrushPreview();
    drawCrushLine();
}

function continueCrushLink(el, char) {
    if(!crushIsMouseDown) return;
    if(crushSelectedLetters.some(item => item.el === el)) return;
    crushSelectedLetters.push({ el, char });
    el.classList.add('selected');
    updateCrushPreview();
    drawCrushLine();
}

function updateCrushPreview() {
    const str = crushSelectedLetters.map(i => i.char).join('');
    document.getElementById('crush-current-preview').innerText = str || '...';
}

function endCrushLink() {
    if(!crushIsMouseDown) return;
    crushIsMouseDown = false;
    const finalWord = crushSelectedLetters.map(i => i.char).join('');
    const els = crushSelectedLetters.map(i => i.el);
    checkCrushWord(finalWord, 0, els);
    
    crushSelectedLetters.forEach(item => item.el.classList.remove('selected'));
    crushSelectedLetters = [];
    updateCrushPreview();
    clearCrushLine();
}

function drawCrushLine() {
    const isCircle = crushSubMode === 'circle';
    const containerId = isCircle ? 'crush-circle' : 'crush-grid';
    const svgId = isCircle ? 'crush-svg-circle' : 'crush-svg-grid';
    const container = document.getElementById(containerId);
    const svg = document.getElementById(svgId);
    if(!svg || crushSelectedLetters.length === 0) return;
    
    const rect = container.getBoundingClientRect();
    let pathData = "";
    
    crushSelectedLetters.forEach((item, idx) => {
        const elRect = item.el.getBoundingClientRect();
        const x = (elRect.left + elRect.width/2) - rect.left;
        const y = (elRect.top + elRect.height/2) - rect.top;
        pathData += (idx === 0 ? "M" : "L") + `${x},${y} `;
    });
    
    svg.innerHTML = `<path class="crush-svg-line" d="${pathData}" />`;
}

function clearCrushLine() {
    const svgCircle = document.getElementById('crush-svg-circle');
    const svgGrid = document.getElementById('crush-svg-grid');
    if(svgCircle) svgCircle.innerHTML = '';
    if(svgGrid) svgGrid.innerHTML = '';
}

// --- Mode 2 Logic ---
function renderCrushGrid(grid) {
    const container = document.getElementById('crush-grid');
    container.innerHTML = '';
    grid.forEach(char => {
        const cell = document.createElement('div');
        cell.className = 'crush-grid-cell' + (crushSubMode === 'secret' ? ' secret-cell' : '');
        cell.innerText = char;
        
        // دعم السحب بالماوس واللمس
        cell.onmousedown = cell.ontouchstart = (e) => {
            e.preventDefault();
            startCrushLink(cell, char);
        };
        cell.onmouseenter = () => {
            continueCrushLink(cell, char);
        };
        // للموبايل نحتاج تتبع يدوي للحركة فوق الشبكة
        container.appendChild(cell);
    });
    
    // ربط الحدث العالمي لإنهاء السحب
    window.onmouseup = window.ontouchend = endCrushLink;
}

// --- Mode 3 Logic ---
function renderCrushScrambled(letters) {
    const container = document.getElementById('crush-scrambled');
    const preview = document.getElementById('crush-current-preview');
    container.innerHTML = '';
    let currentInput = "";
    
    // السماح بالمسح عند الضغط على المعاينة
    preview.onclick = () => {
        currentInput = "";
        preview.innerText = "...";
    };

    letters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'crush-scrambled-btn';
        btn.innerText = letter;
        btn.onclick = () => {
            currentInput += letter;
            preview.innerText = currentInput;
            
            // إذا تطابقت مع أي كلمة مطلوبة
            if(crushWords.includes(currentInput)) {
                checkCrushWord(currentInput, 0);
                currentInput = "";
                preview.innerText = "...";
            } else {
                // إذا وصل لطول الكلمة ولم ينجح، نمسح تلقائياً بعد قليل
                const targetLen = crushWords[0].length; // في طور الصورة غالباً كلمة واحدة
                if(currentInput.length >= targetLen) {
                    setTimeout(() => {
                        if(currentInput !== "") {
                            currentInput = "";
                            preview.innerText = "...";
                        }
                    }, 500);
                }
            }
        };
        container.appendChild(btn);
    });
}

function checkCrushWord(word, playerIdx, linkedElements = []) {
    if(crushWords.includes(word) && !crushFoundWords.includes(word)) {
        crushFoundWords.push(word);
        crushScores[playerIdx] += 1;
        
        // Keep highlighted permanently for specific modes
        linkedElements.forEach(el => {
            el.classList.add('found-permanent');
            if(crushSubMode !== 'secret' && crushSubMode !== 'discover' && crushSubMode !== 'proverb') {
                setTimeout(() => el.classList.remove('found-permanent'), 800);
            }
        });
        
        // Auto-fill grid for Crossword if opponent found it (or if no linked elements provided)
        if(crushSubMode === 'crossword' && linkedElements.length === 0) {
            const puzzle = currentPuzzle;
            for(let r=0; r<puzzle.rows; r++) {
                for(let c=0; c<puzzle.cols; c++) {
                    // Check horizontal
                    if(c + word.length <= puzzle.cols) {
                        let match = true;
                        for(let i=0; i<word.length; i++) if(puzzle.grid[r][c+i] !== word[i]) match = false;
                        if(match) {
                            for(let i=0; i<word.length; i++) {
                                let el = document.getElementById(`cross-cell-${r}-${c+i}`);
                                el.innerText = word[i];
                                el.classList.add('found-permanent');
                                if(playerIdx !== 0) el.style.setProperty('background', '#f87171', 'important');
                            }
                        }
                    }
                    // Check vertical
                    if(r + word.length <= puzzle.rows) {
                        let match = true;
                        for(let i=0; i<word.length; i++) if(puzzle.grid[r+i][c] !== word[i]) match = false;
                        if(match) {
                            for(let i=0; i<word.length; i++) {
                                let el = document.getElementById(`cross-cell-${r+i}-${c}`);
                                el.innerText = word[i];
                                el.classList.add('found-permanent');
                                if(playerIdx !== 0) el.style.setProperty('background', '#f87171', 'important');
                            }
                        }
                    }
                }
            }
        }
        
        const slot = document.querySelector(`.crush-word-slot[data-word="${word}"]`);
        if(slot) slot.querySelectorAll('.crush-letter-box').forEach(box => box.classList.add('found'));
        if(playerIdx === 0) {
            showToast('رائع! وجدت كلمة 🎉');
            document.getElementById('crush-score').innerText = crushScores[0];
        } else {
            showToast(`الخصم وجد كلمة: ${word} ⚡`, true);
        }
        updateOpponentScore('word-crush-opponents', playerIdx, crushScores[playerIdx]);
        if(crushFoundWords.length === crushWords.length) {
            // All words found — load a NEW puzzle instead of ending the game
            setTimeout(() => {
                showToast('أحسنت! جاهز للجولة التالية 🔄');
                loadNextCrushPuzzle();
            }, 1000);
        }
    }
}

let crushAiInterval = null;

function startCrushAI() {
    if(crushAiInterval) clearInterval(crushAiInterval);
    crushAiInterval = setInterval(() => {
        if(crushFoundWords.length === crushWords.length) {
            clearInterval(crushAiInterval);
            crushAiInterval = null;
            return;
        }
        const remaining = crushWords.filter(w => !crushFoundWords.includes(w));
        if(remaining.length > 0 && Math.random() > 0.6) {
            const target = remaining[Math.floor(Math.random() * remaining.length)];
            const botIdx = 1 + Math.floor(Math.random() * (fruitPlayerCount - 1));
            checkCrushWord(target, botIdx);
        }
    }, 4000 + Math.random() * 3000);
}

function loadNextCrushPuzzle() {
    // Pick a new random sub-mode to cycle through the 4 games
    const availableModes = ['circle', 'scrambled', 'image', 'crossword', 'grid', 'discover', 'proverb', 'secret'];
    crushSubMode = availableModes[Math.floor(Math.random() * availableModes.length)];

    // Pick a new puzzle for this sub-mode
    const pool = puzzlesPool[crushSubMode] || puzzlesPool['circle'];
    let nextPuzzle;
    if(pool.length > 1) {
        let attempts = 0;
        do {
            nextPuzzle = pool[Math.floor(Math.random() * pool.length)];
            attempts++;
        } while(nextPuzzle === currentPuzzle && attempts < 10);
    } else {
        nextPuzzle = pool[0];
    }

    // Reset state for the new puzzle (keep scores & timer)
    crushFoundWords = [];
    activeCrosswordCell = null;
    activeCrosswordWord = null;
    currentPuzzle = nextPuzzle;
    crushWords = currentPuzzle.words;

    // Reset visuals
    document.getElementById('crush-circle').style.display = 'none';
    document.getElementById('crush-grid').style.display = 'none';
    document.getElementById('crush-scrambled').style.display = 'none';
    document.getElementById('crush-hint-area').style.display = 'none';
    document.getElementById('crush-keyboard').style.display = 'none';
    document.getElementById('crush-slots').style.display = 'none';
    document.getElementById('crush-current-preview').style.display = 'none';

    if(crushSubMode !== 'crossword') {
        document.getElementById('crush-slots').style.display = 'flex';
        document.getElementById('crush-current-preview').style.display = 'block';
        renderCrushSlots();
    }

    if(crushSubMode === 'circle') {
        document.getElementById('crush-circle').style.display = 'block';
        renderCrushCircle(currentPuzzle.letters);
    } else if(crushSubMode === 'grid' || crushSubMode === 'discover' || crushSubMode === 'proverb' || crushSubMode === 'secret') {
        const gridEl = document.getElementById('crush-grid');
        gridEl.style.display = 'grid';
        gridEl.className = 'crush-grid-container' + (crushSubMode === 'secret' ? ' secret-mode' : '');
        renderCrushGrid(currentPuzzle.grid);
        if(crushSubMode === 'discover' || crushSubMode === 'proverb' || crushSubMode === 'secret') {
            document.getElementById('crush-hint-area').style.display = 'block';
            const hintImg = document.getElementById('crush-hint-img');
            hintImg.innerHTML = '';
            const hints = Array.isArray(currentPuzzle.hint) ? currentPuzzle.hint : [currentPuzzle.hint];
            hints.forEach(h => {
                const span = document.createElement('span');
                span.innerText = h;
                span.style.margin = '0 8px';
                span.style.fontSize = '2.5rem';
                hintImg.appendChild(span);
            });
            gridEl.style.gridTemplateColumns = `repeat(${currentPuzzle.cols || 5}, 55px)`;
        }
    } else if(crushSubMode === 'scrambled') {
        document.getElementById('crush-scrambled').style.display = 'flex';
        renderCrushScrambled(currentPuzzle.letters);
    } else if(crushSubMode === 'image') {
        document.getElementById('crush-hint-area').style.display = 'block';
        document.getElementById('crush-scrambled').style.display = 'flex';
        document.getElementById('crush-hint-img').innerText = currentPuzzle.hint;
        const scrambledLetters = currentPuzzle.words[0].split('').sort(() => Math.random() - 0.5);
        renderCrushScrambled(scrambledLetters);
    } else if(crushSubMode === 'crossword') {
        document.getElementById('crush-grid').style.display = 'grid';
        renderCrushCrossword(currentPuzzle);
    }

    startCrushAI();
}

function finalizeCrushRound() {
    if(crushTimer) clearInterval(crushTimer);
    showToast('انتهى الوقت! 🏁');
    setTimeout(() => {
        const players = fruitPlayerNames.map((name, idx) => ({
            name: name, score: crushScores[idx], isYou: idx === 0
        }));
        
        // Award global coins to the winner
        const maxScore = Math.max(...crushScores);
        const winnerIdx = crushScores.indexOf(maxScore);
        if(winnerIdx === 0) {
            updateCoins(10);
            showToast('مبروك! حصلت على 10 عملات ذهبية 🪙');
        }
        
        showFinalResults(players);
    }, 1500);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Reset transient UI overlays to avoid broken state after refresh.
    const mm = document.getElementById('screen-matchmaking');
    if (mm) mm.style.display = 'none';
    const ms = document.getElementById('screen-match-selection');
    if (ms) ms.style.display = 'none';

    updateScale();
    window.requestAnimationFrame(() => updateScale());
    setTimeout(updateScale, 0);
    setTimeout(updateScale, 120);
    setTimeout(updateScale, 300);
    // Force deterministic startup flow every time:
    // Splash -> Home -> Lobby actions, never jump directly into a game screen.
    showScreen('screen-splash');
});
