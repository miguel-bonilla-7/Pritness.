import { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex flex-col bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] shadow-card-glow sm:m-4">
        <div className="shrink-0 sticky top-0 z-10 bg-card border-b border-white/10 px-4 py-3 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
          <h3 className="font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 -webkit-overflow-scrolling-touch">
          {children}
        </div>
      </div>
    </div>
  )
}
