import { useState } from 'react'
import { Modal } from './Modal'
import { useDailyLog } from '../context/DailyLogContext'

interface LogDrinkModalProps {
  open: boolean
  onClose: () => void
}

const PRESETS = [250, 500, 750, 1000]

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
      <div className="space-y-4">
        <p className="text-sm text-gray-400">Selecciona cantidad o escribe la tuya (ml)</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((ml) => (
            <button
              key={ml}
              type="button"
              onClick={() => add(ml)}
              className="rounded-xl py-3 bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
            >
              {ml} ml
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="number"
            min="1"
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Cantidad en ml"
          />
          <button
            type="submit"
            className="rounded-xl px-4 py-3 bg-blue-500/80 text-white font-medium hover:bg-blue-500"
          >
            Añadir
          </button>
        </form>
      </div>
    </Modal>
  )
}
