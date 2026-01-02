
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Worm, Food, Point, KillEvent, AppTab, UserProfile, Transaction, MatchHistory, GameID } from './types';
import * as Constants from './constants';
import Joystick from './components/Joystick';
import UIOverlay from './components/UIOverlay';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import WalletView from './components/WalletView';
import AccountView from './components/AccountView';
import LoginView from './components/LoginView';
import AdminView from './components/AdminView';
import AviatorGame from './components/RocketGame';
import MinesGame from './components/MinesGame';
import TowerGame from './components/TowerGame'; 
import DragonTigerGame from './components/DragonTigerGame';
import CrowdBreakerGame from './components/CrowdBreakerGame';
import DalgonaGame from './components/DalgonaGame';
import RedLightGame from './components/RedLightGame';
import ChickenRoadGame from './components/ChickenRoadGame';
import { db, syncWormState, adjustUserBalance, ref, onValue, off, runAviatorEngine, runDragonTigerEngine, runCrowdBreakerEngine, runDalgonaEngine, runRedLightEngine } from './services/firebase';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('HOME');
  const [walletInitialView, setWalletInitialView] = useState<'MAIN' | 'DEPOSIT' | 'WITHDRAW'>('MAIN');
  const [activeGame, setActiveGame] = useState<GameID | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState<{kills: number, earnings: number} | null>(null);
  const [user, setUser] = useState<UserProfile>({
    id: '', phone: '', name: 'Player', balance: 0, totalWon: 0, referralCode: '', invitedCount: 0, luck: 1.0
  });
  
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [selectedFee, setSelectedFee] = useState(Constants.DEFAULT_ENTRY_FEE);
  const [sessionKey, setSessionKey] = useState(0); 
  
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<GameID | null>(null);
  const [customStake, setCustomStake] = useState('10');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wormsRef = useRef<Worm[]>([]);
  const foodRef = useRef<Food[]>([]);
  const cameraRef = useRef({ x: 0, y: 0 });
  const playerInputRef = useRef({ angle: 0, magnitude: 0, boosting: false });
  const lastUpdateRef = useRef(0);
  const killsCountRef = useRef(0);
  
  const enginesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn || !user.phone) return;
    const userRef = ref(db, `users/${user.phone}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setUser(data);
    });
    
    const startEngines = async () => {
       enginesRef.current = [
         await runAviatorEngine(),
         await runDragonTigerEngine(),
         await runCrowdBreakerEngine(),
         await runDalgonaEngine(),
         await runRedLightEngine()
       ];
    };
    startEngines();

    return () => {
      off(userRef, 'value', unsubscribe);
      enginesRef.current.forEach(id => clearInterval(id));
    };
  }, [isLoggedIn, user.phone]);

  const initGame = async (gameId: GameID, fee: number) => {
    if (gameId === 'WORM' || gameId === 'SNAKE_RUSH') {
      setPendingGameId(gameId);
      setShowStakeModal(true);
      return;
    }
    startActualGame(gameId, fee);
  };

  const startActualGame = async (gameId: GameID, fee: number) => {
    const finalFee = Math.max(10, fee);
    setSelectedFee(finalFee);
    setActiveGame(gameId);
    setActiveTab('GAME');
    setShowGameOver(false);
    setShowStakeModal(false);
    setSessionKey(Date.now());

    if (gameId === 'WORM' || gameId === 'SNAKE_RUSH') {
      if (user.balance < finalFee) { alert("Insufficient Balance!"); return; }
      await adjustUserBalance(user.phone, -finalFee);
      const isRush = gameId === 'SNAKE_RUSH';
      
      const now = Date.now();
      const player: Worm = {
        id: user.phone || 'player', name: user.name,
        segments: Array.from({ length: 20 }, (_, i) => ({ x: 2000, y: 2000 + i * Constants.SEGMENT_DISTANCE })),
        angle: -Math.PI / 2, speed: Constants.BASE_SPEED, balance: finalFee, color: Constants.COLORS.gold, isPlayer: true, isDead: false,
        spawnTime: now
      };

      const rivals = Array.from({ length: isRush ? 9 : Constants.MIN_RIVALS }, (_, i) => {
        let rx, ry;
        do {
          rx = Math.random() * Constants.WORLD_SIZE;
          ry = Math.random() * Constants.WORLD_SIZE;
        } while (Math.sqrt(Math.pow(rx - 2000, 2) + Math.pow(ry - 2000, 2)) < 1000);

        return {
          id: `bot_${i}`, name: Constants.NAMES[Math.floor(Math.random() * Constants.NAMES.length)],
          segments: Array.from({ length: 20 }, (_, j) => ({ x: rx, y: ry + j * Constants.SEGMENT_DISTANCE })),
          angle: Math.random() * Math.PI * 2, speed: Constants.BASE_SPEED, balance: isRush ? finalFee : Constants.FOOD_VALUE * 20,
          color: Constants.WORM_COLORS[Math.floor(Math.random() * Constants.WORM_COLORS.length)], isPlayer: false, isDead: false,
          spawnTime: now
        };
      });

      wormsRef.current = [player, ...rivals];
      foodRef.current = Array.from({ length: Constants.FOOD_COUNT }, () => ({
        id: Math.random().toString(36).substr(2, 9), x: Math.random() * Constants.WORLD_SIZE, y: Math.random() * Constants.WORLD_SIZE,
        value: Constants.FOOD_VALUE, color: Constants.WORM_COLORS[Math.floor(Math.random() * Constants.WORM_COLORS.length)]
      }));
      killsCountRef.current = 0;
    }
  };

  const handleGameFinish = (payout: number, shouldExit: boolean = false) => {
    if (payout > 0) adjustUserBalance(user.phone, payout);
    if (shouldExit) {
      const profit = payout - selectedFee;
      setMatchHistory(prev => [{ id: Math.random().toString(), date: Date.now(), earnings: profit, gameType: activeGame || 'Arena' }, ...prev]);
      handleQuit();
    }
  };

  const handleQuit = () => { setActiveTab('HOME'); setActiveGame(null); setShowGameOver(false); };

  useEffect(() => {
    if (activeTab !== 'GAME' || !['WORM', 'SNAKE_RUSH'].includes(activeGame as string) || showGameOver) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const loop = (time: number) => {
      if (activeTab !== 'GAME' || !['WORM', 'SNAKE_RUSH'].includes(activeGame as string) || showGameOver) return;
      const dt = lastUpdateRef.current ? (time - lastUpdateRef.current) / 16.66 : 1;
      lastUpdateRef.current = time;
      const player = wormsRef.current.find(w => w.isPlayer);
      const now = Date.now();
      
      if (player && !player.isDead) {
        if (playerInputRef.current.magnitude > 0.1) player.angle = playerInputRef.current.angle;
        player.speed = playerInputRef.current.boosting ? Constants.BOOST_SPEED : Constants.BASE_SPEED;
        cameraRef.current.x = player.segments[0].x - canvas.width / 2;
        cameraRef.current.y = player.segments[0].y - canvas.height / 2;
      }

      wormsRef.current.forEach(worm => {
        if (worm.isDead) return;
        const head = worm.segments[0];
        const isInvincible = now - (worm.spawnTime || 0) < 3000;

        if (head.x < 0 || head.x > Constants.WORLD_SIZE || head.y < 0 || head.y > Constants.WORLD_SIZE) {
          worm.isDead = true;
          if (worm.isPlayer) {
            setLastMatchResult({ kills: killsCountRef.current, earnings: -selectedFee });
            setShowGameOver(true);
          }
          return;
        }

        if (!isInvincible) {
          for (const other of wormsRef.current) {
            if (other.isDead || (now - (other.spawnTime || 0) < 3000)) continue;
            const collisionDistSq = Math.pow(12 + other.balance / 100, 2);
            other.segments.forEach((segment, segmentIndex) => {
              if (other.id === worm.id && segmentIndex < 15) return;
              const dx = head.x - segment.x;
              const dy = head.y - segment.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < collisionDistSq) {
                worm.isDead = true;
                if (!worm.isPlayer && other.isPlayer) killsCountRef.current += 1;
                worm.segments.forEach((seg, idx) => {
                  if (idx % 2 === 0) {
                    foodRef.current.push({
                      id: Math.random().toString(36).substr(2, 9),
                      x: seg.x + (Math.random() - 0.5) * 30,
                      y: seg.y + (Math.random() - 0.5) * 30,
                      value: Constants.FOOD_VALUE * 2,
                      color: worm.color
                    });
                  }
                });
                if (worm.isPlayer) {
                  setLastMatchResult({ kills: killsCountRef.current, earnings: -selectedFee });
                  setShowGameOver(true);
                }
              }
            });
            if (worm.isDead) break;
          }
        }

        if (worm.isDead) return;

        if (!worm.isPlayer) {
          worm.angle += (Math.random() - 0.5) * 0.15;
          if (head.x < 300) worm.angle = 0; if (head.x > Constants.WORLD_SIZE - 300) worm.angle = Math.PI;
          if (head.y < 300) worm.angle = Math.PI / 2; if (head.y > Constants.WORLD_SIZE - 300) worm.angle = -Math.PI / 2;
        }

        const newHead = { x: head.x + Math.cos(worm.angle) * worm.speed * dt, y: head.y + Math.sin(worm.angle) * worm.speed * dt };
        worm.segments = [newHead, ...worm.segments.slice(0, -1)];

        foodRef.current.forEach((f, idx) => {
          const dx = head.x - f.x; const dy = head.y - f.y;
          if (dx*dx + dy*dy < 1200) {
            worm.balance += f.value; if (worm.isPlayer) adjustUserBalance(user.phone, f.value);
            foodRef.current[idx] = { ...f, x: Math.random() * Constants.WORLD_SIZE, y: Math.random() * Constants.WORLD_SIZE };
          }
        });
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save(); ctx.translate(-cameraRef.current.x, -cameraRef.current.y);
      ctx.strokeStyle = '#ffffff08'; ctx.lineWidth = 1;
      for (let x = 0; x <= Constants.WORLD_SIZE; x += 200) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Constants.WORLD_SIZE); ctx.stroke(); }
      for (let y = 0; y <= Constants.WORLD_SIZE; y += 200) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Constants.WORLD_SIZE, y); ctx.stroke(); }
      foodRef.current.forEach(f => { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, Math.PI*2); ctx.fill(); });
      wormsRef.current.forEach(worm => {
        if (worm.isDead) return;
        const isInvincible = now - (worm.spawnTime || 0) < 3000;
        const thickness = 15 + worm.balance / 100;
        ctx.globalAlpha = isInvincible ? 0.4 : 1.0;
        ctx.strokeStyle = worm.color; ctx.lineWidth = thickness; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); worm.segments.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke();
        const h = worm.segments[0];
        ctx.fillStyle = 'white';
        const eyeX = h.x + Math.cos(worm.angle) * (thickness/2);
        const eyeY = h.y + Math.sin(worm.angle) * (thickness/2);
        ctx.beginPath(); ctx.arc(eyeX, eyeY, thickness/4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = isInvincible ? 'rgba(255,255,255,0.5)' : 'white'; 
        ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
        ctx.fillText(`${worm.name}${isInvincible ? ' [SHIELD]' : ''} (₹${worm.balance.toFixed(0)})`, h.x, h.y - thickness - 10);
        ctx.globalAlpha = 1.0;
      });
      ctx.restore(); requestAnimationFrame(loop);
    };
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize); handleResize();
    const animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, [activeTab, activeGame, showGameOver, user.phone, selectedFee]);

  if (!isLoggedIn) return <LoginView onLogin={(u) => { setUser(u); setIsAdmin(u.phone === '8051351988'); setIsLoggedIn(true); if(u.phone === '8051351988') setActiveTab('ADMIN'); }} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setWalletInitialView('MAIN'); }} isAdmin={isAdmin}>
      {activeTab === 'HOME' && <HomeView onEnterGame={initGame} onSwitchTab={(t, v) => { setActiveTab(t); setWalletInitialView(v || 'MAIN'); }} balance={user.balance} />}
      {activeTab === 'ACTIVITY' && <WalletView balance={user.balance} phone={user.phone} initialView={walletInitialView} />}
      {activeTab === 'ACCOUNT' && <AccountView user={user} history={matchHistory} onLogout={() => { setIsLoggedIn(false); }} />}
      {activeTab === 'ADMIN' && <AdminView />}
      {activeTab === 'GAME' && (
        <div className="relative w-full h-full bg-[#050505]">
          {activeGame === 'CHICKEN_ROAD' && <ChickenRoadGame userPhone={user.phone} userBalance={user.balance} userLuck={user.luck || 1} onFinish={handleGameFinish} />}
          {activeGame === 'ROCKET' && <AviatorGame fee={selectedFee} userLuck={user.luck || 1} userPhone={user.phone} userBalance={user.balance} onFinish={handleGameFinish} />}
          {activeGame === 'MINES' && <MinesGame fee={selectedFee} walletBalance={user.balance} mineCount={3} userLuck={user.luck || 1} onFinish={handleGameFinish} onRestart={(f) => startActualGame('MINES', f)} />}
          {activeGame === 'DRAGON_TIGER' && <DragonTigerGame fee={selectedFee} walletBalance={user.balance} userLuck={user.luck || 1} userPhone={user.phone} onFinish={handleGameFinish} />}
          {activeGame === 'CROWD_BREAKER' && <CrowdBreakerGame fee={selectedFee} walletBalance={user.balance} userLuck={user.luck || 1} userPhone={user.phone} onFinish={handleGameFinish} />}
          {activeGame === 'DALGONA' && <DalgonaGame fee={selectedFee} userPhone={user.phone} walletBalance={user.balance} userLuck={user.luck || 1} onFinish={handleGameFinish} />}
          {activeGame === 'RED_LIGHT' && <RedLightGame userPhone={user.phone} walletBalance={user.balance} onFinish={handleGameFinish} />}
          
          {(activeGame === 'WORM' || activeGame === 'SNAKE_RUSH') && (
            <div className="w-full h-full relative">
               <canvas ref={canvasRef} className="w-full h-full" />
               <UIOverlay walletBalance={user.balance} wormBalance={wormsRef.current.find(w => w.isPlayer)?.balance || 0} killFeed={[]} leaderboard={wormsRef.current.sort((a,b) => b.balance - a.balance)} status="" />
               <Joystick onMove={(a, m) => { playerInputRef.current.angle = a; playerInputRef.current.magnitude = m; }} onEnd={() => playerInputRef.current.magnitude = 0} />
            </div>
          )}
          <button onClick={handleQuit} className="fixed top-6 right-6 z-[100] bg-white/10 backdrop-blur-md text-white/40 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Exit</button>
        </div>
      )}

      {showStakeModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="bg-[#161d2b] border border-white/10 p-8 rounded-[3rem] w-full max-w-sm space-y-8 animate-in zoom-in">
            <h3 className="text-2xl font-orbitron font-black text-white italic text-center uppercase">SET YOUR STAKE</h3>
            <p className="text-[10px] text-white/30 text-center font-black uppercase tracking-widest">Min Bet: ₹10</p>
            <div className="grid grid-cols-3 gap-3">
              {[10, 50, 100, 500, 1000].map(amt => (
                <button key={amt} onClick={() => setCustomStake(amt.toString())} className={`py-4 rounded-2xl border font-black ${customStake === amt.toString() ? 'bg-[#f39c12] text-black' : 'bg-white/5 text-white/40'}`}>₹{amt}</button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#f39c12] font-black">₹</span>
              <input type="number" value={customStake} onChange={(e) => setCustomStake(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 pl-10 rounded-2xl text-white font-orbitron font-black text-xl outline-none focus:border-[#f39c12]" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowStakeModal(false)} className="flex-1 bg-white/5 border border-white/10 text-white/40 font-black py-5 rounded-2xl">Cancel</button>
              <button 
                onClick={() => {
                  const val = parseFloat(customStake);
                  if (val < 10) { alert("Minimum bet is ₹10"); return; }
                  startActualGame(pendingGameId!, val);
                }} 
                className="flex-[2] bg-[#f39c12] text-black font-orbitron font-black py-5 rounded-2xl"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
