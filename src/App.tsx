import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { 
  Vector2, 
  Bird, 
  createBird,
  applyGravity,
  updatePosition,
  checkCollision,
  resolveCollision,
  MAX_FORCE,
  FORCE_SCALE,
  GRAVITY
} from './game/physics'
import { 
  levels
} from './game/levels'
import { 
  GameState,
  getInitialState
} from './game/gameState'
import GameCanvas from './components/GameCanvas'
import GameUI from './components/GameUI'
import GameModal from './components/GameModal'

function App() {
  const [gameState, setGameState] = useState<GameState>(getInitialState(levels[0], 0))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Vector2 | null>(null)
  const [dragEnd, setDragEnd] = useState<Vector2 | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  const level = levels[gameState.currentLevel]

  const resetLevel = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsPlaying(false)
    setGameState(getInitialState(levels[gameState.currentLevel], gameState.currentLevel))
  }, [gameState.currentLevel])

  const nextLevel = useCallback(() => {
    if (gameState.currentLevel < levels.length - 1) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setIsPlaying(false)
      const nextLevelIndex = gameState.currentLevel + 1
      setGameState(getInitialState(levels[nextLevelIndex], nextLevelIndex))
    }
  }, [gameState.currentLevel])

  const startGame = useCallback(() => {
    resetLevel()
    setIsPlaying(true)
  }, [resetLevel])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState.gameOver || gameState.levelComplete) return
    if (gameState.isBirdFlying) return
    if (gameState.birdsUsed >= level.birdsCount) return

    const canvas = canvasRef.current
    if (!canvas) return

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const slingshot = level.slingshot
    const birdX = slingshot.x
    const birdY = slingshot.y - 30

    const dx = x - birdX
    const dy = y - birdY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= 80) {
      setDragging(true)
      setDragStart({ x: birdX, y: birdY })
      setDragEnd({ x, y })
    }
  }, [gameState.gameOver, gameState.levelComplete, gameState.isBirdFlying, gameState.birdsUsed, level, isPlaying])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    setDragEnd({ x, y })
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    if (!dragging || !dragStart || !dragEnd) {
      setDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    const dx = dragStart.x - dragEnd.x
    const dy = dragStart.y - dragEnd.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 10) {
      const force = Math.min(dist / FORCE_SCALE, MAX_FORCE)
      const angle = Math.atan2(dy, dx)
      
      const bird: Bird = {
        ...createBird(dragEnd.x, dragEnd.y),
        velocity: {
          x: Math.cos(angle) * force,
          y: Math.sin(angle) * force
        },
        isLaunched: true,
        isActive: true
      }

      setGameState(prev => ({
        ...prev,
        activeBird: bird,
        birdsUsed: prev.birdsUsed + 1,
        isBirdFlying: true
      }))
    }

    setDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [dragging, dragStart, dragEnd])

  useEffect(() => {
    if (!isPlaying || !gameState.isBirdFlying || !gameState.activeBird) return

    const gameLoop = () => {
      setGameState(prev => {
        if (!prev.isBirdFlying || !prev.activeBird) return prev

        let bird = { ...prev.activeBird }
        let pigs = [...prev.pigs]
        let boxes = [...prev.boxes]
        let score = prev.score
        let levelComplete = prev.levelComplete
        let gameOver = prev.gameOver

        applyGravity(bird)
        updatePosition(bird)

        for (let i = 0; i < pigs.length; i++) {
          if (pigs[i].isHit) continue
          
          const collision = checkCollision(bird, pigs[i])
          if (collision.collided) {
            pigs[i] = { ...pigs[i], isHit: true }
            score += 500
            bird.velocity = { x: -bird.velocity.x * 0.3, y: -bird.velocity.y * 0.3 }
          }
        }

        for (let i = 0; i < boxes.length; i++) {
          if (boxes[i].isDestroyed) continue
          
          const collision = checkCollision(bird, boxes[i])
          if (collision.collided) {
            resolveCollision(bird, boxes[i], collision)
            boxes[i] = {
              ...boxes[i],
              velocity: {
                x: bird.velocity.x * 0.5,
                y: bird.velocity.y * 0.3
              },
              health: boxes[i].health - 1
            }
            
            if (boxes[i].health <= 0) {
              boxes[i] = { ...boxes[i], isDestroyed: true }
              score += 100
            }
          }
        }

        const ground = level.ground
        if (bird.y + bird.radius > ground.y) {
          bird.y = ground.y - bird.radius
          bird.velocity.y = -bird.velocity.y * 0.5
          bird.velocity.x *= 0.8
          
          if (Math.abs(bird.velocity.x) < 0.1 && Math.abs(bird.velocity.y) < 0.1) {
            bird.isActive = false
          }
        }

        if (bird.x < -100 || bird.x > 900 || bird.y > 700) {
          bird.isActive = false
        }

        for (let i = 0; i < boxes.length; i++) {
          if (boxes[i].isDestroyed) continue
          
          applyGravity(boxes[i])
          updatePosition(boxes[i])
          
          if (boxes[i].y + boxes[i].height / 2 > ground.y) {
            boxes[i].y = ground.y - boxes[i].height / 2
            boxes[i].velocity.y = 0
            boxes[i].velocity.x *= 0.8
          }
        }

        const allPigsHit = pigs.every(p => p.isHit)
        if (allPigsHit) {
          levelComplete = true
          gameOver = true
          bird.isActive = false
        }

        if (!bird.isActive && !levelComplete) {
          if (prev.birdsUsed >= level.birdsCount) {
            gameOver = true
          }
        }

        const updatedBird = !bird.isActive ? null : bird
        const updatedIsBirdFlying = bird.isActive

        return {
          ...prev,
          activeBird: updatedBird,
          pigs,
          boxes,
          score,
          levelComplete,
          gameOver,
          isBirdFlying: updatedIsBirdFlying
        }
      })

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, gameState.isBirdFlying, gameState.activeBird, level])

  const getPower = (): number => {
    if (!dragStart || !dragEnd) return 0
    const dx = dragStart.x - dragEnd.x
    const dy = dragStart.y - dragEnd.y
    const maxDist = MAX_FORCE * FORCE_SCALE
    return Math.min(Math.sqrt(dx * dx + dy * dy) / maxDist, 1)
  }

  const remainingBirds = level.birdsCount - gameState.birdsUsed

  return (
    <div className="app">
      <h1 className="title">愤怒小鸟小游戏</h1>
      
      <GameUI 
        levelName={level.name}
        remainingBirds={remainingBirds}
        score={gameState.score}
        power={getPower()}
        isDragging={dragging}
        onRestart={resetLevel}
        canRestart={isPlaying}
      />
      
      <div className="canvas-container">
        <GameCanvas 
          ref={canvasRef}
          level={level}
          gameState={gameState}
          dragging={dragging}
          dragStart={dragStart}
          dragEnd={dragEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
      </div>
      
      {(gameState.gameOver || gameState.levelComplete) && (
        <GameModal 
          isVictory={gameState.levelComplete}
          score={gameState.score}
          levelName={level.name}
          hasNextLevel={gameState.currentLevel < levels.length - 1}
          onRestart={startGame}
          onNextLevel={nextLevel}
        />
      )}
    </div>
  )
}

export default App
