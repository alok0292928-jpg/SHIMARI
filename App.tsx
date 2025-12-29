
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Worm, Food, Point, KillEvent, AppTab, UserProfile, Transaction, MatchHistory } from './types';
import * as Constants from './constants';
import Joystick from './components/Joystick';
import UIOverlay from './components/UIOverlay';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import WalletView from './components/WalletView';
import AccountView from './components/AccountView';
import LoginView from './components/LoginView';
import AdminView from './components/AdminView';
import { db, syncWormState, adjustUserBalance, ref, onValue, off } from './services/firebase';

interface AIWorm extends Worm {
  spawnTime: number;
  targetId: string | null;
  lastTargetSwap: number;
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('HOME');
  const [user, setUser] = useState<UserProfile>({
    id: '', phone: '', name: 'Player', balance: 0, totalWon: 0
  });
  
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [selectedFee, setSelectedFee] = useState(Constants.DEFAULT_ENTRY_FEE);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wormsRef = useRef<Worm[]>([]);
  const foodRef = useRef<Food[]>([]);
  const cameraRef = useRef({ x: 0, y: 0 });
  const playerInputRef = useRef({ angle: 0, magnitude: 0, boosting: false });
  const lastUpdateRef = useRef(0);
  const lastSyncRef = useRef(0);
  const killsCountRef = useRef(0);
  const sessionStartRef = useRef(0);

  // Sync user profile from DB
  useEffect(() => {
    if (!isLoggedIn || !user.phone) return;
    
    const userRef = ref(db, `users/${user.phone}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setUser(data);
    });

    const arenaRef = ref(db, 'arena/worms');
    const arenaUnsubscribe = onValue(arenaRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const remoteWorms: Worm[] = Object.keys(data)
        .filter(id => id !== user.phone)
        .map(id => ({ ...data[id], id, isPlayer: false, isDead: false }));
      
      const player = wormsRef.current.find(w => w.isPlayer);
      const aiWorms = wormsRef.current.filter(w => w.id.startsWith('bot_'));
      wormsRef.current = [...(player ? [player] : []), ...remoteWorms, ...aiWorms];
    });

    return () => {
      off(userRef, 'value', unsubscribe);
      off(arenaRef, 'value', arenaUnsubscribe);
    };
  }, [isLoggedIn, user.phone]);

  const createBot = useCallback((index: number): AIWorm => {
    const x = Math.random() * Constants.WORLD_SIZE;
    const y = Math.random() * Constants.WORLD_SIZE;
    return {
      id: `bot_${index}_${Math.random().toString(36).substr(2, 5)}`,
      name: Constants.NAMES[Math.floor(Math.random() * Constants.NAMES.length)],
      segments: Array.from({ length: 20 }, (_, i) => ({ x, y: y + i * Constants.SEGMENT_DISTANCE })),
      angle: Math.random() * Math.PI * 2,
      speed: Constants.BASE_SPEED,
      balance: 0,
      color: Constants.WORM_COLORS[Math.floor(Math.random() * Constants.WORM_COLORS.length)],
      isPlayer: false,
      isDead: false,
      spawnTime: Date.now(),
      targetId: null,
      lastTargetSwap: 0
    };
  }, []);

  const initGame = useCallback(async (fee: number) => {
    if (user.balance < fee) {
      alert(`Insufficient balance! You need ₹${fee.toFixed(2)} to play this mode.`);
      return;
    }
    
    setSelectedFee(fee);
    await adjustUserBalance(user.phone, -fee);
    
    setActiveTab('GAME');
    sessionStartRef.current = Date.now();

    const player: Worm = {
      id: user.phone || 'player',
      name: user.name,
      segments: Array.from({ length: 20 }, (_, i) => ({ x: 2000, y: 2000 + i * Constants.SEGMENT_DISTANCE })),
      angle: -Math.PI / 2,
      speed: Constants.BASE_SPEED,
      balance: fee,
      color: Constants.COLORS.gold,
      isPlayer: true,
      isDead: false,
    };

    wormsRef.current = [player, ...Array.from({ length: Constants.MIN_RIVALS }, (_, i) => createBot(i))];
    foodRef.current = Array.from({ length: Constants.FOOD_COUNT }, () => ({
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * Constants.WORLD_SIZE, y: Math.random() * Constants.WORLD_SIZE,
      value: Constants.FOOD_VALUE, color: Constants.WORM_COLORS[Math.floor(Math.random() * Constants.WORM_COLORS.length)]
    }));
    killsCountRef.current = 0;
  }, [user, createBot]);

  useEffect(() => {
    if (activeTab !== 'GAME') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      if (activeTab !== 'GAME') return;
      const dt = lastUpdateRef.current ? (time - lastUpdateRef.current) / 16.66 : 1;
      lastUpdateRef.current = time;

      const player = wormsRef.current.find(w => w.isPlayer);
      
      // Update AI Worms
      wormsRef.current.forEach(worm => {
        if (worm.isDead || worm.isPlayer || !worm.id.startsWith('bot_')) return;
        const bot = worm as AIWorm;
        const head = bot.segments[0];
        let targetAngle = bot.angle;
        let shouldBoost = false;
        const now = Date.now();
        const isPro = (now - bot.spawnTime) > 10000;

        if (isPro) {
          const currentTarget = wormsRef.current.find(w => w.id === bot.targetId && !w.isDead);
          if (!currentTarget || now - bot.lastTargetSwap > 5000) {
            const potentialTargets = wormsRef.current.filter(w => w.id !== bot.id && !w.isDead);
            let closest = null;
            let minDist = 1200; 

            potentialTargets.forEach(t => {
              const dx = t.segments[0].x - head.x;
              const dy = t.segments[0].y - head.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < minDist) {
                minDist = dist;
                closest = t;
              }
            });

            if (closest) {
              bot.targetId = closest.id;
              bot.lastTargetSwap = now;
            } else {
              bot.targetId = null;
            }
          }

          if (bot.targetId) {
            const targetWorm = wormsRef.current.find(w => w.id === bot.targetId);
            if (targetWorm) {
              const dx = targetWorm.segments[0].x - head.x;
              const dy = targetWorm.segments[0].y - head.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const predictX = targetWorm.segments[0].x + Math.cos(targetWorm.angle) * targetWorm.speed * 15;
              const predictY = targetWorm.segments[0].y + Math.sin(targetWorm.angle) * targetWorm.speed * 15;
              targetAngle = Math.atan2(predictY - head.y, predictX - head.x);
              if (dist < 300) shouldBoost = true;
            }
          } else {
            targetAngle += (Math.random() - 0.5) * 0.1;
          }
        } else {
          targetAngle += (Math.random() - 0.5) * 0.15;
        }

        const m = 200;
        if (head.x < m) targetAngle = 0;
        if (head.x > Constants.WORLD_SIZE - m) targetAngle = Math.PI;
        if (head.y < m) targetAngle = Math.PI / 2;
        if (head.y > Constants.WORLD_SIZE - m) targetAngle = -Math.PI / 2;

        const diff = Math.atan2(Math.sin(targetAngle - bot.angle), Math.cos(targetAngle - bot.angle));
        bot.angle += diff * (isPro ? 0.14 : 0.05) * dt;
        bot.speed = shouldBoost ? Constants.BOOST_SPEED : Constants.BASE_SPEED;
      });

      if (player && !player.isDead) {
        if (playerInputRef.current.magnitude > 0.1) player.angle = playerInputRef.current.angle;
        player.speed = playerInputRef.current.boosting ? Constants.BOOST_SPEED : Constants.BASE_SPEED;
        cameraRef.current.x = player.segments[0].x - canvas.width / 2;
        cameraRef.current.y = player.segments[0].y - canvas.height / 2;

        if (time - lastSyncRef.current > 100) {
          syncWormState(player.id, { 
            segments: player.segments, 
            angle: player.angle, 
            balance: player.balance, 
            name: player.name, 
            color: player.color 
          });
          lastSyncRef.current = time;
        }
      }

      wormsRef.current.forEach(worm => {
        if (worm.isDead) return;
        const head = worm.segments[0];
        const newHead = { x: head.x + Math.cos(worm.angle) * worm.speed * dt, y: head.y + Math.sin(worm.angle) * worm.speed * dt };
        const newSegments = [newHead, ...worm.segments.slice(0, -1)];
        for (let i = 1; i < newSegments.length; i++) {
          const prev = newSegments[i-1]; const curr = newSegments[i];
          const dx = prev.x - curr.x; const dy = prev.y - curr.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > Constants.SEGMENT_DISTANCE) {
            const angle = Math.atan2(dy, dx);
            curr.x = prev.x - Math.cos(angle) * Constants.SEGMENT_DISTANCE;
            curr.y = prev.y - Math.sin(angle) * Constants.SEGMENT_DISTANCE;
          }
        }
        worm.segments = newSegments;
        const targetLen = Math.floor(20 + worm.balance / 10);
        while (worm.segments.length < targetLen) worm.segments.push({ ...worm.segments[worm.segments.length - 1] });
      });

      wormsRef.current.forEach(wormA => {
        if (wormA.isDead) return;
        const headA = wormA.segments[0];
        wormsRef.current.forEach(wormB => {
          if (wormB.isDead || wormA.id === wormB.id) return;
          for (let i = 0; i < wormB.segments.length; i++) {
            const segB = wormB.segments[i];
            const dx = headA.x - segB.x; const dy = headA.y - segB.y;
            const threshold = (22 + (wormA.balance + wormB.balance) / 100) * 0.8;
            if (dx*dx + dy*dy < threshold * threshold) {
              const loot = wormA.balance;
              wormB.balance += loot;
              wormA.isDead = true;
              
              if (wormB.isPlayer) {
                adjustUserBalance(wormB.id, loot);
                killsCountRef.current++;
              }
              
              if (wormA.isPlayer) {
                const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
                setMatchHistory(prev => [{ 
                  id: Math.random().toString(), 
                  date: Date.now(), 
                  kills: killsCountRef.current, 
                  earnings: wormA.balance - selectedFee, 
                  duration: `${Math.floor(duration/60)}m ${duration%60}s` 
                }, ...prev]);
                setTimeout(() => setActiveTab('ACCOUNT'), 1500);
              }
              return;
            }
          }
        });

        foodRef.current = foodRef.current.filter(f => {
          const dx = headA.x - f.x; const dy = headA.y - f.y;
          if (dx*dx + dy*dy < 500) { 
            wormA.balance += f.value; 
            if (wormA.isPlayer) {
              adjustUserBalance(wormA.id, f.value);
            }
            return false; 
          }
          return true;
        });
      });

      if (foodRef.current.length < Constants.FOOD_COUNT) {
        foodRef.current.push({ id: Math.random().toString(), x: Math.random() * Constants.WORLD_SIZE, y: Math.random() * Constants.WORLD_SIZE, value: Constants.FOOD_VALUE, color: Constants.WORM_COLORS[Math.floor(Math.random()*Constants.WORM_COLORS.length)] });
      }
      
      const activeBots = wormsRef.current.filter(w => !w.isDead && w.id.startsWith('bot_'));
      if (activeBots.length < Constants.MIN_RIVALS) wormsRef.current.push(createBot(activeBots.length));
      wormsRef.current = wormsRef.current.filter(w => !w.isDead || w.isPlayer);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);
      ctx.strokeStyle = '#ffffff04';
      for (let x = 0; x <= Constants.WORLD_SIZE; x += 200) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Constants.WORLD_SIZE); ctx.stroke(); }
      for (let y = 0; y <= Constants.WORLD_SIZE; y += 200) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Constants.WORLD_SIZE, y); ctx.stroke(); }
      foodRef.current.forEach(f => { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI*2); ctx.fill(); });
      wormsRef.current.forEach(worm => {
        if (worm.isDead) return;
        ctx.strokeStyle = worm.color;
        const thickness = 18 + (worm.balance / 100);
        ctx.lineWidth = thickness; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        if (worm.segments.length > 0) {
          ctx.moveTo(worm.segments[0].x, worm.segments[0].y);
          worm.segments.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
          const h = worm.segments[0];
          ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(h.x, h.y, thickness/3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'white'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
          ctx.fillText(worm.name, h.x, h.y - thickness - 10);
          ctx.font = '9px Orbitron'; ctx.fillStyle = Constants.COLORS.gold;
          ctx.fillText(`₹${(worm.balance || 0).toFixed(2)}`, h.x, h.y - thickness + 5);
        }
      });
      ctx.restore();
      requestAnimationFrame(loop);
    };

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    handleResize();
    const animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, [activeTab, user.phone, user.name, createBot, selectedFee]);

  const handleQuit = () => {
    const player = wormsRef.current.find(w => w.isPlayer);
    if (player && !player.isDead) {
      syncWormState(player.id, null);
    }
    setActiveTab('HOME');
  };

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    setIsAdmin(userData.phone === '8051351988');
    setIsLoggedIn(true);
    if (userData.phone === '8051351988') setActiveTab('ADMIN');
  };

  if (!isLoggedIn) return <LoginView onLogin={handleLogin} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin}>
      {activeTab === 'HOME' && <HomeView onEnterGame={initGame} balance={user.balance} />}
      {activeTab === 'ACTIVITY' && <WalletView balance={user.balance} phone={user.phone} />}
      {activeTab === 'ACCOUNT' && <AccountView user={user} history={matchHistory} onLogout={() => { setIsLoggedIn(false); setIsAdmin(false); }} />}
      {activeTab === 'ADMIN' && <AdminView />}
      {activeTab === 'GAME' && (
        <div className="relative w-full h-full">
          <canvas ref={canvasRef} className="w-full h-full bg-[#050505]" />
          <UIOverlay 
            walletBalance={user.balance} 
            wormBalance={wormsRef.current.find(w => w.isPlayer)?.balance || 0}
            killFeed={[]} 
            leaderboard={wormsRef.current.filter(w => !w.isDead).sort((a,b) => b.balance - a.balance)} 
            status="" 
          />
          <Joystick onMove={(angle, magnitude) => { playerInputRef.current.angle = angle; playerInputRef.current.magnitude = magnitude; }} onEnd={() => playerInputRef.current.magnitude = 0} />
          <button onClick={handleQuit} className="fixed top-6 right-6 z-50 bg-[#161d2b]/90 backdrop-blur-md text-white/40 border border-white/10 px-6 py-3 rounded-2xl font-black text-[10px] font-orbitron hover:text-white transition-all uppercase tracking-widest shadow-2xl">Exit Arena</button>
          <button className="fixed bottom-12 right-12 w-28 h-28 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 backdrop-blur-xl z-50 active:bg-[#d4af37] active:scale-95 transition-all flex items-center justify-center group shadow-[0_0_50px_rgba(212,175,55,0.2)]" onMouseDown={() => { playerInputRef.current.boosting = true; }} onMouseUp={() => { playerInputRef.current.boosting = false; }} onTouchStart={() => { playerInputRef.current.boosting = true; }} onTouchEnd={() => { playerInputRef.current.boosting = false; }}>
            <span className="font-orbitron font-black text-xs text-[#d4af37] group-active:text-black tracking-widest uppercase">Nitro</span>
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
