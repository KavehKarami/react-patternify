export interface TetrisSkylineProps {
  contained?: boolean

  minCell?: number
  maxCell?: number
  preferredCell?: number

  cellGap?: number
  bg?: string
  gridLine?: string

  pieceDropMs?: number
  spawnEveryMs?: number
  maxActivePieces?: number

  initialTerrainPercent?: number
  terrainRoughness?: number
  topChipsChance?: number

  columnClearAnimMs?: number

  palette?: string[]
}
