# react-patternify

Animated canvas background patterns for React.

## Install

```bash
npm install react-patternify
```

## Usage

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

> **Next.js App Router**: the components are already marked `"use client"` in the bundle.

## Props — TetrisSkyline

| Prop                | Type       | Default                             | Description                              |
| ------------------- | ---------- | ----------------------------------- | ---------------------------------------- |
| `palette`           | `string[]` | `['#ff2d6d', '#a855f7', '#60a5fa']` | Block colors                             |
| `bg`                | `string`   | `'#0b1220'`                         | Background fill color                    |
| `gridLine`          | `string`   | `'transparent'`                     | Cell border color                        |
| `minCell`           | `number`   | `16`                                | Min auto cell size (px)                  |
| `maxCell`           | `number`   | `24`                                | Max auto cell size (px)                  |
| `preferredCell`     | `number`   | `20`                                | Preferred cell size (px)                 |
| `cellGap`           | `number`   | `3`                                 | Gap between cells (px)                   |
| `pieceDropMs`       | `number`   | `90`                                | Drop interval per cell (ms)              |
| `spawnEveryMs`      | `number`   | `520`                               | Spawn interval (ms)                      |
| `maxActivePieces`   | `number`   | `7`                                 | Max pieces in air                        |
| `terrainPx`         | `number`   | `300`                               | Target baseline terrain height (px)      |
| `terrainMinRatio`   | `number`   | `0.28`                              | Min terrain as fraction of viewport      |
| `terrainMaxRatio`   | `number`   | `0.55`                              | Max terrain as fraction of viewport      |
| `terrainRoughness`  | `number`   | `2`                                 | Skyline jaggedness                       |
| `holeChance`        | `number`   | `0.008`                             | Probability of interior holes            |
| `topChipsChance`    | `number`   | `0.05`                              | Probability of surface chips             |
| `triggerTopRows`    | `number`   | `2`                                 | Column reset when stack reaches this row |
| `columnClearAnimMs` | `number`   | `260`                               | Column reset animation duration (ms)     |
