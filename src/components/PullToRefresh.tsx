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
          className="fixed left-0 right-0 top-16 z-50 flex flex-col items-center justify-center gap-1 py-2 bg-app/95 transition-opacity duration-150"
          style={{ opacity: pullY / PULL_THRESHOLD }}
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div className="spinner spinner--sm" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} />
              ))}
            </div>
          </div>
          <span className="text-gray-500 text-xs">
            {pullY >= PULL_THRESHOLD ? 'Suelta para recargar' : 'Desliza hacia abajo'}
          </span>
        </div>
      )}
    </>
  )
}
