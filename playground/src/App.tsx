import { useState } from 'react'
import { registry, RegistryEntry } from './registry'
import ControlPanel from './components/ControlPanel'

function SlidersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  )
}

export default function App() {
  const [selected, setSelected] = useState<RegistryEntry>(registry[0])
  const [currentProps, setCurrentProps] = useState<Record<string, unknown>>(registry[0].initialProps ?? {})
  const [panelOpen, setPanelOpen] = useState(false)

  const Component = selected.component

  function handleSelect(entry: RegistryEntry) {
    setSelected(entry)
    setCurrentProps(entry.initialProps ?? {})
    setPanelOpen(false)
  }

  function handlePropChange(key: string, value: unknown) {
    setCurrentProps((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex h-screen">
      {/* Frosted-glass sidebar */}
      <aside className="h-full w-52 shrink-0 z-10 flex flex-col border-r border-white/8 bg-black/85 backdrop-blur-md">
        <div className="px-4 py-5 border-b border-white/8">
          <p className="text-md font-semibold tracking-widest text-white uppercase">react-patternify</p>
          <p className="mt-0.5 text-sm text-gray-50">playground</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest text-gray-300 uppercase">Components</p>
          {registry.map((entry) => (
            <button
              key={entry.id}
              onClick={() => handleSelect(entry)}
              className={[
                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                selected.id === entry.id
                  ? 'bg-white/12 text-white'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/6',
              ].join(' ')}
            >
              {entry.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Component preview */}
      <div className="flex-1 relative overflow-hidden">
        <Component key={selected.id} {...currentProps} />

        {/* Controls toggle button */}
        <button
          onClick={() => setPanelOpen((p) => !p)}
          className={[
            'absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-full',
            'border transition-all text-sm font-medium backdrop-blur-md',
            panelOpen
              ? 'bg-white/12 border-white/20 text-white'
              : 'bg-black/55 border-white/10 text-white/60 hover:text-white hover:bg-black/70 hover:border-white/15',
          ].join(' ')}
        >
          <SlidersIcon />
          <span>Controls</span>
        </button>

        {/* Control panel */}
        {panelOpen && (
          <ControlPanel
            entry={selected}
            currentProps={currentProps}
            onPropChange={handlePropChange}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
