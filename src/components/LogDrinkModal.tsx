import { useState } from 'react'
import { Modal } from './Modal'
import { useDailyLog } from '../context/DailyLogContext'

interface LogDrinkModalProps {
  open: boolean
  onClose: () => void
}

const PRESETS = [
  {
    label: 'Vasito',
    sub: '6 oz · 180 ml',
    ml: 180,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14l-2 14H7L5 3z" />
        <path d="M5 3H3" />
        <path d="M19 3h2" />
      </svg>
    ),
  },
  {
    label: 'Vaso',
    sub: '8 oz · 240 ml',
    ml: 240,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h14l-2 16H7L5 3z" />
      </svg>
    ),
  },
  {
    label: 'Taza',
    sub: '10 oz · 300 ml',
    ml: 300,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    label: 'Botella',
    sub: '16 oz · 500 ml',
    ml: 500,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H9" />
        <path d="M9 2v3l-3 3v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-3-3V2" />
        <line x1="6" y1="13" x2="18" y2="13" />
      </svg>
    ),
  },
  {
    label: 'Botella grande',
    sub: '25 oz · 750 ml',
    ml: 750,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H9" />
        <path d="M9 2v3l-3 3v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-3-3V2" />
        <line x1="6" y1="11" x2="18" y2="11" />
        <line x1="6" y1="15" x2="18" y2="15" />
      </svg>
    ),
  },
  {
    label: '32 oz',
    sub: '32 oz · 946 ml',
    ml: 946,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    ),
  },
]

export function LogDrinkModal({ open, onClose }: LogDrinkModalProps) {
  const { addWater } = useDailyLog()
  const [customMl, setCustomMl] = useState('')

  const add = (ml: number) => {
    addWater(ml)
    setCustomMl('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ml = parseInt(customMl, 10)
    if (!isNaN(ml) && ml > 0) {
      add(ml)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar agua">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.ml}
              type="button"
              onClick={() => add(preset.ml)}
              className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 border border-white/[0.08] bg-white/[0.03] active:bg-white/[0.07] active:scale-95 transition-all text-white/40"
            >
              {preset.icon}
              <span className="text-[11px] font-medium text-white/80 leading-tight">{preset.label}</span>
              <span className="text-[9px] text-gray-600 leading-tight">{preset.sub}</span>
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
          <input
            type="number"
            min="1"
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
            placeholder="Otro (ml)"
          />
          <button
            type="submit"
            className="rounded-xl px-4 py-2.5 border border-white/10 bg-white/[0.04] text-xs font-medium text-white/80 active:bg-white/[0.08] transition-colors"
          >
            Añadir
          </button>
        </form>
      </div>
    </Modal>
  )
}
