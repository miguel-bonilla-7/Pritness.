import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { OfflineBanner } from '../components/OfflineBanner'
import { PageSpinner } from '../components/PageSpinner'
import { PullToRefresh } from '../components/PullToRefresh'
import { CameraProvider } from '../context/CameraContext'

export function MainLayout() {
  const [isReloading, setIsReloading] = useState(false)

  const handleRefresh = () => {
    setIsReloading(true)
    setTimeout(() => window.location.reload(), 400)
  }

  return (
    <CameraProvider>
    <div className="bg-app flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      <OfflineBanner />
      <header className="sticky top-0 z-20 bg-app border-b border-white/5 px-4 py-3 safe-top shrink-0">
        <h1 className="text-lg font-bold text-white tracking-tight">Pritness</h1>
      </header>
      <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden overscroll-none">
        <PullToRefresh onRefresh={handleRefresh} />
        <div className="flex-1 min-h-0 flex flex-col [&>*]:flex-1 [&>*]:min-h-0 pb-[max(5.5rem,calc(5.5rem+env(safe-area-inset-bottom)))]">
          <Outlet />
        </div>
      </main>
      <BottomNav />
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
