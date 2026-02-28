import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { OfflineBanner } from '../components/OfflineBanner'
import { CameraProvider } from '../context/CameraContext'

export function MainLayout() {
  return (
    <CameraProvider>
    <div className="min-h-screen bg-app flex flex-col">
      <OfflineBanner />
      <header className="bg-app border-b border-white/5 px-4 py-3 safe-top">
        <h1 className="text-lg font-bold text-white">Pritness</h1>
      </header>
      <main className="flex-1 flex flex-col min-h-0 pb-24">
        <div className="flex-1 min-h-0 flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
    </CameraProvider>
  )
}
