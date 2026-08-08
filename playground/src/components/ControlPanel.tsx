import { useState, useMemo } from 'react'
import type { RegistryEntry } from '../registry'
import type { NumberControl, PropControl } from './ControlPanel.interface'

interface IProps {
  entry: RegistryEntry
  isPanelOpen: boolean
  currentProps: Record<string, unknown>
  onPropChange: (key: string, value: unknown) => void
  onClose: () => void
}

function getVal(key: string, props: Record<string, unknown>, defaults: Record<string, unknown>): unknown {
  return key in props ? props[key] : defaults[key]
}

function formatNum(value: number, step: number | undefined): string {
  if (step === undefined) return String(value)
  const dec = step.toString().includes('.') ? step.toString().split('.')[1].length : 0
  return value.toFixed(dec)
}

function generateCode(name: string, props: Record<string, unknown>, defaults: Record<string, unknown>): string {
  const parts: string[] = []
  for (const key of Object.keys(props)) {
    const val = props[key]
    if (JSON.stringify(val) === JSON.stringify(defaults[key])) continue
    if (typeof val === 'boolean') {
      parts.push(val ? key : `${key}={false}`)
    } else if (typeof val === 'string') {
      parts.push(`${key}="${val}"`)
    } else if (typeof val === 'number') {
      parts.push(`${key}={${val}}`)
    } else if (Array.isArray(val)) {
      const inner = (val as unknown[]).map((v) => (typeof v === 'string' ? `'${v}'` : String(v))).join(', ')
      parts.push(`${key}={[${inner}]}`)
    }
  }
  if (parts.length === 0) return `<${name} />`
  const oneLiner = `<${name} ${parts.join(' ')} />`
  return oneLiner.length <= 80 ? oneLiner : `<${name}\n${parts.map((p) => `  ${p}`).join('\n')}\n/>`
}

function groupBy(controls: PropControl[]): [string, PropControl[]][] {
  const map = new Map<string, PropControl[]>()
  for (const c of controls) {
    const g = c.group ?? 'General'
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(c)
  }
  return [...map.entries()]
}

function BoolToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-white/15'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4.5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

function NumberSlider({
  ctrl,
  value,
  onChange,
}: {
  ctrl: NumberControl
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="range"
        min={ctrl.min ?? 0}
        max={ctrl.max ?? 100}
        step={ctrl.step ?? 1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-blue-500 cursor-pointer"
      />
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-white/45">{formatNum(value, ctrl.step)}</span>
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isHex = /^#[0-9a-f]{3,8}$/i.test(value)
  const bgStyle =
    value === 'transparent' || !value ? 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 0 0 / 6px 6px' : value

  return (
    <div className="flex items-center gap-2 mt-1">
      <div
        className="relative w-7 h-7 shrink-0 rounded overflow-hidden border border-white/15"
        style={{ background: bgStyle }}
      >
        {isHex && (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent text-xs font-mono text-white/55 border-b border-white/8 focus:outline-none focus:border-white/30 pb-0.5"
        spellCheck={false}
      />
    </div>
  )
}

function PaletteInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {value.map((color, i) => (
        <div key={i} className="relative group">
          <div
            className="relative w-8 h-8 rounded overflow-hidden border border-white/15 cursor-pointer"
            style={{ background: color }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => {
                const next = [...value]
                next[i] = e.target.value
                onChange(next)
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </div>
          {value.length > 1 && (
            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 border border-white/20 rounded-full text-white/50 hover:text-white text-[10px] hidden group-hover:flex items-center justify-center leading-none"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => onChange([...value, '#ffffff'])}
        className="w-8 h-8 rounded border border-dashed border-white/20 text-white/30 hover:text-white/60 hover:border-white/40 text-lg flex items-center justify-center transition-colors leading-none"
      >
        +
      </button>
    </div>
  )
}

export default function ControlPanel({ entry, currentProps, isPanelOpen, onPropChange, onClose }: IProps) {
  const [copied, setCopied] = useState(false)
  const { config } = entry
  const groups = useMemo(() => groupBy(config.controls), [config.controls])
  const code = useMemo(
    () => generateCode(entry.name, currentProps, config.defaultValues),
    [entry.name, currentProps, config.defaultValues],
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      className={`${isPanelOpen ? 'translate-x-0' : 'translate-x-full'} transition absolute right-0 top-0 h-full w-80 z-100 flex flex-col bg-black/92 backdrop-blur-xl border-l border-white/8`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0 ">
        <span className="text-sm font-medium text-white/80">Controls</span>
        <button
          onClick={onClose}
          className="cursor-pointer w-7 h-7 flex items-center justify-center rounded text-white/35 hover:text-white hover:bg-white/8 text-lg leading-none transition-colors"
        >
          ×
        </button>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-5">
        {groups.map(([group, controls]) => (
          <div key={group}>
            <p className="text-[10px] font-semibold tracking-widest text-white/25 uppercase mb-3">{group}</p>
            <div className="flex flex-col gap-3.5">
              {controls.map((ctrl) => {
                const val = getVal(ctrl.key, currentProps, config.defaultValues)
                return (
                  <div key={ctrl.key}>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs text-white/55">{ctrl.label}</label>
                      {ctrl.type === 'boolean' && (
                        <BoolToggle value={val as boolean} onChange={(v) => onPropChange(ctrl.key, v)} />
                      )}
                    </div>
                    {ctrl.type === 'number' && (
                      <NumberSlider
                        ctrl={ctrl as NumberControl}
                        value={val as number}
                        onChange={(v) => onPropChange(ctrl.key, v)}
                      />
                    )}
                    {ctrl.type === 'color' && (
                      <ColorInput value={val as string} onChange={(v) => onPropChange(ctrl.key, v)} />
                    )}
                    {ctrl.type === 'palette' && (
                      <PaletteInput value={val as string[]} onChange={(v) => onPropChange(ctrl.key, v)} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Generated code */}
      <div className="shrink-0 border-t border-white/8 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold tracking-widest text-white/25 uppercase">Code</span>
          <button onClick={handleCopy} className="text-xs text-white/35 hover:text-white/70 transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="text-[11px] font-mono text-green-400/75 bg-black/50 border border-white/6 rounded-lg px-3 py-2.5 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
          {code}
        </pre>
      </div>
    </div>
  )
}
