import type { ComponentConfig } from '../../components/ControlPanel.interface'

const config: ComponentConfig = {
  defaultValues: {
    contained: false,
    bg: '#060606',
    color: '#00FF41',
    headColor: '#9BE9A8',
    fontSize: 15,
    speed: 20,
    density: 0.65,
    trailLength: 40,
    fontFamily: 'inherit',
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*()-=+[]{}|;:,./<>?',
  },
  controls: [
    { key: 'contained', label: 'Contained mode', type: 'boolean', group: 'Layout' },

    { key: 'bg', label: 'Background color', type: 'color', group: 'Appearance' },
    { key: 'color', label: 'Trail color', type: 'color', group: 'Appearance' },
    { key: 'headColor', label: 'Head color', type: 'color', group: 'Appearance' },

    { key: 'fontSize', label: 'Font size (px)', type: 'number', min: 6, max: 40, step: 1, group: 'Grid' },

    { key: 'speed', label: 'Fall speed (rows/s)', type: 'number', min: 1, max: 100, step: 0.5, group: 'Timing' },
    { key: 'density', label: 'Stream density', type: 'number', min: 0, max: 1, step: 0.05, group: 'Timing' },
    { key: 'trailLength', label: 'Trail length', type: 'number', min: 1, max: 60, step: 1, group: 'Timing' },
  ],
}

export default config
