'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameSocket } from '@/lib/hooks/useGameSocket';
import { GameType } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface GravityPaintersCanvasProps {
  matchId: string;
  playerAddress: string;
}

// Game constants from backend
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

/**
 * Three.js canvas for Gravity Painters game
 * Particle physics with gravity wells and territory control
 */
export function GravityPaintersCanvas({ matchId, playerAddress }: GravityPaintersCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const wellMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const particleSystemRef = useRef<THREE.InstancedMesh | null>(null);
  const canvasTextureRef = useRef<THREE.Texture | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { sendInput, isConnected } = useGameSocket(matchId, GameType.GRAVITY_PAINTERS);
  const gameState = useAppStore((state) => state.game.gravityPaintersState);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [isEmitting, setIsEmitting] = useState(false);
  const [gravityStrength, setGravityStrength] = useState(1.0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera (orthographic for 2D view)
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const frustumSize = CANVAS_HEIGHT;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    camera.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 500);
    camera.lookAt(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Canvas background (for painted pixels)
    const canvasTexture = new THREE.DataTexture(
      new Uint8Array(960 * 540 * 4), // RGBA
      960,
      540,
      THREE.RGBAFormat
    );
    canvasTexture.needsUpdate = true;
    canvasTextureRef.current = canvasTexture;

    const canvasGeometry = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
    const canvasMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture });
    const canvasMesh = new THREE.Mesh(canvasGeometry, canvasMaterial);
    canvasMesh.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, -2);
    scene.add(canvasMesh);

    // Particle system (instanced rendering for performance)
    const particleGeometry = new THREE.CircleGeometry(2, 8);
    const particleMaterial = new THREE.MeshBasicMaterial();
    const particleSystem = new THREE.InstancedMesh(particleGeometry, particleMaterial, 10000);
    particleSystem.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

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

    const container = canvasRef.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update game objects based on state
  useEffect(() => {
    if (!sceneRef.current || !gameState) return;
    const scene = sceneRef.current;

    // Update gravity wells (players)
    gameState.players?.forEach((player) => {
      let mesh = wellMeshesRef.current.get(player.address);
      
      if (!mesh) {
        // Create gravity well mesh
        const geometry = new THREE.SphereGeometry(30, 32, 32);
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(player.color.r / 255, player.color.g / 255, player.color.b / 255),
          emissive: new THREE.Color(player.color.r / 255, player.color.g / 255, player.color.b / 255),
          emissiveIntensity: 0.8,
        });
        mesh = new THREE.Mesh(geometry, material);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(50 * player.gravityStrength, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(player.color.r / 255, player.color.g / 255, player.color.b / 255),
          transparent: true,
          opacity: 0.3,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
        
        scene.add(mesh);
        wellMeshesRef.current.set(player.address, mesh);
      }

      // Update position
      mesh.position.set(player.wellPosition.x, player.wellPosition.y, 10);

      // Update glow size based on gravity strength
      const glow = mesh.children[0] as THREE.Mesh;
      if (glow) {
        const scale = player.gravityStrength;
        glow.scale.set(scale, scale, scale);
      }

      // Pulsing effect if emitting
      if (player.isEmitting) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1.0;
        mesh.scale.set(pulse, pulse, pulse);
      } else {
        mesh.scale.set(1, 1, 1);
      }
    });

    // Update canvas texture from compressed data
    if (gameState.canvas && canvasTextureRef.current) {
      const texture = canvasTextureRef.current;
      const imageData = texture.image.data as Uint8Array;
      
      // Decompress canvas (run-length encoding)
      const parts = gameState.canvas.split(';').filter((p) => p.length > 0);
      let pixelIndex = 0;
      
      for (const part of parts) {
        const [countStr, rStr, gStr, bStr] = part.split(',');
        const count = parseInt(countStr);
        const r = parseInt(rStr);
        const g = parseInt(gStr);
        const b = parseInt(bStr);
        
        for (let i = 0; i < count && pixelIndex < imageData.length / 4; i++) {
          const offset = pixelIndex * 4;
          imageData[offset] = r;
          imageData[offset + 1] = g;
          imageData[offset + 2] = b;
          imageData[offset + 3] = 255; // Alpha
          pixelIndex++;
        }
      }
      
      texture.needsUpdate = true;
    }

    // Update particle system (visual representation)
    // Note: Backend handles actual particle simulation, we just render a subset
    if (particleSystemRef.current && gameState.particles) {
      const particleSystem = particleSystemRef.current;
      const matrix = new THREE.Matrix4();
      const color = new THREE.Color();
      
      // Render up to first 1000 particles for performance
      const renderCount = Math.min(gameState.particles.length, 1000);
      particleSystem.count = renderCount;
      
      gameState.particles.slice(0, renderCount).forEach((particle, index) => {
        matrix.setPosition(particle.position.x, particle.position.y, 5);
        particleSystem.setMatrixAt(index, matrix);
        
        color.setRGB(particle.color.r / 255, particle.color.g / 255, particle.color.b / 255);
        particleSystem.setColorAt(index, color);
      });
      
      particleSystem.instanceMatrix.needsUpdate = true;
      if (particleSystem.instanceColor) {
        particleSystem.instanceColor.needsUpdate = true;
      }
    }
  }, [gameState]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsEmitting(true);
        sendInput({
          action: 'emit',
          data: { emitting: true },
        });
      }
      setKeys((prev) => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsEmitting(false);
        sendInput({
          action: 'emit',
          data: { emitting: false },
        });
      }
      setKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newStrength = Math.max(0.5, Math.min(2.0, gravityStrength + delta));
      setGravityStrength(newStrength);
      
      if (isConnected) {
        sendInput({
          action: 'adjust-gravity',
          data: { strength: newStrength },
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvasRef.current?.addEventListener('wheel', handleWheel, { passive: false });

    const container = canvasRef.current;
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [isConnected, sendInput, gravityStrength]);

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
    }, 50); // 20 Hz input rate

    return () => clearInterval(interval);
  }, [keys, isConnected, sendInput]);

  // Get local player for HUD
  const localPlayer = gameState?.players?.find((p) => p.address === playerAddress);

  return (
    <div className="relative w-full h-full">
      {/* Three.js Canvas */}
      <div ref={canvasRef} className="w-full h-full bg-black" />

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/90 to-transparent">
        <div className="flex items-center justify-between">
          {/* Territory Coverage */}
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">Territory:</span>
            <div className="w-48 h-6 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600">
              <div
                className={`h-full transition-all ${
                  localPlayer ? 'opacity-100' : 'opacity-50'
                }`}
                style={{
                  width: `${localPlayer?.territoryPercentage || 0}%`,
                  backgroundColor: localPlayer
                    ? `rgb(${localPlayer.color.r}, ${localPlayer.color.g}, ${localPlayer.color.b})`
                    : '#666',
                } as React.CSSProperties}
              />
            </div>
            <span className="text-white font-mono">
              {(localPlayer?.territoryPercentage || 0).toFixed(1)}%
            </span>
          </div>

          {/* Gravity Strength */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">Gravity</p>
            <p className="text-white text-2xl font-bold">{gravityStrength.toFixed(1)}x</p>
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

        {/* Player Scores */}
        <div className="mt-4 flex gap-3">
          {gameState?.players?.map((player) => (
            <div
              key={player.address}
              className={`px-3 py-2 rounded-lg border-2 ${
                player.address === playerAddress ? 'border-white' : 'border-gray-700'
              }`}
              style={{
                backgroundColor: `rgba(${player.color.r}, ${player.color.g}, ${player.color.b}, 0.3)`,
              } as React.CSSProperties}
            >
              <p className="text-white text-xs font-mono">
                {player.address.slice(0, 6)}...{player.address.slice(-4)}
              </p>
              <p className="text-white text-lg font-bold">
                {player.territoryPercentage.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Emission Indicator */}
      {isEmitting && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="text-6xl opacity-50 animate-pulse">💫</div>
        </div>
      )}

      {/* Controls Info */}
      <div className="absolute bottom-4 left-4 bg-black/80 rounded-lg p-3 text-white text-sm">
        <p className="font-bold mb-1">Controls:</p>
        <p>WASD - Move Well</p>
        <p>SPACE - Emit Particles</p>
        <p>Mouse Wheel - Adjust Gravity</p>
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
