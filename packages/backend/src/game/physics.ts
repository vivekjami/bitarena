/**
 * Vector2 - 2D Vector math utility class
 */
export class Vector2 {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // Basic operations
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2 {
    if (scalar === 0) return new Vector2(0, 0);
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  // Vector operations
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return this.divide(len);
  }

  distance(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceSquared(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(v: Vector2): number {
    return Math.atan2(v.y - this.y, v.x - this.x);
  }

  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  // Static methods for common vectors
  static get zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static get one(): Vector2 {
    return new Vector2(1, 1);
  }

  static get up(): Vector2 {
    return new Vector2(0, -1);
  }

  static get down(): Vector2 {
    return new Vector2(0, 1);
  }

  static get left(): Vector2 {
    return new Vector2(-1, 0);
  }

  static get right(): Vector2 {
    return new Vector2(1, 0);
  }

  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }
}

/**
 * AABB - Axis-Aligned Bounding Box for rectangular collisions
 */
export class AABB {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get center(): Vector2 {
    return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
  }

  intersects(other: AABB): boolean {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  contains(point: Vector2): boolean {
    return (
      point.x >= this.left &&
      point.x <= this.right &&
      point.y >= this.top &&
      point.y <= this.bottom
    );
  }
}

/**
 * Circle collision detection
 */
export class Circle {
  position: Vector2;
  radius: number;

  constructor(position: Vector2, radius: number) {
    this.position = position;
    this.radius = radius;
  }

  intersects(other: Circle): boolean {
    const distance = this.position.distance(other.position);
    return distance < this.radius + other.radius;
  }

  contains(point: Vector2): boolean {
    return this.position.distance(point) <= this.radius;
  }

  intersectsAABB(aabb: AABB): boolean {
    // Find closest point on AABB to circle center
    const closestX = Math.max(aabb.left, Math.min(this.position.x, aabb.right));
    const closestY = Math.max(aabb.top, Math.min(this.position.y, aabb.bottom));
    
    const closest = new Vector2(closestX, closestY);
    return this.contains(closest);
  }
}

/**
 * Line-circle intersection for ray-casting projectiles
 */
export function lineCircleIntersection(
  lineStart: Vector2,
  lineEnd: Vector2,
  circle: Circle
): boolean {
  const d = lineEnd.subtract(lineStart);
  const f = lineStart.subtract(circle.position);
  
  const a = d.dot(d);
  const b = 2 * f.dot(d);
  const c = f.dot(f) - circle.radius * circle.radius;
  
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) return false;
  
  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
  
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

/**
 * Sweep test for fast-moving objects
 */
export function sweepAABB(
  moving: AABB,
  velocity: Vector2,
  stationary: AABB,
  delta: number
): { collision: boolean; time: number } {
  // Minkowski difference
  const minkowskiDiff = new AABB(
    stationary.x - moving.width,
    stationary.y - moving.height,
    stationary.width + moving.width,
    stationary.height + moving.height
  );
  
  // Ray-cast from moving center
  const start = new Vector2(moving.x, moving.y);
  
  // Simple AABB intersection check
  if (minkowskiDiff.contains(start)) {
    return { collision: true, time: 0 };
  }
  
  // Calculate intersection time
  let tMin = 0;
  let tMax = 1;
  
  for (const axis of ['x', 'y'] as const) {
    if (velocity[axis] === 0) continue;
    
    const min = axis === 'x' ? minkowskiDiff.left : minkowskiDiff.top;
    const max = axis === 'x' ? minkowskiDiff.right : minkowskiDiff.bottom;
    
    const t1 = (min - start[axis]) / (velocity[axis] * delta);
    const t2 = (max - start[axis]) / (velocity[axis] * delta);
    
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  }
  
  if (tMin > tMax || tMax < 0 || tMin > 1) {
    return { collision: false, time: 1 };
  }
  
  return { collision: true, time: tMin };
}

/**
 * Physics constants
 */
export const PhysicsConstants = {
  GRAVITY: 980, // pixels/s²
  AIR_RESISTANCE: 0.99,
  BOUNCE_DAMPING: 0.7,
  MAX_VELOCITY: 2000, // pixels/s
};

/**
 * Deterministic PRNG using Linear Congruential Generator
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    // LCG parameters (Numerical Recipes)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  
  reset(seed: number): void {
    this.seed = seed;
  }
}

/**
 * Clamp velocity to maximum
 */
export function clampVelocity(velocity: Vector2, max: number = PhysicsConstants.MAX_VELOCITY): Vector2 {
  const speed = velocity.length();
  if (speed > max) {
    return velocity.normalize().multiply(max);
  }
  return velocity;
}

/**
 * Apply air resistance
 */
export function applyAirResistance(velocity: Vector2): Vector2 {
  return velocity.multiply(PhysicsConstants.AIR_RESISTANCE);
}

/**
 * Calculate bounce vector
 */
export function calculateBounce(velocity: Vector2, normal: Vector2): Vector2 {
  const dot = velocity.dot(normal);
  const reflection = velocity.subtract(normal.multiply(2 * dot));
  return reflection.multiply(PhysicsConstants.BOUNCE_DAMPING);
}
