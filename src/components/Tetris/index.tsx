import { useEffect, useRef } from 'react'
import type { TetrisProps } from './types'

type Cell = 0 | string

type Piece = {
  color: string
  x: number
  y: number
  matrix: number[][]
}

type ShiftRow = { finalRow: number; fromRow: number }

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

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function Tetris({
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
  rowClearAnimMs = 260,
  rowShiftAnimMs = 180,
  palette = DEFAULT_PALETTE,
}: TetrisProps) {
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
    let settled: Cell[][] = []
    let pieces: Piece[] = []
    const clearing = new Map<number, number>() // row -> progress [0,1]
    let shiftingRows: ShiftRow[] = []
    let shiftProgress = 0
    let animationFrameId = 0
    let prevTimestamp = performance.now()
    let dropAccumulator = 0
    let spawnAccumulator = 0

    const makeGrid = (): Cell[][] => Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0 as Cell))

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

      settled = makeGrid()
      clearing.clear()
      shiftingRows = []
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

    const markClearing = () => {
      for (let row = 0; row < rows; row++) {
        if (clearing.has(row)) continue
        let full = true
        for (let col = 0; col < cols; col++) {
          if (!settled[row][col]) {
            full = false
            break
          }
        }
        if (full) clearing.set(row, 0)
      }
    }

    // Trigger an animated wipe of the entire board (column full or pieces at ceiling)
    const triggerBoardClear = () => {
      for (let row = 0; row < rows; row++) {
        if (!clearing.has(row)) clearing.set(row, 0)
      }
      pieces = []
    }

    const checkReset = () => {
      // Any column completely filled → animated full-board clear
      for (let col = 0; col < cols; col++) {
        let full = true
        for (let row = 0; row < rows; row++) {
          if (!settled[row][col]) {
            full = false
            break
          }
        }
        if (full) {
          triggerBoardClear()
          return
        }
      }
      // Pieces stacked to the ceiling → animated full-board clear
      for (let col = 0; col < cols; col++) {
        if (settled[0][col]) {
          triggerBoardClear()
          return
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

    // rowFloat accepts sub-integer values for shift animation
    const drawCell = (col: number, rowFloat: number, color: string, alpha = 1, scale = 1) => {
      const x = offsetX + col * cellSize
      const y = offsetY + rowFloat * cellSize
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

      // Build a lookup for rows currently animating their fall
      const shiftMap = new Map<number, number>() // finalRow -> fromRow
      const easedShift = easeOutCubic(shiftProgress)
      for (const { finalRow, fromRow } of shiftingRows) shiftMap.set(finalRow, fromRow)

      for (let row = 0; row < rows; row++) {
        const clearProgress = clearing.get(row)
        const fromRow = shiftMap.get(row)
        for (let col = 0; col < cols; col++) {
          const color = settled[row][col]
          if (!color) continue
          if (clearProgress !== undefined) {
            const eased = easeOutCubic(clearProgress)
            drawCell(col, row, color, 1 - eased, 1 - eased)
          } else if (fromRow !== undefined) {
            drawCell(col, fromRow + (row - fromRow) * easedShift, color)
          } else {
            drawCell(col, row, color)
          }
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
        } else {
          lock(piece)
        }
      }
      pieces = next
      markClearing()
      if (clearing.size === 0) checkReset()
    }

    const finishClearing = () => {
      const rowsToClear = new Set(clearing.keys())

      // Identify surviving rows and their new positions (before mutating settled)
      const survivingFromRows: number[] = []
      for (let row = 0; row < rows; row++) {
        if (!rowsToClear.has(row)) survivingFromRows.push(row)
      }
      const numCleared = rowsToClear.size

      // Build shift animation info: only rows that actually move
      shiftingRows = []
      for (let i = 0; i < survivingFromRows.length; i++) {
        const finalRow = numCleared + i
        const fromRow = survivingFromRows[i]
        if (finalRow !== fromRow) shiftingRows.push({ finalRow, fromRow })
      }
      shiftProgress = 0

      // Apply the grid change immediately; shift animation handles the visual
      const newSettled: Cell[][] = []
      for (let row = 0; row < rows; row++) {
        if (!rowsToClear.has(row)) newSettled.push(settled[row])
      }
      while (newSettled.length < rows) newSettled.unshift(Array(cols).fill(0 as Cell))
      for (let row = 0; row < rows; row++) settled[row] = newSettled[row]
      clearing.clear()
    }

    const loop = (timestamp: number) => {
      const deltaTime = timestamp - prevTimestamp
      prevTimestamp = timestamp

      if (clearing.size > 0) {
        // Phase 1: row-clear fade animation
        const deltaProgress = deltaTime / rowClearAnimMs
        for (const [row, progress] of clearing) clearing.set(row, Math.min(1, progress + deltaProgress))
        let allDone = true
        for (const p of clearing.values()) {
          if (p < 1) {
            allDone = false
            break
          }
        }
        if (allDone) finishClearing()
      } else if (shiftingRows.length > 0) {
        // Phase 2: surviving rows slide down to their final positions
        shiftProgress = Math.min(1, shiftProgress + deltaTime / rowShiftAnimMs)
        if (shiftProgress >= 1) shiftingRows = []
      } else {
        // Phase 3: normal play
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
    rowClearAnimMs,
    rowShiftAnimMs,
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
