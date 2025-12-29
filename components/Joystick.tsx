
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface JoystickProps {
  onMove: (angle: number, magnitude: number) => void;
  onEnd: () => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, onEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const radius = 50;

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const angle = Math.atan2(dy, dx);
    const magnitude = Math.min(distance / radius, 1);

    if (distance > radius) {
      dx = Math.cos(angle) * radius;
      dy = Math.sin(angle) * radius;
    }

    setPos({ x: dx, y: dy });
    onMove(angle, magnitude);
  }, [isDragging, onMove]);

  const handleEnd = () => {
    setIsDragging(false);
    setPos({ x: 0, y: 0 });
    onEnd();
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      className="fixed bottom-12 left-12 w-32 h-32 select-none z-50 pointer-events-auto"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
    >
      <div 
        ref={containerRef}
        className="w-full h-full rounded-full bg-white/5 border border-white/20 backdrop-blur-md flex items-center justify-center relative"
      >
        <div 
          className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50 absolute transition-transform duration-75 ease-out"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        />
        <div className="w-1 h-1 rounded-full bg-white/20 absolute" />
      </div>
    </div>
  );
};

export default Joystick;
