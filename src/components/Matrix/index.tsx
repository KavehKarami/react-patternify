import { useEffect, useRef } from 'react'
import type { MatrixProps } from './types'

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*()-=+[]{}|;:,./<>?'

const randomSpeedFactor = () => {
  const min = 0.6 // slowest a drop can be as a fraction of base speed
  const spread = 0.8 // added range, giving a [0.6, 1.4] multiplier centred on 1.0
  return min + Math.random() * spread
}

type Drop = {
  y: number
  speed: number
  active: boolean
  waitMs: number
  chars: string[]
}

export function Matrix({
  contained = false,
  bg = '#060606',
  color = '#00FF41',
  headColor = '#9BE9A8',
  fontSize = 14,
  speed = 20,
  density = 0.65,
  trailLength = 40,
  fontFamily = 'inherit',
  charset = DEFAULT_CHARSET,
}: MatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resolve 'inherit' to the canvas element's computed font-family so the
    // canvas font string is always valid (canvas ignores invalid font values)
    const resolvedFontFamily =
      fontFamily === 'inherit' ? window.getComputedStyle(canvas).fontFamily || 'monospace' : fontFamily

    let cols = 0
    let rows = 0
    let canvasW = 0
    let canvasH = 0
    let animationFrameId = 0
    let prevTimestamp = performance.now()
    let drops: Drop[] = []

    const randomChar = () => charset[(Math.random() * charset.length) | 0]

    const makeDrop = (startActive: boolean): Drop => ({
      y: startActive ? Math.random() * rows : -1,
      speed: speed * randomSpeedFactor(),
      active: startActive,
      waitMs: startActive ? 0 : Math.random() * 6000,
      chars: Array.from({ length: Math.max(1, rows) }, randomChar),
    })

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

      cols = Math.max(1, Math.floor(canvasW / fontSize))
      rows = Math.max(1, Math.ceil(canvasH / fontSize) + 1)

      drops = Array.from({ length: cols }, () => makeDrop(Math.random() < density))
    }

    const loop = (timestamp: number) => {
      const deltaTime = Math.min(timestamp - prevTimestamp, 50)
      prevTimestamp = timestamp

      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvasW, canvasH)

      ctx.font = `${fontSize}px ${resolvedFontFamily}`
      ctx.textAlign = 'center'

      for (let col = 0; col < drops.length; col++) {
        const drop = drops[col]

        if (!drop.active) {
          drop.waitMs -= deltaTime
          if (drop.waitMs <= 0) {
            drop.active = true
            drop.y = 0
            drop.speed = speed * randomSpeedFactor()
            drop.chars = Array.from({ length: Math.max(1, rows) }, randomChar)
          }
          continue
        }

        drop.y += drop.speed * (deltaTime / 1000)

        const headRow = drop.y | 0
        const x = col * fontSize + fontSize / 2

        for (let i = 0; i < trailLength; i++) {
          const row = headRow - i
          if (row < 0 || row >= rows) continue

          const char = drop.chars[row % drop.chars.length]
          const y = (row + 1) * fontSize

          if (i === 0) {
            ctx.fillStyle = headColor
            ctx.globalAlpha = 1
          } else {
            ctx.fillStyle = color
            ctx.globalAlpha = (1 - i / trailLength) * 0.9
          }

          ctx.fillText(char, x, y)
        }

        ctx.globalAlpha = 1

        if (headRow - trailLength > rows) {
          const reactivate = Math.random() < density
          drop.active = reactivate
          drop.y = 0
          drop.waitMs = reactivate ? 0 : Math.random() * 4000 + 500
          drop.speed = speed * randomSpeedFactor()
        }
      }

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

    animationFrameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationFrameId)
      cleanupResize()
    }
  }, [contained, bg, color, headColor, fontSize, speed, density, trailLength, fontFamily, charset])

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
