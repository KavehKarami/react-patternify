import { ComponentType } from 'react'
import { TetrisSkyline, Tetris } from 'react-patternify'
import type { ComponentConfig } from './components/ControlPanel.interface'
import tetrisSkylineConfig from './control-panel-configs/tetris-skyline/config'
import tetrisConfig from './control-panel-configs/tetris/config'

export interface RegistryEntry {
  id: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  config: ComponentConfig
  initialProps?: Record<string, unknown>
}

export const registry: RegistryEntry[] = [
  {
    id: 'tetris-skyline',
    name: 'TetrisSkyline',
    component: TetrisSkyline,
    config: tetrisSkylineConfig,
    initialProps: { contained: false },
  },
  {
    id: 'tetris',
    name: 'Tetris',
    component: Tetris,
    config: tetrisConfig,
    initialProps: { contained: false },
  },
]
