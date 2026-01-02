
import React, { useState, useEffect, useRef } from 'react';

interface PlinkoGameProps {
  fee: number;
  walletBalance: number;
  userLuck: number;
  onFinish: (earnings: number, shouldExit?: boolean) => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  row: number;
  finished: boolean;
}

const PIN_GAP = 30;
const ROWS = 12;
const RADIUS = 4;
const GRAVITY = 0.2;

const MULTIPLIERS = {
  LOW: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
  MEDIUM: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
  HIGH: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
};

const PlinkoGame: React.FC<PlinkoGameProps> = ({ fee, walletBalance, userLuck, onFinish }) => {
  const [risk, setRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [balls, setBalls] = useState<Ball[]>([]);
  const [isDropping, setIsDropping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const dropBall = () => {
    if (isDropping) return;
    setIsDropping(true);
    const newBall: Ball = {
      id: Date.now(),
      x: 200,
      y: 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0,
      row: 0,
      finished: false
    };
    setBalls([newBall]);
  };

  const update = () => {
    setBalls(prevBalls => {
      const updated = prevBalls.map(ball => {
        if (ball.finished) return ball;

        let nextX = ball.x + ball.vx;
        let nextY = ball.y + ball.vy;
        let nextVy = ball.vy + GRAVITY;

        // Collision detection with pins
        for (let r = 1; r <= ROWS; r++) {
          const rowY = r * PIN_GAP + 50;
          if (Math.abs(nextY - rowY) < 5) {
            const rowWidth = r * PIN_GAP;
            const startX = 200 - rowWidth / 2;
            for (let i = 0; i <= r; i++) {
              const pinX = startX + i * PIN_GAP;
              const dx = nextX - pinX;
              const dy = nextY - rowY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 10) {
                // Bounce
                const angle = Math.atan2(dy, dx);
                ball.vx = Math.cos(angle) * 2 + (Math.random() - 0.5);
                ball.vy = Math.abs(Math.sin(angle) * 2) + 1;
                nextX = pinX + Math.cos(angle) * 11;
                nextY = rowY + Math.sin(angle) * 11;
              }
            }
          }
        }

        // Finish line
        if (nextY > ROWS * PIN_GAP + 80) {
          const mArr = MULTIPLIERS[risk];
          const bucketWidth = 400 / mArr.length;
          const bucketIndex = Math.floor(nextX / bucketWidth);
          const safeIndex = Math.max(0, Math.min(mArr.length - 1, bucketIndex));
          const mult = mArr[safeIndex];
          
          setTimeout(() => {
            onFinish(fee * mult, false);
            setIsDropping(false);
            setBalls([]);
          }, 100);

          return { ...ball, finished: true };
        }

        return { ...ball, x: nextX, y: nextY, vy: nextVy };
      });
      return updated;
    });
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [risk]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 400, 500);

    // Draw Pins
    ctx.fillStyle = '#ffffff44';
    for (let r = 1; r <= ROWS; r++) {
      const rowY = r * PIN_GAP + 50;
      const rowWidth = r * PIN_GAP;
      const startX = 200 - rowWidth / 2;
      for (let i = 0; i <= r; i++) {
        const pinX = startX + i * PIN_GAP;
        ctx.beginPath();
        ctx.arc(pinX, rowY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Buckets
    const mArr = MULTIPLIERS[risk];
    const bucketWidth = 400 / mArr.length;
    mArr.forEach((m, i) => {
      ctx.fillStyle = m >= 1 ? '#d4af3733' : '#ff444433';
      ctx.fillRect(i * bucketWidth + 2, 450, bucketWidth - 4, 30);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(m + 'x', i * bucketWidth + bucketWidth / 2, 470);
    });

    // Draw Balls
    balls.forEach(ball => {
      if (ball.finished) return;
      ctx.fillStyle = '#d4af37';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#d4af37';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

  }, [balls, risk]);

  return (
    <div className="fixed inset-0 bg-[#0a0e17] flex flex-col items-center justify-center p-6 z-40">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-orbitron font-black text-white italic">PLINKO<span className="text-[#d4af37]"> AI</span></h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Gravity & Gold</p>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="text-[#d4af37] font-black text-[10px]">₹</span>
                <span className="text-white font-black text-xs font-orbitron">{(walletBalance || 0).toLocaleString()}</span>
             </div>
             <div className="flex gap-2">
               {(['LOW', 'MEDIUM', 'HIGH'] as const).map(r => (
                 <button
                   key={r}
                   onClick={() => !isDropping && setRisk(r)}
                   className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border transition-all ${
                     risk === r ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 text-white/40 border-white/10'
                   }`}
                 >
                   {r}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="relative bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <canvas ref={canvasRef} width={400} height={500} className="w-full aspect-[4/5]" />
        </div>

        <div className="space-y-4 pt-2">
          <button
            onClick={dropBall}
            disabled={isDropping}
            className="w-full bg-[#d4af37] text-black font-orbitron font-black py-5 rounded-[2rem] shadow-[0_15px_40px_rgba(212,175,55,0.2)] active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-30"
          >
            {isDropping ? 'BALL DROPPING...' : `DROP BALL • ₹${fee}`}
          </button>
          <button
            onClick={() => onFinish(0, true)}
            className="w-full bg-white/5 border border-white/10 text-white font-orbitron font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all"
          >
            Exit Arena
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlinkoGame;
