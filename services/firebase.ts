
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, runTransaction, push, off, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

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

export const registerUser = async (name: string, phone: string, password: string) => {
  const userRef = ref(db, `users/${phone}`);
  const snapshot = await get(userRef);
  
  if (snapshot.exists()) {
    throw new Error("This mobile number is already registered.");
  }

  const userData = {
    id: `u_${Date.now()}`,
    name,
    phone,
    password,
    balance: 10,
    totalWon: 0,
    createdAt: Date.now()
  };

  await set(userRef, userData);
  return userData;
};

export const loginUser = async (phone: string, password: string) => {
  const userRef = ref(db, `users/${phone}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) throw new Error("User not found. Please register.");
  const userData = snapshot.val();
  if (userData.password !== password) throw new Error("Incorrect password.");
  return userData;
};

export const submitDepositRequest = async (phone: string, amount: number, utr: string) => {
  const transRef = ref(db, `transactions/${phone}`);
  const newTransRef = push(transRef);
  
  const transaction = {
    id: newTransRef.key,
    type: 'DEPOSIT',
    amount,
    utr,
    status: 'PENDING',
    date: Date.now()
  };

  await set(newTransRef, transaction);
  return transaction;
};

export const adjustUserBalance = async (phone: string, delta: number) => {
  if (!phone || phone.startsWith('bot_')) return;
  const balanceRef = ref(db, `users/${phone}/balance`);
  try {
    await runTransaction(balanceRef, (currentBalance) => {
      const balance = currentBalance === null ? 0 : currentBalance;
      return balance + delta;
    });
  } catch (error) {
    console.error("Balance adjustment failed:", error);
  }
};

export const syncWormState = (wormId: string, state: any) => {
  if (!wormId) return;
  const wormRef = ref(db, `arena/worms/${wormId}`);
  if (state === null) {
    set(wormRef, null);
  } else {
    update(wormRef, state);
  }
};

export const updatePaymentSettings = async (settings: { upiId: string; qrUrl: string }) => {
  const settingsRef = ref(db, 'settings/payment');
  await set(settingsRef, settings);
};
