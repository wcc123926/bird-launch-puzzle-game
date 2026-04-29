import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Level } from '../game/levels'
import { GameState } from '../game/gameState'
import { Vector2, MAX_FORCE, FORCE_SCALE, GRAVITY } from '../game/physics'

interface GameCanvasProps {
  level: Level
  gameState: GameState
  dragging: boolean
  dragStart: Vector2 | null
  dragEnd: Vector2 | null
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: () => void
  onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void
  onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void
  onTouchEnd: () => void
}

const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(function GameCanvas(
  {
    level,
    gameState,
    dragging,
    dragStart,
    dragEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useImperativeHandle(ref, () => canvasRef.current!)

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#90EE90'
    ctx.fillRect(level.ground.x, level.ground.y, level.ground.width, level.ground.height)
    ctx.fillStyle = '#228B22'
    ctx.fillRect(level.ground.x, level.ground.y, level.ground.width, 5)

    const slingshot = level.slingshot
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(slingshot.x - 5, slingshot.y - 100, 10, 100)
    ctx.fillRect(slingshot.x - 20, slingshot.y - 20, 40, 20)
    ctx.fillStyle = '#D2691E'
    ctx.beginPath()
    ctx.arc(slingshot.x - 15, slingshot.y - 100, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(slingshot.x + 15, slingshot.y - 100, 8, 0, Math.PI * 2)
    ctx.fill()

    if (dragging && dragStart && dragEnd) {
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(slingshot.x - 15, slingshot.y - 100)
      ctx.lineTo(dragEnd.x, dragEnd.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(slingshot.x + 15, slingshot.y - 100)
      ctx.lineTo(dragEnd.x, dragEnd.y)
      ctx.stroke()

      ctx.fillStyle = '#FF6347'
      ctx.beginPath()
      ctx.arc(dragEnd.x, dragEnd.y, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(dragEnd.x - 7, dragEnd.y - 7, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(dragEnd.x - 7, dragEnd.y - 7, 3, 0, Math.PI * 2)
      ctx.fill()

      const dx = dragStart.x - dragEnd.x
      const dy = dragStart.y - dragEnd.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const force = Math.min(dist / FORCE_SCALE, MAX_FORCE)
      const angle = Math.atan2(dy, dx)

      ctx.setLineDash([5, 5])
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()

      let predictX = dragEnd.x
      let predictY = dragEnd.y
      let velX = Math.cos(angle) * force
      let velY = Math.sin(angle) * force

      ctx.moveTo(predictX, predictY)

      for (let i = 0; i < 80; i++) {
        velY += GRAVITY
        predictX += velX
        predictY += velY
        if (predictY > level.ground.y) break
        ctx.lineTo(predictX, predictY)
      }
      ctx.stroke()
      ctx.setLineDash([])

      const maxDist = MAX_FORCE * FORCE_SCALE
      const powerPercent = Math.min(dist / maxDist, 1)
      const powerColor = powerPercent < 0.33 ? '#4CAF50' : powerPercent < 0.66 ? '#FFC107' : '#F44336'
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(dragEnd.x - 25, dragEnd.y - 50, 50, 10)
      ctx.fillStyle = powerColor
      ctx.fillRect(dragEnd.x - 24, dragEnd.y - 49, 48 * powerPercent, 8)
      
      const arrowLength = Math.min(dist / 5, 30)
      if (arrowLength > 5) {
        ctx.strokeStyle = powerColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(dragEnd.x, dragEnd.y)
        ctx.lineTo(
          dragEnd.x + Math.cos(angle) * arrowLength,
          dragEnd.y + Math.sin(angle) * arrowLength
        )
        ctx.stroke()
        
        const arrowHeadAngle = 0.5
        ctx.beginPath()
        ctx.moveTo(
          dragEnd.x + Math.cos(angle) * arrowLength,
          dragEnd.y + Math.sin(angle) * arrowLength
        )
        ctx.lineTo(
          dragEnd.x + Math.cos(angle - arrowHeadAngle) * (arrowLength * 0.7),
          dragEnd.y + Math.sin(angle - arrowHeadAngle) * (arrowLength * 0.7)
        )
        ctx.moveTo(
          dragEnd.x + Math.cos(angle) * arrowLength,
          dragEnd.y + Math.sin(angle) * arrowLength
        )
        ctx.lineTo(
          dragEnd.x + Math.cos(angle + arrowHeadAngle) * (arrowLength * 0.7),
          dragEnd.y + Math.sin(angle + arrowHeadAngle) * (arrowLength * 0.7)
        )
        ctx.stroke()
      }
    } else if (!gameState.isBirdFlying && !gameState.gameOver && !gameState.levelComplete) {
      const birdX = slingshot.x
      const birdY = slingshot.y - 30

      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(slingshot.x - 15, slingshot.y - 100)
      ctx.lineTo(birdX, birdY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(slingshot.x + 15, slingshot.y - 100)
      ctx.lineTo(birdX, birdY)
      ctx.stroke()

      ctx.fillStyle = '#FF6347'
      ctx.beginPath()
      ctx.arc(birdX, birdY, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(birdX - 7, birdY - 7, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(birdX - 7, birdY - 7, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    gameState.boxes.forEach(box => {
      if (box.isDestroyed) return
      ctx.fillStyle = '#CD853F'
      ctx.fillRect(
        box.x - box.width / 2,
        box.y - box.height / 2,
        box.width,
        box.height
      )
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 2
      ctx.strokeRect(
        box.x - box.width / 2,
        box.y - box.height / 2,
        box.width,
        box.height
      )
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)'
      ctx.beginPath()
      ctx.moveTo(box.x - box.width / 2, box.y)
      ctx.lineTo(box.x + box.width / 2, box.y)
      ctx.stroke()
      if (box.health === 1) {
        ctx.strokeStyle = '#FF0000'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(box.x - box.width / 4, box.y - box.height / 4)
        ctx.lineTo(box.x + box.width / 4, box.y + box.height / 4)
        ctx.moveTo(box.x + box.width / 4, box.y - box.height / 4)
        ctx.lineTo(box.x - box.width / 4, box.y + box.height / 4)
        ctx.stroke()
      }
    })

    gameState.pigs.forEach(pig => {
      if (pig.isHit) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'
        ctx.beginPath()
        ctx.arc(pig.x, pig.y, pig.radius, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = '#FFC0CB'
        ctx.beginPath()
        ctx.arc(pig.x, pig.y, pig.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#FF69B4'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#FFF'
        ctx.beginPath()
        ctx.arc(pig.x - 8, pig.y - 5, 8, 0, Math.PI * 2)
        ctx.arc(pig.x + 8, pig.y - 5, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(pig.x - 8, pig.y - 5, 4, 0, Math.PI * 2)
        ctx.arc(pig.x + 8, pig.y - 5, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#FFB6C1'
        ctx.beginPath()
        ctx.ellipse(pig.x, pig.y + 8, 8, 5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#FF69B4'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(pig.x, pig.y + 10, 10, 0.1, Math.PI - 0.1)
        ctx.stroke()
      }
    })

    if (gameState.activeBird && gameState.isBirdFlying) {
      const bird = gameState.activeBird
      ctx.fillStyle = 'rgba(255, 99, 71, 0.3)'
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath()
        ctx.arc(
          bird.x - bird.velocity.x * i * 2,
          bird.y - bird.velocity.y * i * 2,
          bird.radius * (1 - i * 0.15),
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
      ctx.fillStyle = '#FF6347'
      ctx.beginPath()
      ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(bird.x - 7, bird.y - 7, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(bird.x - 7, bird.y - 7, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  useEffect(() => {
    const animate = () => {
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [level, gameState, dragging, dragStart, dragEnd])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="game-canvas"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    />
  )
})

export default GameCanvas
