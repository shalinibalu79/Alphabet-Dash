
import React, { useRef, useEffect } from 'react';
import { GameState, Entity, Lane } from '../types';
import { LANE_WIDTH, HORIZON_Z, COLORS } from '../constants';

interface Props {
  gameState: GameState;
  entities: Entity[];
}

const GameCanvas: React.FC<Props> = ({ gameState, entities }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const project = (x: number, y: number, z: number, width: number, height: number) => {
    const scale = 300 / (z || 1);
    const px = width / 2 + x * scale;
    const py = height / 2 + (y + 150) * scale;
    const size = 100 * scale;
    return { px, py, size };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#E0F2FE');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw Path (Ground)
    ctx.fillStyle = COLORS.PATH;
    ctx.beginPath();
    const p1 = project(-LANE_WIDTH * 1.5, 0, 10, width, height);
    const p2 = project(LANE_WIDTH * 1.5, 0, 10, width, height);
    const p3 = project(LANE_WIDTH * 0.5, 0, HORIZON_Z, width, height);
    const p4 = project(-LANE_WIDTH * 0.5, 0, HORIZON_Z, width, height);
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.lineTo(p3.px, p3.py);
    ctx.lineTo(p4.px, p4.py);
    ctx.closePath();
    ctx.fill();

    // Lane Lines
    ctx.strokeStyle = COLORS.LANE_LINES;
    ctx.lineWidth = 2;
    [-0.5, 0.5].forEach(lx => {
      ctx.beginPath();
      const s = project(lx * LANE_WIDTH, 0, 10, width, height);
      const e = project(lx * LANE_WIDTH, 0, HORIZON_Z, width, height);
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(e.px, e.py);
      ctx.stroke();
    });

    // Draw Entities
    [...entities].sort((a, b) => b.z - a.z).forEach(entity => {
      const ex = (entity.lane - 1) * LANE_WIDTH;
      const { px, py, size } = project(ex, 0, entity.z, width, height);

      if (entity.type === 'LETTER') {
        ctx.fillStyle = COLORS.LETTER;
        ctx.fillRect(px - size/2, py - size/2 - 20, size, size);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size * 0.8}px Quicksand`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entity.value || '?', px, py - 20);
      } else if (entity.type === 'OBSTACLE') {
        ctx.fillStyle = COLORS.OBSTACLE;
        ctx.fillRect(px - size/2, py - size/2, size, size);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(px - size/2, py - size/2, size, size);
      } else if (entity.type === 'POWERUP') {
        ctx.fillStyle = COLORS.POWERUP;
        ctx.beginPath();
        ctx.arc(px, py - size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size * 0.4}px Quicksand`;
        ctx.textAlign = 'center';
        ctx.fillText(entity.powerType?.charAt(0) || 'P', px, py - size/2);
      }
    });

    // Draw Player
    const pxPos = (gameState.lane - 1) * LANE_WIDTH;
    const pyPos = -gameState.jumpY;
    const playerProj = project(pxPos, pyPos, 80, width, height);
    
    ctx.fillStyle = COLORS.PLAYER;
    const pSize = playerProj.size;
    const pX = playerProj.px;
    const pY = playerProj.py;

    // Body
    if (gameState.isSliding) {
        ctx.beginPath();
        ctx.ellipse(pX, pY + pSize/4, pSize/2, pSize/4, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillRect(pX - pSize/4, pY - pSize, pSize/2, pSize);
    }

    // Head
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(pX, pY - (gameState.isSliding ? pSize/4 : pSize + pSize/8), pSize/4, 0, Math.PI * 2);
    ctx.fill();

    // Shield Aura
    if (gameState.powerups.shield > 0) {
      ctx.strokeStyle = '#4FD1C5';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pX, pY - pSize/2, pSize * 1.1, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    draw();
  }, [gameState, entities]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;
