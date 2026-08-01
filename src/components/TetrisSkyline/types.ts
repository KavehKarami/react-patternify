export interface TetrisSkylineProps {
  minCell?: number
  maxCell?: number
  preferredCell?: number

  cellGap?: number
  bg?: string
  gridLine?: string

  pieceDropMs?: number
  spawnEveryMs?: number
  maxActivePieces?: number

  terrainPx?: number
  terrainMinRatio?: number
  terrainMaxRatio?: number
  terrainRoughness?: number
  holeChance?: number
  topChipsChance?: number

  triggerTopRows?: number
  columnClearAnimMs?: number

  palette?: string[]
}
