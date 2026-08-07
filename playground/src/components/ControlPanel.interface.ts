export interface PropControlBase {
  key: string
  label: string
  group?: string
}

export interface BooleanControl extends PropControlBase {
  type: 'boolean'
}

export interface NumberControl extends PropControlBase {
  type: 'number'
  min?: number
  max?: number
  step?: number
}

export interface ColorControl extends PropControlBase {
  type: 'color'
}

export interface PaletteControl extends PropControlBase {
  type: 'palette'
}

export type PropControl = BooleanControl | NumberControl | ColorControl | PaletteControl

export interface ComponentConfig {
  controls: PropControl[]
  defaultValues: Record<string, unknown>
}
