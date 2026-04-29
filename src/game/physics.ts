export interface Vector2 {
  x: number
  y: number
}

export interface PhysicsObject {
  x: number
  y: number
  velocity: Vector2
  mass: number
}

export interface Bird extends PhysicsObject {
  radius: number
  isLaunched: boolean
  isActive: boolean
}

export interface Pig extends PhysicsObject {
  radius: number
  isHit: boolean
}

export interface Box extends PhysicsObject {
  width: number
  height: number
  isDestroyed: boolean
  health: number
}

export interface Ground {
  x: number
  y: number
  width: number
  height: number
}

export const GRAVITY = 0.35
export const FRICTION = 0.995
export const BOUNCE_FACTOR = 0.6
export const MAX_FORCE = 28
export const FORCE_SCALE = 12

export function createBird(x: number, y: number): Bird {
  return {
    x,
    y,
    velocity: { x: 0, y: 0 },
    mass: 1,
    radius: 20,
    isLaunched: false,
    isActive: false
  }
}

export function createPig(x: number, y: number): Pig {
  return {
    x,
    y,
    velocity: { x: 0, y: 0 },
    mass: 0.5,
    radius: 25,
    isHit: false
  }
}

export function createBox(x: number, y: number, width: number, height: number): Box {
  return {
    x,
    y,
    velocity: { x: 0, y: 0 },
    mass: 2,
    width,
    height,
    isDestroyed: false,
    health: 2
  }
}

export function createGround(x: number, y: number, width: number, height: number): Ground {
  return {
    x,
    y,
    width,
    height
  }
}

export function applyGravity(obj: PhysicsObject): void {
  obj.velocity.y += GRAVITY
}

export function updatePosition(obj: PhysicsObject): void {
  obj.x += obj.velocity.x
  obj.y += obj.velocity.y
  obj.velocity.x *= FRICTION
  obj.velocity.y *= FRICTION
}

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function checkCircleCollision(
  obj1: { x: number; y: number; radius: number },
  obj2: { x: number; y: number; radius: number }
): { collided: boolean; overlap: number; normal: Vector2 } {
  const dx = obj2.x - obj1.x
  const dy = obj2.y - obj1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const minDist = obj1.radius + obj2.radius
  
  if (dist < minDist) {
    const overlap = minDist - dist
    const normal = {
      x: dist > 0 ? dx / dist : 0,
      y: dist > 0 ? dy / dist : 1
    }
    return { collided: true, overlap, normal }
  }
  
  return { collided: false, overlap: 0, normal: { x: 0, y: 0 } }
}

export function isPointInRect(
  point: Vector2,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const halfWidth = rect.width / 2
  const halfHeight = rect.height / 2
  return (
    point.x >= rect.x - halfWidth &&
    point.x <= rect.x + halfWidth &&
    point.y >= rect.y - halfHeight &&
    point.y <= rect.y + halfHeight
  )
}

export function getClosestPointOnRect(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): Vector2 {
  const halfWidth = rect.width / 2
  const halfHeight = rect.height / 2
  
  const closestX = Math.max(rect.x - halfWidth, Math.min(circle.x, rect.x + halfWidth))
  const closestY = Math.max(rect.y - halfHeight, Math.min(circle.y, rect.y + halfHeight))
  
  return { x: closestX, y: closestY }
}

export function checkCollision(
  bird: Bird,
  obj: Pig | Box
): { collided: boolean; overlap: number; normal: Vector2 } {
  if ('width' in obj && 'height' in obj) {
    const closestPoint = getClosestPointOnRect(bird, obj)
    const dx = bird.x - closestPoint.x
    const dy = bird.y - closestPoint.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < bird.radius) {
      const overlap = bird.radius - dist
      const normal = {
        x: dist > 0 ? dx / dist : 0,
        y: dist > 0 ? dy / dist : 1
      }
      return { collided: true, overlap, normal }
    }
    
    return { collided: false, overlap: 0, normal: { x: 0, y: 0 } }
  } else {
    return checkCircleCollision(bird, obj as Pig)
  }
}

export function resolveCollision(
  bird: Bird,
  box: Box,
  collision: { collided: boolean; overlap: number; normal: Vector2 }
): void {
  if (!collision.collided) return
  
  const normal = collision.normal
  const relativeVelocity = {
    x: bird.velocity.x - box.velocity.x,
    y: bird.velocity.y - box.velocity.y
  }
  
  const velAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y
  
  if (velAlongNormal > 0) return
  
  const restitution = BOUNCE_FACTOR
  const impulse = -(1 + restitution) * velAlongNormal / (1 / bird.mass + 1 / box.mass)
  
  bird.velocity.x -= (impulse * normal.x) / bird.mass
  bird.velocity.y -= (impulse * normal.y) / bird.mass
  box.velocity.x += (impulse * normal.x) / box.mass
  box.velocity.y += (impulse * normal.y) / box.mass
  
  bird.x += normal.x * collision.overlap * 0.5
  bird.y += normal.y * collision.overlap * 0.5
}
