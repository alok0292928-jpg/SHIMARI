
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, runTransaction, push, off, query, orderByChild, equalTo, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCH4xse8dtGUNLjdx9_v3RvQdgILPLvuM",
  authDomain: "shikari-4b255.firebaseapp.com",
  databaseURL: "https://shikari-4b255-default-rtdb.firebaseio.com",
  projectId: "shikari-4b255",
  storageBucket: "shikari-4b255.firebasestorage.app",
  messagingSenderId: "463664096292",
  appId: "1:463664096292:web:cffcb76e5730f69a9024b1",
  measurementId: "G-8Q0Q86JX3T"
};

let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export const db = getDatabase(app);
export { ref, onValue, off, update, runTransaction, push };

// Global Heartbeat Helper to prevent multiple clients from running engines simultaneously
const canRunEngine = async (path: string) => {
  const heartbeatRef = ref(db, `${path}/heartbeat`);
  const snapshot = await get(heartbeatRef);
  const lastHeartbeat = snapshot.val() || 0;
  const now = Date.now();
  
  // If last update was more than 3 seconds ago, we take over
  if (now - lastHeartbeat > 3000) {
    await set(heartbeatRef, now);
    return true;
  }
  return false;
};

export const registerUser = async (name: string, phone: string, password: string) => {
  const userRef = ref(db, `users/${phone}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) throw new Error("Number already exists.");
  const userData = {
    id: `u_${Date.now()}`, name, phone, password, balance: 10, totalWon: 0,
    referralCode: `SK${phone.slice(-4)}${Math.floor(Math.random() * 900) + 100}`,
    invitedCount: 0, luck: 1.0, createdAt: Date.now()
  };
  await set(userRef, userData);
  return userData;
};

export const loginUser = async (phone: string, password: string) => {
  const userRef = ref(db, `users/${phone}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) throw new Error("User not found.");
  const userData = snapshot.val();
  if (userData.password !== password) throw new Error("Wrong password.");
  return userData;
};

export const adjustUserBalance = async (phone: string, delta: number) => {
  if (!phone || phone.startsWith('bot_')) return;
  const balanceRef = ref(db, `users/${phone}/balance`);
  try {
    await runTransaction(balanceRef, (currentBalance) => (currentBalance || 0) + delta);
  } catch (error) { console.error("Balance adjustment failed:", error); }
};

export const updateGlobalPool = async (gamePath: string, side: string, amount: number) => {
  const poolRef = ref(db, `${gamePath}/pools/${side}`);
  await runTransaction(poolRef, (currentValue) => (currentValue || 0) + amount);
};

// --- MULTIPLAYER SHARED ENGINES ---

export const runAviatorEngine = async () => {
  const stateRef = ref(db, 'aviator/state');
  return setInterval(async () => {
    if (!(await canRunEngine('aviator'))) return;
    
    try {
      const snapshot = await get(stateRef);
      const data = snapshot.val() || {};
      const now = Date.now();
      
      if (!data.status || (data.status === 'CRASHED' && now - data.crashTime > 6000)) {
        await set(stateRef, { 
          status: 'WAITING', 
          startTime: now + 10000, 
          roundId: (data.roundId || 1000000) + 1, 
          history: data.history || [1.5],
          heartbeat: now
        });
      } else if (data.status === 'WAITING' && now >= data.startTime) {
        const rand = Math.random();
        let cp = rand < 0.1 ? 1.0 : rand < 0.5 ? parseFloat((Math.random() * 1.5 + 1.1).toFixed(2)) : parseFloat((Math.random() * 5 + 1.5).toFixed(2));
        await update(stateRef, { status: 'FLYING', startTime: now, crashPoint: cp, heartbeat: now });
      } else if (data.status === 'FLYING') {
        const elapsed = (now - data.startTime) / 1000;
        const currentMult = Math.pow(1.08, elapsed);
        if (currentMult >= data.crashPoint) {
          const newHistory = [data.crashPoint, ...(data.history || [])].slice(0, 15);
          await update(stateRef, { status: 'CRASHED', history: newHistory, crashTime: now, heartbeat: now });
        } else {
          await update(stateRef, { heartbeat: now });
        }
      }
    } catch (e) {}
  }, 1000);
};

const CARD_VALS: any = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

export const runDragonTigerEngine = async () => {
  const stateRef = ref(db, 'dragontiger/state');
  return setInterval(async () => {
    if (!(await canRunEngine('dragontiger'))) return;

    try {
      const snapshot = await get(stateRef);
      const data = snapshot.val() || {};
      const now = Date.now();
      
      if (!data.status || (data.status === 'RESULT' && now - data.revealTime > 8000)) {
        await set(ref(db, 'dragontiger/pools'), { DRAGON: 0, TIGER: 0, TIE: 0 });
        const newHistory = [data.winner || 'D', ...(data.history || [])].slice(0, 20);
        await set(stateRef, { status: 'WAITING', startTime: now + 15000, roundId: (data.roundId || 5000000) + 1, history: newHistory, heartbeat: now });
      } else if (data.status === 'WAITING' && now >= data.startTime) {
        const poolSnap = await get(ref(db, 'dragontiger/pools'));
        const pools = poolSnap.val() || { DRAGON: 0, TIGER: 0, TIE: 0 };
        
        let winner: 'D' | 'T' | 'Tie' = Math.random() < 0.5 ? 'D' : 'T';
        if (pools.DRAGON > pools.TIGER * 1.3) winner = 'T'; 
        else if (pools.TIGER > pools.DRAGON * 1.3) winner = 'D';

        const cards = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        let dCard = cards[Math.floor(Math.random()*13)];
        let tCard = cards[Math.floor(Math.random()*13)];
        
        if (winner === 'D') { while(CARD_VALS[dCard] <= CARD_VALS[tCard]) { dCard = cards[Math.floor(Math.random()*13)]; tCard = cards[Math.floor(Math.random()*13)]; } }
        else if (winner === 'T') { while(CARD_VALS[tCard] <= CARD_VALS[dCard]) { dCard = cards[Math.floor(Math.random()*13)]; tCard = cards[Math.floor(Math.random()*13)]; } }

        await update(stateRef, { status: 'RESULT', dragonCard: dCard, tigerCard: tCard, winner, revealTime: now, heartbeat: now });
      } else {
        await update(stateRef, { heartbeat: now });
      }
    } catch (e) {}
  }, 1000);
};

export const runRedLightEngine = async () => {
  const stateRef = ref(db, 'redlight/state');
  return setInterval(async () => {
    if (!(await canRunEngine('redlight'))) return;
    try {
      const snap = await get(stateRef);
      const data = snap.val() || {};
      const now = Date.now();
      
      if (!data.status || (data.status === 'RESULT' && now - data.revealTime > 10000)) {
        await set(ref(db, 'redlight/pools'), { P1:0, P2:0, P3:0, P4:0, P5:0 });
        const newHistory = [data.winnerId ? `P${data.winnerId}` : 'None', ...(data.history || [])].slice(0, 15);
        await set(stateRef, { status: 'BETTING', startTime: now + 15000, roundId: (data.roundId || 6000000) + 1, history: newHistory, heartbeat: now });
      } else if (data.status === 'BETTING' && now >= data.startTime) {
        const poolSnap = await get(ref(db, 'redlight/pools'));
        const pools = poolSnap.val() || {};
        let winnerId = 1; let minMoney = Infinity;
        for(let i=1; i<=5; i++) {
          const m = pools[`P${i}`] || 0;
          if (m < minMoney) { minMoney = m; winnerId = i; }
        }
        await update(stateRef, { status: 'PLAYING', winnerId, playStartTime: now, lightState: 'GREEN', heartbeat: now });
      } else if (data.status === 'PLAYING') {
        const elapsed = now - data.playStartTime;
        const cycle = Math.floor(elapsed / 3000) % 2 === 0 ? 'GREEN' : 'RED';
        if (cycle !== data.lightState) await update(stateRef, { lightState: cycle, heartbeat: now });
        if (elapsed > 12000) await update(stateRef, { status: 'RESULT', revealTime: now, heartbeat: now });
      } else {
        await update(stateRef, { heartbeat: now });
      }
    } catch (e) {}
  }, 1000);
};

export const runDalgonaEngine = async () => {
  const stateRef = ref(db, 'dalgona/state');
  return setInterval(async () => {
    if (!(await canRunEngine('dalgona'))) return;
    try {
      const snap = await get(stateRef);
      const data = snap.val() || {};
      const now = Date.now();
      if (!data.status || (data.status === 'RESULT' && now - data.revealTime > 10000)) {
        await set(ref(db, 'dalgona/pools'), Object.fromEntries(Array.from({length:10}, (_, i) => [`P${i+1}`, 0])));
        const newHistory = [data.winnerId ? `P${data.winnerId}` : 'None', ...(data.history || [])].slice(0, 15);
        await set(stateRef, { 
          status: 'BETTING', startTime: now + 20000, roundId: (data.roundId || 4000000) + 1,
          players: Array.from({length:10}, (_, i) => ({ id: i+1, shape: ['Circle','Triangle','Star','Umbrella'][Math.floor(Math.random()*4)] })),
          heartbeat: now, history: newHistory
        });
      } else if (data.status === 'BETTING' && now >= data.startTime) {
        const poolSnap = await get(ref(db, 'dalgona/pools'));
        const pools = poolSnap.val() || {};
        let winnerId = 1; let minMoney = Infinity;
        for(let i=1; i<=10; i++) {
          const m = pools[`P${i}`] || 0;
          if (m < minMoney) { minMoney = m; winnerId = i; }
        }
        await update(stateRef, { status: 'PLAYING', winnerId, playStartTime: now, heartbeat: now });
      } else if (data.status === 'PLAYING' && now - data.playStartTime > 8000) {
        await update(stateRef, { status: 'RESULT', revealTime: now, heartbeat: now });
      } else {
        await update(stateRef, { heartbeat: now });
      }
    } catch (e) {}
  }, 1000);
};

export const runCrowdBreakerEngine = async () => {
  const stateRef = ref(db, 'crowdbreaker/state');
  return setInterval(async () => {
    if (!(await canRunEngine('crowdbreaker'))) return;
    try {
      const snap = await get(stateRef);
      const data = snap.val() || {};
      const now = Date.now();
      if (!data.status || (data.status === 'RESULT' && now - data.revealTime > 12000)) {
        await set(ref(db, 'crowdbreaker/pools'), { RED: 0, GREEN: 0 });
        const newHist = [data.winner === 'RED' ? 'R' : 'G', ...(data.history || [])].slice(0, 20);
        await set(stateRef, { status: 'BETTING', startTime: now + 30000, roundId: (data.roundId || 3000000) + 1, history: newHist, heartbeat: now });
      } else if (data.status === 'BETTING' && now >= data.startTime) {
        const poolSnap = await get(ref(db, 'crowdbreaker/pools'));
        const pools = poolSnap.val() || { RED: 0, GREEN: 0 };
        let winner = pools.RED > pools.GREEN ? 'GREEN' : 'RED'; 
        if (pools.RED === pools.GREEN) winner = Math.random() < 0.5 ? 'RED' : 'GREEN';
        await update(stateRef, { status: 'RESULT', winner, revealTime: now, heartbeat: now });
      } else {
        await update(stateRef, { heartbeat: now });
      }
    } catch (e) {}
  }, 1000);
};

export const syncWormState = (wormId: string, state: any) => {
  if (!wormId) return;
  const wormRef = ref(db, `arena/worms/${wormId}`);
  if (state === null) set(wormRef, null); else update(wormRef, state);
};

export const submitDepositRequest = async (phone: string, amount: number, utr: string) => {
  const transRef = ref(db, `transactions/${phone}`);
  const newTransRef = push(transRef);
  await set(newTransRef, { id: newTransRef.key, type: 'DEPOSIT', amount, utr, status: 'PENDING', date: Date.now() });
};

export const redeemGiftCode = async (phone: string, code: string) => {
  const codeRef = ref(db, `giftCodes/${code}`);
  const result = await runTransaction(codeRef, (currentData) => {
    if (currentData === null || currentData.status === 'USED') return;
    return { ...currentData, status: 'USED', redeemedBy: phone, redeemedAt: Date.now() };
  });
  if (!result.committed || !result.snapshot.exists()) throw new Error("Invalid or used code.");
  const amount = result.snapshot.val().amount || 0;
  if (amount > 0) await adjustUserBalance(phone, amount);
  return amount;
};

export const updatePaymentSettings = async (settings: { upiId: string; qrUrl: string }) => {
  await set(ref(db, 'settings/payment'), settings);
};
