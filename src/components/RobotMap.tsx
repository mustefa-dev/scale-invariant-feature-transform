
import React, { useEffect, useRef } from 'react';
import { Point3D, TrajectoryPoint } from '@/types/robot';

interface RobotMapProps {
  keypoints: Point3D[];
  robotPosition: Point3D;
  trajectory: TrajectoryPoint[];
}

const RobotMap: React.FC<RobotMapProps> = ({ keypoints, robotPosition, trajectory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawMap();
      }
    };

    const drawMap = () => {
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Find map boundaries
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      // Include keypoints in boundaries
      keypoints.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });

      // Include trajectory points in boundaries
      trajectory.forEach(point => {
        minX = Math.min(minX, point.position.x);
        minY = Math.min(minY, point.position.y);
        maxX = Math.max(maxX, point.position.x);
        maxY = Math.max(maxY, point.position.y);
      });

      // Include current position in boundaries
      minX = Math.min(minX, robotPosition.x);
      minY = Math.min(minY, robotPosition.y);
      maxX = Math.max(maxX, robotPosition.x);
      maxY = Math.max(maxY, robotPosition.y);

      // Add margin
      const margin = Math.max((maxX - minX) * 0.1, (maxY - minY) * 0.1);
      minX -= margin;
      minY -= margin;
      maxX += margin;
      maxY += margin;

      // Calculate scale to fit map in canvas
      const rangeX = maxX - minX;
      const rangeY = maxY - minY;
      const scaleX = canvas.width / rangeX;
      const scaleY = canvas.height / rangeY;
      const scale = Math.min(scaleX, scaleY);

      // Function to convert world coordinates to canvas coordinates
      const worldToCanvas = (x: number, y: number) => {
        return {
          x: (x - minX) * scale,
          y: canvas.height - (y - minY) * scale, // Invert Y for canvas coordinates
        };
      };

      // Draw grid
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 0.5;
      
      const gridSize = Math.max(rangeX, rangeY) / 10;
      for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX; x += gridSize) {
        const start = worldToCanvas(x, minY);
        const end = worldToCanvas(x, maxY);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      
      for (let y = Math.floor(minY / gridSize) * gridSize; y <= maxY; y += gridSize) {
        const start = worldToCanvas(minX, y);
        const end = worldToCanvas(maxX, y);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }

      // Draw trajectory
      if (trajectory.length > 1) {
        ctx.strokeStyle = 'rgba(75, 192, 192, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const first = worldToCanvas(trajectory[0].position.x, trajectory[0].position.y);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < trajectory.length; i++) {
          const point = worldToCanvas(trajectory[i].position.x, trajectory[i].position.y);
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }

      // Draw keypoints as small dots
      ctx.fillStyle = 'rgba(120, 120, 240, 0.5)';
      keypoints.forEach(point => {
        const { x, y } = worldToCanvas(point.x, point.y);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw robot position with direction indicator
      const robotPos = worldToCanvas(robotPosition.x, robotPosition.y);
      
      // Robot position circle
      ctx.fillStyle = 'rgba(255, 60, 60, 0.9)';
      ctx.beginPath();
      ctx.arc(robotPos.x, robotPos.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Direction indicator (assuming the latest trajectory point gives direction)
      if (trajectory.length > 1) {
        const lastPoint = trajectory[trajectory.length - 1];
        const prevPoint = trajectory[trajectory.length - 2];
        
        // Calculate direction vector
        const dx = lastPoint.position.x - prevPoint.position.x;
        const dy = lastPoint.position.y - prevPoint.position.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          const dirX = dx / length;
          const dirY = dy / length;
          
          // Draw direction line
          ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(robotPos.x, robotPos.y);
          ctx.lineTo(robotPos.x + dirX * 20, robotPos.y - dirY * 20);
          ctx.stroke();
        }
      }

      // Draw axes labels
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('X', canvas.width - 15, canvas.height - 5);
      ctx.fillText('Y', 5, 15);
    };

    // Initial draw and setup resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [keypoints, robotPosition, trajectory]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};

export default RobotMap;
