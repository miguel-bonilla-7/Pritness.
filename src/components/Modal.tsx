import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-[320px] max-h-[78vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: '#111116' }}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] text-gray-400 text-lg leading-none touch-manipulation"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-4" />
        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
