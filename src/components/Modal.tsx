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
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 w-full max-w-md max-h-[80vh] sm:max-h-[85vh] -translate-x-1/2 -translate-y-1/2 flex flex-col bg-card rounded-3xl shadow-card-glow overflow-hidden"
      >
        <div className="shrink-0 bg-card border-b border-white/10 px-4 py-3 flex items-center justify-between rounded-t-3xl">
          <h3 className="font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 text-gray-400 hover:text-white text-2xl leading-none touch-manipulation"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
