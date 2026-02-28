import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { OfflineBanner } from '../components/OfflineBanner'
import { PageSpinner } from '../components/PageSpinner'
import { CameraProvider } from '../context/CameraContext'

export function MainLayout() {
  const [isReloading, setIsReloading] = useState(false)

  const handleReload = () => {
    setIsReloading(true)
    setTimeout(() => window.location.reload(), 400)
  }

  return (
    <CameraProvider>
    <div className="min-h-screen bg-app flex flex-col">
      <OfflineBanner />
      <header className="bg-app border-b border-white/5 px-4 py-3 safe-top flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Pritness</h1>
        <button
          type="button"
          onClick={handleReload}
          disabled={isReloading}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          aria-label="Recargar página"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>
      <main className="flex-1 flex flex-col min-h-0 pb-24">
        <div className="flex-1 min-h-0 flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      {isReloading && (
        <div className="fixed inset-0 z-[60] bg-app/90 flex items-center justify-center">
          <PageSpinner message="Recargando..." />
        </div>
      )}
    </div>
    </CameraProvider>
  )
}
