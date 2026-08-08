export interface TetrisProps {
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

  rowClearAnimMs?: number
  rowShiftAnimMs?: number

  palette?: string[]
}
