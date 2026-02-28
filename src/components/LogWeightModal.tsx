import { useState } from 'react'
import { Modal } from './Modal'
import { useDailyLog } from '../context/DailyLogContext'

interface LogWeightModalProps {
  open: boolean
  onClose: () => void
}

export function LogWeightModal({ open, onClose }: LogWeightModalProps) {
  const { weightKg, logWeight } = useDailyLog()
  const [value, setValue] = useState(weightKg.toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const kg = parseFloat(value.replace(',', '.'))
    if (!isNaN(kg) && kg > 0 && kg < 300) {
      logWeight(kg)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar peso">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Peso actual (kg)</label>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ej. 72.5"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl py-3.5 bg-white/20 text-white font-semibold hover:bg-white/25 transition-colors"
        >
          Guardar
        </button>
      </form>
    </Modal>
  )
}
