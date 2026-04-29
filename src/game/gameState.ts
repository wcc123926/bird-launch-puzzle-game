import { Bird, Pig, Box } from './physics'
import { Level } from './levels'

export interface GameState {
  currentLevel: number
  birdsUsed: number
  score: number
  activeBird: Bird | null
  pigs: Pig[]
  boxes: Box[]
  gameOver: boolean
  levelComplete: boolean
  isBirdFlying: boolean
}

export function getInitialState(level: Level, levelIndex: number): GameState {
  return {
    currentLevel: levelIndex,
    birdsUsed: 0,
    score: 0,
    activeBird: null,
    pigs: [...level.pigs.map(p => ({ ...p }))],
    boxes: [...level.boxes.map(b => ({ ...b }))],
    gameOver: false,
    levelComplete: false,
    isBirdFlying: false
  }
}

export function isLevelComplete(state: GameState): boolean {
  return state.pigs.every(pig => pig.isHit)
}

export function isGameOver(state: GameState, birdsCount: number): boolean {
  return isLevelComplete(state) || state.birdsUsed >= birdsCount
}

export function calculateScore(state: GameState): number {
  return state.score
}
