# react-patternify

Animated canvas background patterns for React. Drop a component into your layout and get a self-contained, GPU-friendly animated background, no dependencies beyond React, no DOM overhead, fully customizable via props.

## Install

```bash
npm install react-patternify
```

## Components

### `TetrisSkyline`

An animated Tetris-inspired cityscape. Tetromino pieces spawn at the top and fall onto a procedurally generated skyline terrain. When a column grows too tall the blocks fade out and the terrain resets, keeping the animation running indefinitely.

#### Full-viewport background (default)

The canvas is fixed, full-viewport, placed behind your content (`z-index: -1`, `pointer-events: none`, `aria-hidden`) — a drop-in background with no layout impact.

```tsx
import { TetrisSkyline } from 'react-patternify'

export default function App() {
  return (
    <>
      <TetrisSkyline />
      {/* your content */}
    </>
  )
}
```

> **Next.js App Router**: the components are already marked `"use client"` in the bundle — no wrapper needed.

#### Contained mode

Set `contained` to render the canvas inside a specific element instead of the full viewport. The parent must have `position: relative` (or any positioning context) and explicit dimensions.

```tsx
import { TetrisSkyline } from 'react-patternify'

export default function Hero() {
  return (
    <section style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
      <TetrisSkyline contained />
      <h1 style={{ position: 'relative' }}>Hello</h1>
    </section>
  )
}
```

The canvas uses `position: absolute; inset: 0` and a `ResizeObserver` on the parent, so it adapts automatically when the container resizes.

#### Props

| Prop                    | Type       | Default                             | Description                                                                         |
| ----------------------- | ---------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `contained`             | `boolean`  | `false`                             | Fill the nearest positioned parent instead of the full viewport                     |
| `palette`               | `string[]` | `['#ff2d6d', '#a855f7', '#60a5fa']` | Block colors, cycled across pieces                                                  |
| `bg`                    | `string`   | `'#0b1220'`                         | Canvas background fill                                                              |
| `gridLine`              | `string`   | `'transparent'`                     | Cell border color                                                                   |
| `minCell`               | `number`   | `16`                                | Minimum auto-calculated cell size (px)                                              |
| `maxCell`               | `number`   | `24`                                | Maximum auto-calculated cell size (px)                                              |
| `preferredCell`         | `number`   | `20`                                | Target cell size; clamped to min/max to minimize edge gaps                          |
| `cellGap`               | `number`   | `3`                                 | Gap between cells (px)                                                              |
| `pieceDropMs`           | `number`   | `90`                                | Time per one-cell drop (ms) — lower is faster                                       |
| `spawnEveryMs`          | `number`   | `520`                               | Interval between new piece spawns (ms)                                              |
| `maxActivePieces`       | `number`   | `7`                                 | Max pieces falling at once                                                          |
| `initialTerrainPercent` | `number`   | `0.2`                               | Initial terrain height as a fraction of total rows (0 = no terrain) between 0 and 1 |
| `terrainRoughness`      | `number`   | `2`                                 | Skyline jaggedness — higher values create more variation                            |
| `topChipsChance`        | `number`   | `0.05`                              | Per-cell probability of a surface notch on the terrain                              |
| `triggerTopRows`        | `number`   | `2`                                 | Stack height (in rows from top) that triggers a column reset                        |
| `columnClearAnimMs`     | `number`   | `260`                               | Duration of the column fade-out animation (ms)                                      |
