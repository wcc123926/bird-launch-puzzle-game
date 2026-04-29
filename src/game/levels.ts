import { Vector2, Pig, Box, Ground, createPig, createBox, createGround } from './physics'

export interface Level {
  name: string
  pigs: Pig[]
  boxes: Box[]
  ground: Ground
  slingshot: Vector2
  birdsCount: number
}

export const levels: Level[] = [
  {
    name: '第一关：初试牛刀',
    pigs: [
      createPig(650, 500)
    ],
    boxes: [
      createBox(650, 540, 80, 20),
      createBox(620, 480, 20, 100),
      createBox(680, 480, 20, 100)
    ],
    ground: createGround(0, 580, 800, 20),
    slingshot: { x: 150, y: 520 },
    birdsCount: 3
  },
  {
    name: '第二关：双重目标',
    pigs: [
      createPig(550, 500),
      createPig(680, 500)
    ],
    boxes: [
      createBox(550, 540, 80, 20),
      createBox(520, 480, 20, 100),
      createBox(580, 480, 20, 100),
      createBox(680, 540, 80, 20),
      createBox(650, 480, 20, 100),
      createBox(710, 480, 20, 100)
    ],
    ground: createGround(0, 580, 800, 20),
    slingshot: { x: 150, y: 520 },
    birdsCount: 4
  },
  {
    name: '第三关：金字塔挑战',
    pigs: [
      createPig(600, 500),
      createPig(650, 450)
    ],
    boxes: [
      createBox(600, 540, 120, 20),
      createBox(560, 480, 20, 100),
      createBox(600, 480, 20, 100),
      createBox(640, 480, 20, 100),
      createBox(580, 440, 80, 20),
      createBox(620, 440, 80, 20)
    ],
    ground: createGround(0, 580, 800, 20),
    slingshot: { x: 150, y: 520 },
    birdsCount: 5
  }
]
