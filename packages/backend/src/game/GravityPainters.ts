import { Vector2, PhysicsConstants, SeededRandom } from './physics';

/**
 * RGB Color
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Player state for Gravity Painters
 */
export interface GravityPlayerState {
  id: string;
  address: string;
  wellPosition: Vector2;
  velocity: Vector2;
  color: RGB;
  gravityStrength: number;
  movementSpeed: number;
  emissionRate: number;
  isEmitting: boolean;
  territoryCoverage: number;
}

/**
 * Particle state
 */
export interface Particle {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
  color: RGB;
  lifetime: number;
  maxLifetime: number;
  stuck: boolean;
}

/**
 * Canvas pixel
 */
export interface CanvasPixel {
  r: number;
  g: number;
  b: number;
}

/**
 * Game constants
 */
export const GravityPaintersConstants = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  DOWNSAMPLED_WIDTH: 960,
  DOWNSAMPLED_HEIGHT: 540,
  BASE_MOVEMENT_SPEED: 150,
  MIN_GRAVITY_STRENGTH: 0.5,
  MAX_GRAVITY_STRENGTH: 2.0,
  GRAVITY_CONSTANT: 5000,
  EMISSION_RATE: 5, // particles per frame at 60 Hz = 300/sec
  PARTICLE_LIFETIME: 10,
  PARTICLE_STICK_THRESHOLD: 50, // velocity threshold to stick
  MATCH_DURATION: 180, // 3 minutes
  PULSE_INTERVAL: 30, // seconds
  PULSE_PARTICLE_COUNT: 100,
  QUADTREE_THRESHOLD: 10,
  TERRITORY_UPDATE_INTERVAL: 1, // second
};

/**
 * Quadtree node for spatial partitioning
 */
class QuadTreeNode {
  bounds: { x: number; y: number; width: number; height: number };
  wells: GravityPlayerState[];
  children: QuadTreeNode[];
  maxObjects: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    maxObjects: number = GravityPaintersConstants.QUADTREE_THRESHOLD
  ) {
    this.bounds = { x, y, width, height };
    this.wells = [];
    this.children = [];
    this.maxObjects = maxObjects;
  }

  subdivide(): void {
    const hw = this.bounds.width / 2;
    const hh = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.children.push(
      new QuadTreeNode(x, y, hw, hh, this.maxObjects),
      new QuadTreeNode(x + hw, y, hw, hh, this.maxObjects),
      new QuadTreeNode(x, y + hh, hw, hh, this.maxObjects),
      new QuadTreeNode(x + hw, y + hh, hw, hh, this.maxObjects)
    );
  }

  insert(well: GravityPlayerState): void {
    if (this.children.length > 0) {
      const index = this.getIndex(well.wellPosition);
      if (index !== -1) {
        this.children[index].insert(well);
        return;
      }
    }

    this.wells.push(well);

    if (this.wells.length > this.maxObjects && this.children.length === 0) {
      this.subdivide();
      for (const w of this.wells) {
        const index = this.getIndex(w.wellPosition);
        if (index !== -1) {
          this.children[index].insert(w);
        }
      }
      this.wells = [];
    }
  }

  getIndex(position: Vector2): number {
    const midX = this.bounds.x + this.bounds.width / 2;
    const midY = this.bounds.y + this.bounds.height / 2;

    const top = position.y < midY;
    const left = position.x < midX;

    if (left && top) return 0;
    if (!left && top) return 1;
    if (left && !top) return 2;
    if (!left && !top) return 3;
    return -1;
  }

  getNearby(position: Vector2, radius: number): GravityPlayerState[] {
    const result: GravityPlayerState[] = [];

    if (!this.intersects(position, radius)) return result;

    result.push(...this.wells.filter((w) => w.wellPosition.distance(position) <= radius));

    for (const child of this.children) {
      result.push(...child.getNearby(position, radius));
    }

    return result;
  }

  intersects(position: Vector2, radius: number): boolean {
    const closestX = Math.max(this.bounds.x, Math.min(position.x, this.bounds.x + this.bounds.width));
    const closestY = Math.max(this.bounds.y, Math.min(position.y, this.bounds.y + this.bounds.height));

    const distX = position.x - closestX;
    const distY = position.y - closestY;

    return distX * distX + distY * distY <= radius * radius;
  }
}

/**
 * Gravity Painters Game Engine
 */
export class GravityPaintersEngine {
  private players: Map<string, GravityPlayerState>;
  private particles: Particle[];
  private canvas: CanvasPixel[][];
  private matchStartTime: number;
  private matchDuration: number;
  private random: SeededRandom;
  private nextParticleId: number;
  private lastPulseTime: number;
  private lastTerritoryUpdate: number;
  private particlePool: Particle[];

  constructor(seed: number, playerAddresses: string[]) {
    this.players = new Map();
    this.particles = [];
    this.particlePool = [];
    this.matchStartTime = Date.now();
    this.matchDuration = GravityPaintersConstants.MATCH_DURATION;
    this.random = new SeededRandom(seed);
    this.nextParticleId = 0;
    this.lastPulseTime = 0;
    this.lastTerritoryUpdate = 0;

    // Initialize canvas
    this.canvas = Array(GravityPaintersConstants.DOWNSAMPLED_HEIGHT)
      .fill(null)
      .map(() =>
        Array(GravityPaintersConstants.DOWNSAMPLED_WIDTH)
          .fill(null)
          .map(() => ({ r: 0, g: 0, b: 0 }))
      );

    // Initialize players
    this.initializePlayers(playerAddresses);

    // Pre-allocate particle pool
    for (let i = 0; i < 10000; i++) {
      this.particlePool.push(this.createParticleObject());
    }
  }

  private initializePlayers(addresses: string[]): void {
    const colors: RGB[] = [
      { r: 255, g: 0, b: 0 }, // Red
      { r: 0, g: 0, b: 255 }, // Blue
      { r: 0, g: 255, b: 0 }, // Green
      { r: 255, g: 255, b: 0 }, // Yellow
    ];

    const spawnPositions = [
      new Vector2(480, 270), // Top-left quadrant
      new Vector2(1440, 270), // Top-right quadrant
      new Vector2(480, 810), // Bottom-left quadrant
      new Vector2(1440, 810), // Bottom-right quadrant
    ];

    addresses.forEach((address, index) => {
      this.players.set(address, {
        id: address,
        address,
        wellPosition: spawnPositions[index % spawnPositions.length],
        velocity: Vector2.zero,
        color: colors[index % colors.length],
        gravityStrength: 1.0,
        movementSpeed: GravityPaintersConstants.BASE_MOVEMENT_SPEED,
        emissionRate: GravityPaintersConstants.EMISSION_RATE,
        isEmitting: false,
        territoryCoverage: 0,
      });
    });
  }

  /**
   * Update game state (60 Hz tick)
   */
  public update(deltaTime: number): void {
    // Update players
    this.updatePlayers(deltaTime);

    // Emit new particles
    this.emitParticles();

    // Update particles with gravity
    this.updateParticles(deltaTime);

    // Check synchronized pulse
    this.checkPulse(deltaTime);

    // Update territory calculations
    this.updateTerritory(deltaTime);

    // Clean up expired particles
    this.cleanupExpired();
  }

  private updatePlayers(deltaTime: number): void {
    this.players.forEach((player) => {
      // Update well position with smooth interpolation
      player.wellPosition = player.wellPosition.add(player.velocity.multiply(deltaTime));

      // Clamp to canvas bounds
      player.wellPosition.x = Math.max(
        50,
        Math.min(GravityPaintersConstants.CANVAS_WIDTH - 50, player.wellPosition.x)
      );
      player.wellPosition.y = Math.max(
        50,
        Math.min(GravityPaintersConstants.CANVAS_HEIGHT - 50, player.wellPosition.y)
      );

      // Update movement speed based on gravity (inverse relationship)
      player.movementSpeed =
        GravityPaintersConstants.BASE_MOVEMENT_SPEED / player.gravityStrength;
    });
  }

  private emitParticles(): void {
    this.players.forEach((player) => {
      if (!player.isEmitting) return;

      for (let i = 0; i < player.emissionRate; i++) {
        const particle = this.getParticleFromPool();
        if (!particle) break;

        particle.ownerId = player.address;
        particle.position = player.wellPosition.clone();
        // Small random velocity for natural emission
        particle.velocity = new Vector2(
          this.random.range(-10, 10),
          this.random.range(-10, 10)
        );
        particle.color = { ...player.color };
        particle.lifetime = 0;
        particle.maxLifetime = GravityPaintersConstants.PARTICLE_LIFETIME;
        particle.stuck = false;

        this.particles.push(particle);
      }
    });
  }

  private updateParticles(deltaTime: number): void {
    // Build quadtree for spatial partitioning
    const quadtree = new QuadTreeNode(
      0,
      0,
      GravityPaintersConstants.CANVAS_WIDTH,
      GravityPaintersConstants.CANVAS_HEIGHT
    );

    this.players.forEach((player) => {
      quadtree.insert(player);
    });

    // Update each particle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      if (particle.stuck) {
        // Write to canvas
        this.writeParticleToCanvas(particle);
        this.returnParticleToPool(particle);
        this.particles.splice(i, 1);
        continue;
      }

      // Calculate gravity forces from nearby wells
      const nearbyWells = quadtree.getNearby(particle.position, 500);
      const netForce = Vector2.zero;

      for (const well of nearbyWells) {
        const direction = well.wellPosition.subtract(particle.position);
        const distanceSquared = Math.max(direction.lengthSquared(), 100); // Avoid division by zero
        const forceMagnitude =
          (GravityPaintersConstants.GRAVITY_CONSTANT * well.gravityStrength) / distanceSquared;
        const force = direction.normalize().multiply(forceMagnitude);
        netForce.x += force.x;
        netForce.y += force.y;
      }

      // Apply force as acceleration
      particle.velocity = particle.velocity.add(netForce.multiply(deltaTime));

      // Apply air resistance
      particle.velocity = particle.velocity.multiply(PhysicsConstants.AIR_RESISTANCE);

      // Update position
      particle.position = particle.position.add(particle.velocity.multiply(deltaTime));

      // Check if particle should stick (velocity near zero)
      if (particle.velocity.length() < GravityPaintersConstants.PARTICLE_STICK_THRESHOLD) {
        particle.stuck = true;
      }

      // Update lifetime
      particle.lifetime += deltaTime;

      // Clamp to canvas bounds
      particle.position.x = Math.max(0, Math.min(GravityPaintersConstants.CANVAS_WIDTH - 1, particle.position.x));
      particle.position.y = Math.max(0, Math.min(GravityPaintersConstants.CANVAS_HEIGHT - 1, particle.position.y));
    }
  }

  private writeParticleToCanvas(particle: Particle): void {
    // Downsample coordinates
    const x = Math.floor(
      (particle.position.x / GravityPaintersConstants.CANVAS_WIDTH) *
        GravityPaintersConstants.DOWNSAMPLED_WIDTH
    );
    const y = Math.floor(
      (particle.position.y / GravityPaintersConstants.CANVAS_HEIGHT) *
        GravityPaintersConstants.DOWNSAMPLED_HEIGHT
    );

    if (
      x >= 0 &&
      x < GravityPaintersConstants.DOWNSAMPLED_WIDTH &&
      y >= 0 &&
      y < GravityPaintersConstants.DOWNSAMPLED_HEIGHT
    ) {
      // Additive RGB mixing
      const pixel = this.canvas[y][x];
      pixel.r = Math.min(255, pixel.r + particle.color.r);
      pixel.g = Math.min(255, pixel.g + particle.color.g);
      pixel.b = Math.min(255, pixel.b + particle.color.b);
    }
  }

  private checkPulse(deltaTime: number): void {
    this.lastPulseTime += deltaTime;

    if (this.lastPulseTime >= GravityPaintersConstants.PULSE_INTERVAL) {
      this.lastPulseTime = 0;
      this.emitPulse();
    }
  }

  private emitPulse(): void {
    this.players.forEach((player) => {
      const particlesPerWell = GravityPaintersConstants.PULSE_PARTICLE_COUNT;
      const angleStep = (Math.PI * 2) / particlesPerWell;

      for (let i = 0; i < particlesPerWell; i++) {
        const particle = this.getParticleFromPool();
        if (!particle) break;

        const angle = angleStep * i;
        const speed = 100 * player.gravityStrength; // Higher gravity = faster particles

        particle.ownerId = player.address;
        particle.position = player.wellPosition.clone();
        particle.velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        particle.color = { ...player.color };
        particle.lifetime = 0;
        particle.maxLifetime = GravityPaintersConstants.PARTICLE_LIFETIME;
        particle.stuck = false;

        this.particles.push(particle);
      }
    });
  }

  private updateTerritory(deltaTime: number): void {
    this.lastTerritoryUpdate += deltaTime;

    if (this.lastTerritoryUpdate >= GravityPaintersConstants.TERRITORY_UPDATE_INTERVAL) {
      this.lastTerritoryUpdate = 0;
      this.calculateTerritory();
    }
  }

  private calculateTerritory(): void {
    // Count pixels per player color
    const colorCounts = new Map<string, number>();
    let totalColoredPixels = 0;

    this.players.forEach((player) => {
      colorCounts.set(player.address, 0);
    });

    for (let y = 0; y < GravityPaintersConstants.DOWNSAMPLED_HEIGHT; y++) {
      for (let x = 0; x < GravityPaintersConstants.DOWNSAMPLED_WIDTH; x++) {
        const pixel = this.canvas[y][x];

        // Skip black pixels
        if (pixel.r === 0 && pixel.g === 0 && pixel.b === 0) continue;

        totalColoredPixels++;

        // Determine dominant color
        const max = Math.max(pixel.r, pixel.g, pixel.b);

        this.players.forEach((player) => {
          const color = player.color;
          if (
            (color.r === 255 && pixel.r === max && pixel.r > pixel.g && pixel.r > pixel.b) ||
            (color.g === 255 && pixel.g === max && pixel.g > pixel.r && pixel.g > pixel.b) ||
            (color.b === 255 && pixel.b === max && pixel.b > pixel.r && pixel.b > pixel.g)
          ) {
            colorCounts.set(player.address, (colorCounts.get(player.address) || 0) + 1);
          }
        });
      }
    }

    // Calculate percentages
    this.players.forEach((player) => {
      const count = colorCounts.get(player.address) || 0;
      player.territoryCoverage = totalColoredPixels > 0 ? (count / totalColoredPixels) * 100 : 0;
    });
  }

  private cleanupExpired(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (particle.lifetime > particle.maxLifetime) {
        this.returnParticleToPool(particle);
        this.particles.splice(i, 1);
      }
    }
  }

  private createParticleObject(): Particle {
    return {
      id: '',
      ownerId: '',
      position: Vector2.zero,
      velocity: Vector2.zero,
      color: { r: 0, g: 0, b: 0 },
      lifetime: 0,
      maxLifetime: 0,
      stuck: false,
    };
  }

  private getParticleFromPool(): Particle | null {
    if (this.particlePool.length === 0) return null;
    const particle = this.particlePool.pop()!;
    particle.id = `particle_${this.nextParticleId++}`;
    return particle;
  }

  private returnParticleToPool(particle: Particle): void {
    this.particlePool.push(particle);
  }

  /**
   * Handle player input
   */
  public handleInput(
    playerId: string,
    input: {
      movement?: Vector2;
      gravityStrength?: number;
      isEmitting?: boolean;
    }
  ): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Update movement
    if (input.movement) {
      player.velocity = input.movement.normalize().multiply(player.movementSpeed);
    }

    // Update gravity strength
    if (input.gravityStrength !== undefined) {
      player.gravityStrength = Math.max(
        GravityPaintersConstants.MIN_GRAVITY_STRENGTH,
        Math.min(GravityPaintersConstants.MAX_GRAVITY_STRENGTH, input.gravityStrength)
      );
    }

    // Update emission state
    if (input.isEmitting !== undefined) {
      player.isEmitting = input.isEmitting;
    }
  }

  /**
   * Check win conditions
   */
  public checkWinCondition(): { winner: string | null; reason: string } {
    // Check time limit
    const elapsed = (Date.now() - this.matchStartTime) / 1000;
    if (elapsed >= this.matchDuration) {
      // Find player with highest territory coverage
      let highestCoverage = 0;
      let winner: string | null = null;

      this.players.forEach((player, address) => {
        if (player.territoryCoverage > highestCoverage) {
          highestCoverage = player.territoryCoverage;
          winner = address;
        }
      });

      return { winner, reason: 'territory' };
    }

    return { winner: null, reason: '' };
  }

  /**
   * Get game state for serialization
   */
  public getState() {
    return {
      players: Array.from(this.players.values()),
      particleCount: this.particles.length,
      // Send downsampled canvas for network efficiency
      canvas: this.compressCanvas(),
      timeRemaining: this.matchDuration - (Date.now() - this.matchStartTime) / 1000,
    };
  }

  private compressCanvas(): string {
    // Simple run-length encoding for canvas
    let compressed = '';
    let lastPixel = { r: 0, g: 0, b: 0 };
    let count = 0;

    for (let y = 0; y < GravityPaintersConstants.DOWNSAMPLED_HEIGHT; y++) {
      for (let x = 0; x < GravityPaintersConstants.DOWNSAMPLED_WIDTH; x++) {
        const pixel = this.canvas[y][x];
        if (pixel.r === lastPixel.r && pixel.g === lastPixel.g && pixel.b === lastPixel.b) {
          count++;
        } else {
          if (count > 0) {
            compressed += `${count},${lastPixel.r},${lastPixel.g},${lastPixel.b};`;
          }
          lastPixel = { ...pixel };
          count = 1;
        }
      }
    }

    if (count > 0) {
      compressed += `${count},${lastPixel.r},${lastPixel.g},${lastPixel.b};`;
    }

    return compressed;
  }
}
