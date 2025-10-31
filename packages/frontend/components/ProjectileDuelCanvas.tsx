'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameSocket } from '@/lib/hooks/useGameSocket';
import { GameType } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface ProjectileDuelCanvasProps {
  matchId: string;
  playerAddress: string;
}

// Game constants from backend
const ARENA_WIDTH = 1600;
const ARENA_HEIGHT = 1200;
const PLAYER_RADIUS = 20;

/**
 * Three.js canvas for Projectile Duel game
 * Top-down shooter with projectiles, obstacles, and power-ups
 */
export function ProjectileDuelCanvas({ matchId, playerAddress }: ProjectileDuelCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const projectileMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const obstacleMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const powerUpMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  const { sendInput, isConnected } = useGameSocket(matchId, GameType.PROJECTILE_DUEL);
  const gameState = useAppStore((state) => state.game.projectileDuelState);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera (orthographic for 2D top-down view)
    const aspect = ARENA_WIDTH / ARENA_HEIGHT;
    const frustumSize = ARENA_HEIGHT;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    camera.position.set(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 500);
    camera.lookAt(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add arena boundary
    const boundaryGeometry = new THREE.PlaneGeometry(ARENA_WIDTH, ARENA_HEIGHT);
    const boundaryMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x1a1a1a,
      side: THREE.DoubleSide 
    });
    const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
    boundary.position.set(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, -1);
    scene.add(boundary);

    // Add grid
    const gridHelper = new THREE.GridHelper(ARENA_WIDTH, 20, 0x333333, 0x222222);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, -0.5);
    scene.add(gridHelper);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Point light
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 300);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      if (canvasRef.current && renderer.domElement) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update game objects based on state
  useEffect(() => {
    if (!sceneRef.current || !gameState) return;
    const scene = sceneRef.current;

    // Update players
    gameState.players?.forEach((player) => {
      let mesh = playerMeshesRef.current.get(player.address);
      
      if (!mesh) {
        // Create player mesh
        const geometry = new THREE.CircleGeometry(PLAYER_RADIUS, 32);
        const material = new THREE.MeshBasicMaterial({ 
          color: player.address === playerAddress ? 0x00ff00 : 0xff0000 
        });
        mesh = new THREE.Mesh(geometry, material);
        
        // Add direction indicator
        const indicatorGeometry = new THREE.ConeGeometry(PLAYER_RADIUS / 2, PLAYER_RADIUS, 8);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(PLAYER_RADIUS, 0, 1);
        indicator.rotation.z = -Math.PI / 2;
        mesh.add(indicator);
        
        scene.add(mesh);
        playerMeshesRef.current.set(player.address, mesh);
      }

      // Update position
      mesh.position.set(player.position.x, player.position.y, 0);
      mesh.rotation.z = player.rotation;

      // Update visibility based on health
      mesh.visible = player.health > 0;
    });

    // Update projectiles
    const currentProjectileIds = new Set(gameState.projectiles?.map((p) => p.id) || []);
    
    gameState.projectiles?.forEach((projectile) => {
      let mesh = projectileMeshesRef.current.get(projectile.id);
      
      if (!mesh) {
        // Create projectile mesh
        const radius = projectile.type === 'heavy' ? 8 : 5;
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
          color: projectile.type === 'heavy' ? 0xff6600 : 0xffff00 
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        projectileMeshesRef.current.set(projectile.id, mesh);
      }

      // Update position
      mesh.position.set(projectile.position.x, projectile.position.y, 2);
    });

    // Remove old projectiles
    projectileMeshesRef.current.forEach((mesh, id) => {
      if (!currentProjectileIds.has(id)) {
        scene.remove(mesh);
        projectileMeshesRef.current.delete(id);
      }
    });

    // Update obstacles
    gameState.obstacles?.forEach((obstacle) => {
      let mesh = obstacleMeshesRef.current.get(obstacle.id);
      
      if (!mesh) {
        // Create obstacle mesh
        const geometry = new THREE.BoxGeometry(
          obstacle.width,
          obstacle.height,
          10
        );
        const material = new THREE.MeshStandardMaterial({ 
          color: obstacle.destructible ? 0x8B4513 : 0x4a4a4a 
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height / 2,
          0
        );
        scene.add(mesh);
        obstacleMeshesRef.current.set(obstacle.id, mesh);
      }

      // Update color based on health
      if (obstacle.destructible && obstacle.health !== undefined) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        const healthPercent = obstacle.health / 100; // Assume max 100
        material.color.setRGB(0.5 * healthPercent, 0.3 * healthPercent, 0.1 * healthPercent);
      }
    });

    // Update power-ups
    const currentPowerUpIds = new Set(gameState.powerUps?.map((p) => p.id) || []);
    
    gameState.powerUps?.forEach((powerUp) => {
      let mesh = powerUpMeshesRef.current.get(powerUp.id);
      
      if (!mesh) {
        // Create power-up mesh
        const geometry = new THREE.OctahedronGeometry(15, 0);
        let color = 0xffffff;
        if (powerUp.type === 'shield') color = 0x00ffff;
        if (powerUp.type === 'rapid-fire') color = 0xff00ff;
        if (powerUp.type === 'heavy-shot') color = 0xff9900;
        
        const material = new THREE.MeshStandardMaterial({ 
          color,
          emissive: color,
          emissiveIntensity: 0.5 
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        powerUpMeshesRef.current.set(powerUp.id, mesh);
      }

      // Update position and rotation (spinning effect)
      mesh.position.set(powerUp.position.x, powerUp.position.y, 5);
      mesh.rotation.x += 0.02;
      mesh.rotation.y += 0.02;
    });

    // Remove old power-ups
    powerUpMeshesRef.current.forEach((mesh, id) => {
      if (!currentPowerUpIds.has(id)) {
        scene.remove(mesh);
        powerUpMeshesRef.current.delete(id);
      }
    });
  }, [gameState, playerAddress]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * ARENA_WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * ARENA_HEIGHT;
      setMousePos({ x, y });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && isConnected) {
        // Left click - shoot
        const player = gameState?.players?.find((p) => p.address === playerAddress);
        if (player) {
          const dx = mousePos.x - player.position.x;
          const dy = mousePos.y - player.position.y;
          const angle = Math.atan2(dy, dx);
          
          sendInput({
            action: 'shoot',
            data: { 
              aimDirection: { 
                x: Math.cos(angle), 
                y: Math.sin(angle) 
              } 
            },
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvasRef.current?.addEventListener('mousemove', handleMouseMove);
    canvasRef.current?.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isConnected, sendInput, gameState, playerAddress, mousePos]);

  // Send movement input
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      let dx = 0;
      let dy = 0;

      if (keys.has('w') || keys.has('arrowup')) dy += 1;
      if (keys.has('s') || keys.has('arrowdown')) dy -= 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        sendInput({
          action: 'move',
          data: { direction: { x: dx, y: dy } },
        });
      }

      // Send rotation based on mouse position
      const player = gameState?.players?.find((p) => p.address === playerAddress);
      if (player) {
        const angle = Math.atan2(
          mousePos.y - player.position.y,
          mousePos.x - player.position.x
        );
        sendInput({
          action: 'rotate',
          data: { angle },
        });
      }
    }, 50); // 20 Hz input rate

    return () => clearInterval(interval);
  }, [keys, isConnected, sendInput, gameState, playerAddress, mousePos]);

  // Get local player for HUD
  const localPlayer = gameState?.players?.find((p) => p.address === playerAddress);

  return (
    <div className="relative w-full h-full">
      {/* Three.js Canvas */}
      <div ref={canvasRef} className="w-full h-full" />

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          {/* Health Bar */}
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">HP:</span>
            <div className="w-48 h-6 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600">
              <div
                className={`h-full bg-linear-to-r from-red-600 to-green-500 transition-all ${
                  (localPlayer?.health || 0) > 50 ? 'opacity-100' : 'opacity-75'
                }`}
                style={{ width: `${localPlayer?.health || 0}%` } as React.CSSProperties}
              />
            </div>
            <span className="text-white font-mono">{localPlayer?.health || 0}</span>
          </div>

          {/* Score */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">Score</p>
            <p className="text-white text-3xl font-bold">{localPlayer?.score || 0}</p>
          </div>

          {/* Timer */}
          <div className="text-right">
            <p className="text-gray-400 text-sm">Time</p>
            <p className="text-white text-2xl font-mono">
              {Math.floor((gameState?.timeRemaining || 0) / 60)}:
              {String(Math.floor((gameState?.timeRemaining || 0) % 60)).padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Active Power-ups */}
        {localPlayer?.powerUps && Object.keys(localPlayer.powerUps).length > 0 && (
          <div className="mt-3 flex gap-2">
            {Object.entries(localPlayer.powerUps).map(([type, duration]) => (
              <div
                key={type}
                className="px-3 py-1 bg-purple-600 rounded-full text-white text-sm font-semibold"
              >
                {type} ({duration.toFixed(0)}s)
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls Info */}
      <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg p-3 text-white text-sm">
        <p className="font-bold mb-1">Controls:</p>
        <p>WASD - Move</p>
        <p>Mouse - Aim</p>
        <p>Left Click - Shoot</p>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white text-xl">Connecting to server...</p>
          </div>
        </div>
      )}
    </div>
  );
}
