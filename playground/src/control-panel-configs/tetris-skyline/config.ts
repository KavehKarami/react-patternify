import type { ComponentConfig } from '../../components/ControlPanel.interface'

const config: ComponentConfig = {
  defaultValues: {
    contained: false,
    minCell: 16,
    maxCell: 24,
    preferredCell: 20,
    cellGap: 3,
    bg: '#0b1220',
    gridLine: 'transparent',
    pieceDropMs: 90,
    spawnEveryMs: 520,
    maxActivePieces: 7,
    initialTerrainPercent: 0.2,
    terrainRoughness: 2,
    topChipsChance: 0.05,
    columnClearAnimMs: 260,
    palette: ['#ff2d6d', '#a855f7', '#60a5fa'],
  },
  controls: [
    { key: 'contained', label: 'Contained mode', type: 'boolean', group: 'Layout' },

    { key: 'preferredCell', label: 'Preferred cell size', type: 'number', min: 4, max: 48, step: 1, group: 'Grid' },
    { key: 'minCell', label: 'Min cell size', type: 'number', min: 4, max: 32, step: 1, group: 'Grid' },
    { key: 'maxCell', label: 'Max cell size', type: 'number', min: 8, max: 64, step: 1, group: 'Grid' },
    { key: 'cellGap', label: 'Cell gap', type: 'number', min: 0, max: 8, step: 1, group: 'Grid' },

    { key: 'bg', label: 'Background color', type: 'color', group: 'Appearance' },
    { key: 'gridLine', label: 'Grid line color', type: 'color', group: 'Appearance' },
    { key: 'palette', label: 'Piece colors', type: 'palette', group: 'Appearance' },

    { key: 'pieceDropMs', label: 'Drop interval (ms)', type: 'number', min: 20, max: 2000, step: 10, group: 'Timing' },
    {
      key: 'spawnEveryMs',
      label: 'Spawn interval (ms)',
      type: 'number',
      min: 100,
      max: 5000,
      step: 50,
      group: 'Timing',
    },
    {
      key: 'columnClearAnimMs',
      label: 'Clear animation (ms)',
      type: 'number',
      min: 50,
      max: 2000,
      step: 50,
      group: 'Timing',
    },

    { key: 'maxActivePieces', label: 'Max active pieces', type: 'number', min: 1, max: 30, step: 1, group: 'Gameplay' },

    {
      key: 'initialTerrainPercent',
      label: 'Initial terrain height',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.05,
      group: 'Terrain',
    },
    { key: 'terrainRoughness', label: 'Roughness', type: 'number', min: 0, max: 5, step: 1, group: 'Terrain' },
    { key: 'topChipsChance', label: 'Top chips', type: 'number', min: 0, max: 0.5, step: 0.01, group: 'Terrain' },
  ],
}

export default config
