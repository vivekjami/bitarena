import { Vector2, AABB, Circle, PhysicsConstants, SeededRandom, clampVelocity, calculateBounce } from './physics';

/**
 * Power-up types
 */
export enum PowerUpType {
  SHIELD = 'shield',
  RAPID_FIRE = 'rapid_fire',
  HEAVY_SHOT = 'heavy_shot',
}

/**
 * Projectile type
 */
export enum ProjectileType {
  NORMAL = 'normal',
  HEAVY = 'heavy',
}

/**
 * Player state for Projectile Duel
 */
export interface PlayerState {
  id: string;
  address: string;
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  health: number;
  ammo: number;
  score: number;
  isAlive: boolean;
  respawnTimer: number;
  lastShotTime: number;
  activePowerUps: Map<PowerUpType, number>;
}

/**
 * Projectile state
 */
export interface Projectile {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
  type: ProjectileType;
  damage: number;
  lifetime: number;
  maxLifetime: number;
}

/**
 * Obstacle state
 */
export interface Obstacle {
  id: string;
  bounds: AABB;
  health: number;
  maxHealth: number;
  destructible: boolean;
}

/**
 * Power-up state
 */
export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector2;
  radius: number;
  spawnTime: number;
}

/**
 * Game constants
 */
export const ProjectileDuelConstants = {
  ARENA_WIDTH: 1600,
  ARENA_HEIGHT: 1200,
  PLAYER_SPEED: 200,
  PLAYER_RADIUS: 20,
  PLAYER_MAX_HEALTH: 100,
  SHOOT_COOLDOWN: 0.5,
  RAPID_FIRE_COOLDOWN: 0.2,
  PROJECTILE_SPEED: 600,
  PROJECTILE_DAMAGE: 20,
  HEAVY_PROJECTILE_DAMAGE: 40,
  HEAVY_PROJECTILE_SPEED: 400,
  PROJECTILE_LIFETIME: 5,
  RESPAWN_TIME: 3,
  WIN_SCORE: 5,
  MATCH_DURATION: 180, // 3 minutes
  POWERUP_SPAWN_INTERVAL: 30,
  SHIELD_HITS: 2,
  RAPID_FIRE_DURATION: 10,
  HEAVY_SHOT_COUNT: 5,
};

/**
 * Projectile Duel Game Engine
 */
export class ProjectileDuelEngine {
  private players: Map<string, PlayerState>;
  private projectiles: Map<string, Projectile>;
  private obstacles: Obstacle[];
  private powerUps: Map<string, PowerUp>;
  private matchStartTime: number;
  private matchDuration: number;
  private random: SeededRandom;
  private nextProjectileId: number;
  private nextPowerUpId: number;
  private lastPowerUpSpawn: number;

  constructor(seed: number, playerAddresses: string[]) {
    this.players = new Map();
    this.projectiles = new Map();
    this.obstacles = [];
    this.powerUps = new Map();
    this.matchStartTime = Date.now();
    this.matchDuration = ProjectileDuelConstants.MATCH_DURATION;
    this.random = new SeededRandom(seed);
    this.nextProjectileId = 0;
    this.nextPowerUpId = 0;
    this.lastPowerUpSpawn = 0;

    // Initialize players
    this.initializePlayers(playerAddresses);
    
    // Initialize obstacles
    this.initializeObstacles();
  }

  private initializePlayers(addresses: string[]): void {
    const spawnPositions = [
      new Vector2(200, 200),
      new Vector2(ProjectileDuelConstants.ARENA_WIDTH - 200, ProjectileDuelConstants.ARENA_HEIGHT - 200),
    ];

    addresses.forEach((address, index) => {
      this.players.set(address, {
        id: address,
        address,
        position: spawnPositions[index % spawnPositions.length],
        velocity: Vector2.zero,
        rotation: 0,
        health: ProjectileDuelConstants.PLAYER_MAX_HEALTH,
        ammo: Infinity,
        score: 0,
        isAlive: true,
        respawnTimer: 0,
        lastShotTime: 0,
        activePowerUps: new Map(),
      });
    });
  }

  private initializeObstacles(): void {
    // Center obstacle
    this.obstacles.push({
      id: 'obstacle_center',
      bounds: new AABB(700, 500, 200, 200),
      health: 100,
      maxHealth: 100,
      destructible: false,
    });

    // Side obstacles
    this.obstacles.push({
      id: 'obstacle_left',
      bounds: new AABB(300, 400, 100, 400),
      health: 50,
      maxHealth: 50,
      destructible: true,
    });

    this.obstacles.push({
      id: 'obstacle_right',
      bounds: new AABB(1200, 400, 100, 400),
      health: 50,
      maxHealth: 50,
      destructible: true,
    });
  }

  /**
   * Update game state (60 Hz tick)
   */
  public update(deltaTime: number): void {
    // Update players
    this.updatePlayers(deltaTime);

    // Update projectiles
    this.updateProjectiles(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Spawn power-ups
    this.spawnPowerUps(deltaTime);

    // Clean up expired entities
    this.cleanupExpired();
  }

  private updatePlayers(deltaTime: number): void {
    this.players.forEach((player) => {
      if (!player.isAlive) {
        player.respawnTimer -= deltaTime;
        if (player.respawnTimer <= 0) {
          this.respawnPlayer(player);
        }
        return;
      }

      // Update position
      player.position = player.position.add(player.velocity.multiply(deltaTime));

      // Clamp to arena bounds
      player.position.x = Math.max(
        ProjectileDuelConstants.PLAYER_RADIUS,
        Math.min(
          ProjectileDuelConstants.ARENA_WIDTH - ProjectileDuelConstants.PLAYER_RADIUS,
          player.position.x
        )
      );
      player.position.y = Math.max(
        ProjectileDuelConstants.PLAYER_RADIUS,
        Math.min(
          ProjectileDuelConstants.ARENA_HEIGHT - ProjectileDuelConstants.PLAYER_RADIUS,
          player.position.y
        )
      );

      // Update power-up timers
      player.activePowerUps.forEach((duration, type) => {
        const remaining = duration - deltaTime;
        if (remaining <= 0) {
          player.activePowerUps.delete(type);
        } else {
          player.activePowerUps.set(type, remaining);
        }
      });

      // Decrease shoot cooldown
      player.lastShotTime = Math.max(0, player.lastShotTime - deltaTime);
    });
  }

  private updateProjectiles(deltaTime: number): void {
    this.projectiles.forEach((projectile) => {
      // Apply gravity
      projectile.velocity.y += PhysicsConstants.GRAVITY * deltaTime;

      // Clamp velocity
      projectile.velocity = clampVelocity(projectile.velocity);

      // Update position
      projectile.position = projectile.position.add(projectile.velocity.multiply(deltaTime));

      // Update lifetime
      projectile.lifetime += deltaTime;
    });
  }

  private checkCollisions(): void {
    // Projectile-player collisions
    this.projectiles.forEach((projectile, projectileId) => {
      this.players.forEach((player) => {
        if (!player.isAlive || player.address === projectile.ownerId) return;

        const playerCircle = new Circle(player.position, ProjectileDuelConstants.PLAYER_RADIUS);
        const projectileCircle = new Circle(projectile.position, 5);

        if (playerCircle.intersects(projectileCircle)) {
          this.handlePlayerHit(player, projectile);
          this.projectiles.delete(projectileId);
        }
      });

      // Projectile-obstacle collisions
      this.obstacles.forEach((obstacle) => {
        const projectileCircle = new Circle(projectile.position, 5);
        if (projectileCircle.intersectsAABB(obstacle.bounds)) {
          this.handleObstacleHit(obstacle, projectile);
          this.projectiles.delete(projectileId);
        }
      });

      // Projectile-boundary collisions
      if (
        projectile.position.x < 0 ||
        projectile.position.x > ProjectileDuelConstants.ARENA_WIDTH ||
        projectile.position.y < 0 ||
        projectile.position.y > ProjectileDuelConstants.ARENA_HEIGHT
      ) {
        this.projectiles.delete(projectileId);
      }
    });

    // Player-powerup collisions
    this.powerUps.forEach((powerUp, powerUpId) => {
      this.players.forEach((player) => {
        if (!player.isAlive) return;

        const playerCircle = new Circle(player.position, ProjectileDuelConstants.PLAYER_RADIUS);
        const powerUpCircle = new Circle(powerUp.position, powerUp.radius);

        if (playerCircle.intersects(powerUpCircle)) {
          this.applyPowerUp(player, powerUp.type);
          this.powerUps.delete(powerUpId);
        }
      });
    });
  }

  private handlePlayerHit(player: PlayerState, projectile: Projectile): void {
    // Check for shield
    if (player.activePowerUps.has(PowerUpType.SHIELD)) {
      const hits = player.activePowerUps.get(PowerUpType.SHIELD)!;
      if (hits > 1) {
        player.activePowerUps.set(PowerUpType.SHIELD, hits - 1);
      } else {
        player.activePowerUps.delete(PowerUpType.SHIELD);
      }
      return;
    }

    // Apply damage
    player.health -= projectile.damage;

    // Check death
    if (player.health <= 0) {
      player.isAlive = false;
      player.health = 0;
      player.respawnTimer = ProjectileDuelConstants.RESPAWN_TIME;

      // Award kill to shooter
      const shooter = this.players.get(projectile.ownerId);
      if (shooter) {
        shooter.score += 1;
      }
    }
  }

  private handleObstacleHit(obstacle: Obstacle, projectile: Projectile): void {
    if (obstacle.destructible) {
      obstacle.health -= projectile.damage;
      if (obstacle.health <= 0) {
        // Remove obstacle
        this.obstacles = this.obstacles.filter((o) => o.id !== obstacle.id);
      }
    }

    // Bounce projectile
    const center = obstacle.bounds.center;
    const normal = projectile.position.subtract(center).normalize();
    projectile.velocity = calculateBounce(projectile.velocity, normal);
  }

  private respawnPlayer(player: PlayerState): void {
    player.isAlive = true;
    player.health = ProjectileDuelConstants.PLAYER_MAX_HEALTH;
    player.position = new Vector2(
      this.random.range(100, ProjectileDuelConstants.ARENA_WIDTH - 100),
      this.random.range(100, ProjectileDuelConstants.ARENA_HEIGHT - 100)
    );
    player.velocity = Vector2.zero;
    player.activePowerUps.clear();
  }

  private spawnPowerUps(deltaTime: number): void {
    this.lastPowerUpSpawn += deltaTime;

    if (this.lastPowerUpSpawn >= ProjectileDuelConstants.POWERUP_SPAWN_INTERVAL) {
      this.lastPowerUpSpawn = 0;

      const types = [PowerUpType.SHIELD, PowerUpType.RAPID_FIRE, PowerUpType.HEAVY_SHOT];
      const type = types[this.random.int(0, types.length - 1)];

      const position = new Vector2(
        this.random.range(100, ProjectileDuelConstants.ARENA_WIDTH - 100),
        this.random.range(100, ProjectileDuelConstants.ARENA_HEIGHT - 100)
      );

      this.powerUps.set(`powerup_${this.nextPowerUpId++}`, {
        id: `powerup_${this.nextPowerUpId}`,
        type,
        position,
        radius: 20,
        spawnTime: Date.now(),
      });
    }
  }

  private applyPowerUp(player: PlayerState, type: PowerUpType): void {
    switch (type) {
      case PowerUpType.SHIELD:
        player.activePowerUps.set(PowerUpType.SHIELD, ProjectileDuelConstants.SHIELD_HITS);
        break;
      case PowerUpType.RAPID_FIRE:
        player.activePowerUps.set(PowerUpType.RAPID_FIRE, ProjectileDuelConstants.RAPID_FIRE_DURATION);
        break;
      case PowerUpType.HEAVY_SHOT:
        player.activePowerUps.set(PowerUpType.HEAVY_SHOT, ProjectileDuelConstants.HEAVY_SHOT_COUNT);
        break;
    }
  }

  private cleanupExpired(): void {
    // Remove expired projectiles
    this.projectiles.forEach((projectile, id) => {
      if (projectile.lifetime > projectile.maxLifetime) {
        this.projectiles.delete(id);
      }
    });

    // Remove old power-ups (30 seconds)
    const now = Date.now();
    this.powerUps.forEach((powerUp, id) => {
      if (now - powerUp.spawnTime > 30000) {
        this.powerUps.delete(id);
      }
    });
  }

  /**
   * Handle player input
   */
  public handleInput(playerId: string, input: {
    movement?: Vector2;
    rotation?: number;
    shoot?: boolean;
    aimDirection?: Vector2;
  }): void {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    // Update movement
    if (input.movement) {
      player.velocity = input.movement.normalize().multiply(ProjectileDuelConstants.PLAYER_SPEED);
    }

    // Update rotation
    if (input.rotation !== undefined) {
      player.rotation = input.rotation;
    }

    // Handle shooting
    if (input.shoot && input.aimDirection && player.lastShotTime === 0) {
      this.shoot(player, input.aimDirection);
    }
  }

  private shoot(player: PlayerState, direction: Vector2): void {
    // Determine cooldown
    const cooldown = player.activePowerUps.has(PowerUpType.RAPID_FIRE)
      ? ProjectileDuelConstants.RAPID_FIRE_COOLDOWN
      : ProjectileDuelConstants.SHOOT_COOLDOWN;

    player.lastShotTime = cooldown;

    // Determine projectile type
    const isHeavy = player.activePowerUps.has(PowerUpType.HEAVY_SHOT);
    let type = ProjectileType.NORMAL;
    let speed = ProjectileDuelConstants.PROJECTILE_SPEED;
    let damage = ProjectileDuelConstants.PROJECTILE_DAMAGE;

    if (isHeavy) {
      type = ProjectileType.HEAVY;
      speed = ProjectileDuelConstants.HEAVY_PROJECTILE_SPEED;
      damage = ProjectileDuelConstants.HEAVY_PROJECTILE_DAMAGE;

      // Decrease heavy shot count
      const count = player.activePowerUps.get(PowerUpType.HEAVY_SHOT)!;
      if (count > 1) {
        player.activePowerUps.set(PowerUpType.HEAVY_SHOT, count - 1);
      } else {
        player.activePowerUps.delete(PowerUpType.HEAVY_SHOT);
      }
    }

    // Create projectile
    const velocity = direction.normalize().multiply(speed);
    const projectile: Projectile = {
      id: `projectile_${this.nextProjectileId++}`,
      ownerId: player.address,
      position: player.position.clone(),
      velocity,
      type,
      damage,
      lifetime: 0,
      maxLifetime: ProjectileDuelConstants.PROJECTILE_LIFETIME,
    };

    this.projectiles.set(projectile.id, projectile);
  }

  /**
   * Check win conditions
   */
  public checkWinCondition(): { winner: string | null; reason: string } {
    // Check score win
    for (const [address, player] of this.players) {
      if (player.score >= ProjectileDuelConstants.WIN_SCORE) {
        return { winner: address, reason: 'score' };
      }
    }

    // Check time limit
    const elapsed = (Date.now() - this.matchStartTime) / 1000;
    if (elapsed >= this.matchDuration) {
      // Find player with highest score
      let highestScore = 0;
      let winner: string | null = null;

      this.players.forEach((player, address) => {
        if (player.score > highestScore) {
          highestScore = player.score;
          winner = address;
        }
      });

      return { winner, reason: 'time' };
    }

    return { winner: null, reason: '' };
  }

  /**
   * Get game state for serialization
   */
  public getState() {
    return {
      players: Array.from(this.players.values()),
      projectiles: Array.from(this.projectiles.values()),
      obstacles: this.obstacles,
      powerUps: Array.from(this.powerUps.values()),
      timeRemaining: this.matchDuration - (Date.now() - this.matchStartTime) / 1000,
    };
  }
}
