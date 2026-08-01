import { useEffect, useRef } from 'react'
import type { TetrisSkylineProps } from './types'

type Cell = 0 | string

type Piece = {
  color: string
  x: number
  y: number
  m: number[][]
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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const randInt = (max: number) => (Math.random() * max) | 0

function rotateCW(m: number[][]): number[][] {
  const n = m.length
  const r = Array.from({ length: n }, () => Array(n).fill(0) as number[])
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) r[j][n - 1 - i] = m[i][j]
  return r
}

function pickCellSize(w: number, h: number, min: number, max: number, preferred: number): number {
  let best = preferred
  let bestScore = Infinity
  for (let c = min; c <= max; c++) {
    const score = (w % c) + (h % c) + Math.abs(c - preferred) * 1.25
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }
  return best
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function TetrisSkyline({
  minCell = 16,
  maxCell = 24,
  preferredCell = 20,
  cellGap = 3,
  bg = '#0b1220',
  gridLine = 'transparent',
  pieceDropMs = 90,
  spawnEveryMs = 520,
  maxActivePieces = 7,
  terrainPx = 300,
  terrainMinRatio = 0.28,
  terrainMaxRatio = 0.55,
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
    let baseline: Cell[][] = []
    let settled: Cell[][] = []
    let pieces: Piece[] = []
    const clearing = new Map<number, number>()
    let rafId = 0
    let prevTs = performance.now()
    let dropAcc = 0
    let spawnAcc = 0

    const makeGrid = (): Cell[][] => Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0 as Cell))

    const buildTerrain = (grid: Cell[][]) => {
      const vh = window.innerHeight
      const targetRows = Math.round(terrainPx / cellSize)
      const minRows = Math.round((vh * terrainMinRatio) / cellSize)
      const maxRows = Math.round((vh * terrainMaxRatio) / cellSize)
      const terrainRows = clamp(targetRows, minRows, maxRows)
      const heights: number[] = new Array(cols)
      const minH = Math.max(4, Math.round(terrainRows * 0.55))
      const maxH = Math.max(minH + 2, Math.round(terrainRows * 1.1))

      heights[0] = clamp(Math.round((minH + maxH) / 2), minH, maxH)
      for (let c = 1; c < cols; c++) {
        const step = randInt(terrainRoughness * 2 + 1) - terrainRoughness
        heights[c] = clamp(heights[c - 1] + step, minH, maxH)
      }

      for (let c = 0; c < cols; c++) {
        const h = heights[c]
        const startRow = rows - h
        for (let r = startRow; r < rows; r++) grid[r][c] = palette[randInt(palette.length)]
        for (let i = 0; i < 2; i++) {
          const r = startRow + i
          if (r >= 0 && r < rows && Math.random() < topChipsChance) grid[r][c] = 0
        }
        for (let r = startRow + 2; r < rows - 1; r++) {
          if (Math.random() < holeChance) {
            grid[r][c] = 0
            if (Math.random() < 0.35 && c + 1 < cols) grid[r][c + 1] = 0
          }
        }
      }
    }

    const cloneGrid = (g: Cell[][]): Cell[][] => g.map((row) => row.slice())

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const vw = window.innerWidth
      const vh = window.innerHeight

      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
      canvas.width = Math.floor(vw * dpr)
      canvas.height = Math.floor(vh * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false

      cellSize = pickCellSize(vw, vh, minCell, maxCell, preferredCell)
      cols = Math.max(12, Math.floor(vw / cellSize))
      rows = Math.max(18, Math.floor(vh / cellSize))
      offsetX = Math.floor((vw - cols * cellSize) / 2)
      offsetY = Math.floor(vh - rows * cellSize)

      baseline = makeGrid()
      buildTerrain(baseline)
      settled = cloneGrid(baseline)
      clearing.clear()
      pieces = []
    }

    const collides = (p: Piece, dy: number) => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!p.m[r][c]) continue
          const gc = p.x + c
          const gr = p.y + r + dy
          if (gc < 0 || gc >= cols || gr >= rows) return true
          if (gr < 0) continue
          if (settled[gr][gc]) return true
        }
      }
      return false
    }

    const lock = (p: Piece) => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!p.m[r][c]) continue
          const gc = p.x + c
          const gr = p.y + r
          if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) settled[gr][gc] = p.color
        }
      }
    }

    const topRowInCol = (c: number) => {
      for (let r = 0; r < rows; r++) if (settled[r][c]) return r
      return Infinity
    }

    const markClearing = () => {
      const band = clamp(triggerTopRows, 1, Math.max(1, rows - 1))
      for (let c = 0; c < cols; c++) {
        if (clearing.has(c)) continue
        if (topRowInCol(c) <= band) clearing.set(c, 0)
      }
    }

    const applyResets = () => {
      if (clearing.size === 0) return
      for (const [c, p] of clearing) {
        if (p >= 1) {
          for (let r = 0; r < rows; r++) settled[r][c] = baseline[r][c]
          clearing.delete(c)
        }
      }
    }

    const spawnPiece = () => {
      let m = SHAPES[randInt(SHAPES.length)].map((r) => r.slice())
      const rots = randInt(4)
      for (let i = 0; i < rots; i++) m = rotateCW(m)
      pieces.push({
        color: palette[randInt(palette.length)],
        x: clamp(randInt(cols), 0, cols - 4),
        y: -4,
        m,
      })
    }

    const drawCell = (c: number, r: number, color: string, alpha = 1, scale = 1) => {
      const x = offsetX + c * cellSize
      const y = offsetY + r * cellSize
      const base = cellSize - cellGap
      const size = base * scale
      const cx = x + base / 2
      const cy = y + base / 2

      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size)
      ctx.strokeStyle = gridLine
      ctx.lineWidth = 1
      ctx.strokeRect(cx - size / 2 + 0.5, cy - size / 2 + 0.5, size - 1, size - 1)
      ctx.globalAlpha = 1
    }

    const render = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, vw, vh)

      const easedClearing = new Map<number, number>()
      for (const [c, p] of clearing) easedClearing.set(c, easeOutCubic(p))

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const color = settled[r][c]
          if (!color) continue
          const ep = easedClearing.get(c)
          if (ep === undefined) {
            drawCell(c, r, color)
            continue
          }
          const wipe = clamp(r / Math.max(1, rows - 1) + 0.15, 0, 1)
          const lp = clamp((ep - wipe * 0.25) / 0.75, 0, 1)
          drawCell(c, r, color, 1 - lp, 1 - 0.45 * lp)
        }
      }

      for (const p of pieces) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (!p.m[r][c]) continue
            const gr = p.y + r
            const gc = p.x + c
            if (gr >= 0) drawCell(gc, gr, p.color)
          }
        }
      }
    }

    const tick = () => {
      const next: Piece[] = []
      for (const p of pieces) {
        if (!collides(p, 1)) {
          p.y += 1
          next.push(p)
        } else lock(p)
      }
      pieces = next
      markClearing()
    }

    const loop = (ts: number) => {
      const dt = ts - prevTs
      prevTs = ts

      if (clearing.size > 0) {
        const dp = dt / columnClearAnimMs
        for (const [c, p] of clearing) clearing.set(c, Math.min(1, p + dp))
        applyResets()
      }

      dropAcc += dt
      spawnAcc += dt

      while (spawnAcc >= spawnEveryMs) {
        spawnAcc -= spawnEveryMs
        if (pieces.length < maxActivePieces) spawnPiece()
      }
      while (dropAcc >= pieceDropMs) {
        dropAcc -= pieceDropMs
        tick()
      }

      render()
      rafId = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    for (let i = 0; i < Math.min(3, maxActivePieces); i++) spawnPiece()
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
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
    terrainPx,
    terrainMinRatio,
    terrainMaxRatio,
    terrainRoughness,
    holeChance,
    topChipsChance,
    triggerTopRows,
    columnClearAnimMs,
    palette,
  ])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
    />
  )
}
