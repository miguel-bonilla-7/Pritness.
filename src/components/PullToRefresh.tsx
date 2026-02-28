import { useState, useCallback, useRef } from 'react'

const PULL_THRESHOLD = 70
const MAX_PULL = 100

interface PullToRefreshProps {
  onRefresh: () => void
}

/** Franja en la parte superior: deslizar hacia abajo para recargar. Muestra spinner pequeño centrado. */
export function PullToRefresh({ onRefresh }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0)
  const startYRef = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const y = e.touches[0].clientY
    const diff = y - startYRef.current
    if (diff > 0) setPullY(Math.min(diff, MAX_PULL))
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullY >= PULL_THRESHOLD) onRefresh()
    setPullY(0)
  }, [pullY, onRefresh])

  return (
    <>
      <div
        className="absolute left-0 right-0 top-0 h-14 z-40 flex items-center justify-center touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-hidden
      />
      {pullY > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-app transition-opacity duration-150"
          style={{ opacity: Math.min(1, pullY / PULL_THRESHOLD) }}
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="spinner spinner--xs" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
