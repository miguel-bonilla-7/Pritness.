import { useState, useCallback, useRef } from 'react'

const PULL_THRESHOLD = 70
const MAX_PULL = 100

interface PullToRefreshProps {
  onRefresh: () => void
}

/** Deslizar hacia abajo en la franja superior para recargar. No muestra pantalla tapada al deslizar; solo al recargar (MainLayout). */
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
    <div
      className="absolute left-0 right-0 top-0 h-14 z-40 touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      aria-hidden
    />
  )
}
