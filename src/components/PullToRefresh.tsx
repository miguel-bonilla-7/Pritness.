import { ReactNode, useCallback, useRef } from 'react'

const PULL_THRESHOLD = 70
const MAX_PULL = 100

interface PullToRefreshProps {
  onRefresh: () => void
  children: ReactNode
}

/** Deslizar hacia abajo para recargar. Los toques pasan al contenido (no bloquea botones). */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const pullYRef = useRef(0)
  const startYRef = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    pullYRef.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const y = e.touches[0].clientY
    const diff = y - startYRef.current
    if (diff > 0) pullYRef.current = Math.min(diff, MAX_PULL)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullYRef.current >= PULL_THRESHOLD) onRefresh()
    pullYRef.current = 0
  }, [onRefresh])

  return (
    <div
      className="flex-1 min-h-0 flex flex-col [&>*]:flex-1 [&>*]:min-h-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
    </div>
  )
}
