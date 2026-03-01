import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { NotificationPrompt } from '../components/NotificationPrompt'
import { SyncTimezone } from '../components/SyncTimezone'
import { OfflineBanner } from '../components/OfflineBanner'
import { PageSpinner } from '../components/PageSpinner'
import { CameraProvider } from '../context/CameraContext'

export function MainLayout() {
  const [isReloading, setIsReloading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const currentPathRef = useRef(location.pathname)

  useEffect(() => {
    currentPathRef.current = location.pathname
  }, [location.pathname])

  // Bloquear gesto "deslizar derecha = atrás" del navegador para no salir de la página actual
  useEffect(() => {
    const handlePopState = () => {
      const stayOn = currentPathRef.current
      navigate(stayOn, { replace: true })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  const handleRefresh = () => {
    setIsReloading(true)
    setTimeout(() => window.location.reload(), 400)
  }

  return (
    <CameraProvider>
    <div className="bg-app flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      <OfflineBanner />
      <header className="sticky top-0 z-20 bg-app border-b border-white/5 px-4 py-3 safe-top shrink-0">
        <button
          type="button"
          onClick={handleRefresh}
          className="text-lg font-bold text-white tracking-tight touch-manipulation min-h-[44px] -my-1 -mx-2 px-2 py-1 rounded-lg active:bg-white/5 transition-colors"
          aria-label="Recargar"
        >
          Pritness
        </button>
      </header>
      <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden overscroll-none touch-pan-y pb-[max(5.5rem,calc(5.5rem+env(safe-area-inset-bottom)))]" style={{ overscrollBehaviorX: 'none' }}>
        <div className="flex-1 min-h-0 flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <SyncTimezone />
      <NotificationPrompt />
      {isReloading && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-app)' }}
        >
          <PageSpinner />
        </div>
      )}
    </div>
    </CameraProvider>
  )
}
