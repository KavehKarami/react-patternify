import { useEffect, useRef } from 'react'
import type { TetrisSkylineProps } from './types'

type Cell = 0 | string

type Piece = {
  color: string
  x: number
  y: number
  matrix: number[][]
}

const SHAPES: number[][][] = [
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O
  [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // T
  [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // S
  [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // Z
  [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // J
  [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // L
  [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
]

const DEFAULT_PALETTE = ['#ff2d6d', '#a855f7', '#60a5fa']

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
const randInt = (max: number) => (Math.random() * max) | 0

function rotateCW(matrix: number[][]): number[][] {
  const size = matrix.length
  const rotated = Array.from({ length: size }, () => Array(size).fill(0) as number[])
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) rotated[col][size - 1 - row] = matrix[row][col]
  return rotated
}

function pickCellSize(w: number, h: number, min: number, max: number, preferred: number): number {
  let best = preferred
  let bestScore = Infinity
  for (let candidate = min; candidate <= max; candidate++) {
    const score = (w % candidate) + (h % candidate) + Math.abs(candidate - preferred) * 1.25
    if (score < bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3)

export function TetrisSkyline({
  contained = false,
  minCell = 16,
  maxCell = 24,
  preferredCell = 20,
  cellGap = 3,
  bg = '#0b1220',
  gridLine = 'transparent',
  pieceDropMs = 90,
  spawnEveryMs = 520,
  maxActivePieces = 7,
  initialTerrainPercent = 0.2,
  terrainRoughness = 2,
  holeChance = 0.008,
  topChipsChance = 0.05,
  triggerTopRows = 2,
  columnClearAnimMs = 260,
  palette = DEFAULT_PALETTE,
}: TetrisSkylineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let cellSize = preferredCell
    let cols = 0
    let rows = 0
    let offsetX = 0
    let offsetY = 0
    let canvasW = 0
    let canvasH = 0
    let baseline: Cell[][] = []
    let settled: Cell[][] = []
    let pieces: Piece[] = []
    const clearing = new Map<number, number>()
    let animationFrameId = 0
    let prevTimestamp = performance.now()
    let dropAccumulator = 0
    let spawnAccumulator = 0

    const makeGrid = (): Cell[][] => Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0 as Cell))

    const buildTerrain = (grid: Cell[][]) => {
      if (initialTerrainPercent === 0) return
      const targetRows = Math.round(initialTerrainPercent * rows)
      const heights: number[] = new Array(cols)
      const minH = Math.max(1, Math.round(targetRows * 0.55))
      const maxH = Math.max(minH + 1, targetRows)

      heights[0] = clamp(Math.round((minH + maxH) / 2), minH, maxH)
      for (let col = 1; col < cols; col++) {
        const step = randInt(terrainRoughness * 2 + 1) - terrainRoughness
        heights[col] = clamp(heights[col - 1] + step, minH, maxH)
      }

      for (let col = 0; col < cols; col++) {
        const columnHeight = heights[col]
        const startRow = rows - columnHeight
        for (let row = Math.max(0, startRow); row < rows; row++) grid[row][col] = palette[randInt(palette.length)]
        for (let chipOffset = 0; chipOffset < 2; chipOffset++) {
          const row = startRow + chipOffset
          if (row >= 0 && row < rows && Math.random() < topChipsChance) grid[row][col] = 0
        }
        for (let row = Math.max(0, startRow + 2); row < rows - 1; row++) {
          if (Math.random() < holeChance) {
            grid[row][col] = 0
            if (Math.random() < 0.35 && col + 1 < cols) grid[row][col + 1] = 0
          }
        }
      }
    }

    const cloneGrid = (grid: Cell[][]): Cell[][] => grid.map((row) => row.slice())

    const resize = () => {
      const pixelRatio = Math.max(1, window.devicePixelRatio || 1)

      if (contained) {
        const parent = canvas.parentElement
        canvasW = parent ? parent.clientWidth : canvas.offsetWidth
        canvasH = parent ? parent.clientHeight : canvas.offsetHeight
      } else {
        canvasW = window.innerWidth
        canvasH = window.innerHeight
      }
      canvas.style.width = `${canvasW}px`
      canvas.style.height = `${canvasH}px`

      canvas.width = Math.floor(canvasW * pixelRatio)
      canvas.height = Math.floor(canvasH * pixelRatio)
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.imageSmoothingEnabled = false

      cellSize = pickCellSize(canvasW, canvasH, minCell, maxCell, preferredCell)
      cols = Math.max(12, Math.floor(canvasW / cellSize))
      rows = Math.max(18, Math.floor(canvasH / cellSize))
      offsetX = Math.floor((canvasW - cols * cellSize) / 2)
      offsetY = Math.floor(canvasH - rows * cellSize)

      baseline = makeGrid()
      buildTerrain(baseline)
      settled = cloneGrid(baseline)
      clearing.clear()
      pieces = []
    }

    const collides = (piece: Piece, deltaRow: number) => {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (!piece.matrix[row][col]) continue
          const gridCol = piece.x + col
          const gridRow = piece.y + row + deltaRow
          if (gridCol < 0 || gridCol >= cols || gridRow >= rows) return true
          if (gridRow < 0) continue
          if (settled[gridRow][gridCol]) return true
        }
      }
      return false
    }

    const lock = (piece: Piece) => {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (!piece.matrix[row][col]) continue
          const gridCol = piece.x + col
          const gridRow = piece.y + row
          if (gridRow >= 0 && gridRow < rows && gridCol >= 0 && gridCol < cols) settled[gridRow][gridCol] = piece.color
        }
      }
    }

    const topRowInCol = (col: number) => {
      for (let row = 0; row < rows; row++) if (settled[row][col]) return row
      return Infinity
    }

    const markClearing = () => {
      const visibleTopRow = Math.max(0, Math.ceil(-offsetY / cellSize))
      const band = Math.max(visibleTopRow, clamp(triggerTopRows, 1, Math.max(1, rows - 1)))
      for (let col = 0; col < cols; col++) {
        if (clearing.has(col)) continue
        if (topRowInCol(col) <= band) clearing.set(col, 0)
      }
    }

    const applyResets = () => {
      if (clearing.size === 0) return
      for (const [col, progress] of clearing) {
        if (progress >= 1) {
          for (let row = 0; row < rows; row++) settled[row][col] = baseline[row][col]
          clearing.delete(col)
        }
      }
    }

    const spawnPiece = () => {
      let matrix = SHAPES[randInt(SHAPES.length)].map((row) => row.slice())
      const rotations = randInt(4)
      for (let rotationStep = 0; rotationStep < rotations; rotationStep++) matrix = rotateCW(matrix)
      pieces.push({
        color: palette[randInt(palette.length)],
        x: clamp(randInt(cols), 0, cols - 4),
        y: -4,
        matrix,
      })
    }

    const drawCell = (col: number, row: number, color: string, alpha = 1, scale = 1) => {
      const x = offsetX + col * cellSize
      const y = offsetY + row * cellSize
      const base = cellSize - cellGap
      const size = base * scale
      const centerX = x + base / 2
      const centerY = y + base / 2

      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size)
      ctx.strokeStyle = gridLine
      ctx.lineWidth = 1
      ctx.strokeRect(centerX - size / 2 + 0.5, centerY - size / 2 + 0.5, size - 1, size - 1)
      ctx.globalAlpha = 1
    }

    const render = () => {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvasW, canvasH)

      const easedClearing = new Map<number, number>()
      for (const [col, progress] of clearing) easedClearing.set(col, easeOutCubic(progress))

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const color = settled[row][col]
          if (!color) continue
          const easedProgress = easedClearing.get(col)
          if (easedProgress === undefined) {
            drawCell(col, row, color)
            continue
          }
          const wipe = clamp(row / Math.max(1, rows - 1) + 0.15, 0, 1)
          const linearProgress = clamp((easedProgress - wipe * 0.25) / 0.75, 0, 1)
          drawCell(col, row, color, 1 - linearProgress, 1 - 0.45 * linearProgress)
        }
      }

      for (const piece of pieces) {
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            if (!piece.matrix[row][col]) continue
            const gridRow = piece.y + row
            const gridCol = piece.x + col
            if (gridRow >= 0) drawCell(gridCol, gridRow, piece.color)
          }
        }
      }
    }

    const tick = () => {
      const next: Piece[] = []
      for (const piece of pieces) {
        if (!collides(piece, 1)) {
          piece.y += 1
          next.push(piece)
        } else lock(piece)
      }
      pieces = next
      markClearing()
    }

    const loop = (timestamp: number) => {
      const deltaTime = timestamp - prevTimestamp
      prevTimestamp = timestamp

      if (clearing.size > 0) {
        const deltaProgress = deltaTime / columnClearAnimMs
        for (const [col, progress] of clearing) clearing.set(col, Math.min(1, progress + deltaProgress))
        applyResets()
      }

      dropAccumulator += deltaTime
      spawnAccumulator += deltaTime

      while (spawnAccumulator >= spawnEveryMs) {
        spawnAccumulator -= spawnEveryMs
        if (pieces.length < maxActivePieces) spawnPiece()
      }
      while (dropAccumulator >= pieceDropMs) {
        dropAccumulator -= pieceDropMs
        tick()
      }

      render()
      animationFrameId = requestAnimationFrame(loop)
    }

    resize()

    let cleanupResize: () => void
    if (contained) {
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas.parentElement ?? canvas)
      cleanupResize = () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', resize)
      cleanupResize = () => window.removeEventListener('resize', resize)
    }

    for (let index = 0; index < Math.min(3, maxActivePieces); index++) spawnPiece()
    animationFrameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationFrameId)
      cleanupResize()
    }
  }, [
    minCell,
    maxCell,
    preferredCell,
    cellGap,
    bg,
    gridLine,
    pieceDropMs,
    spawnEveryMs,
    maxActivePieces,
    initialTerrainPercent,
    terrainRoughness,
    holeChance,
    topChipsChance,
    triggerTopRows,
    columnClearAnimMs,
    palette,
    contained,
  ])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={
        contained
          ? { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }
          : { position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }
      }
    />
  )
}
