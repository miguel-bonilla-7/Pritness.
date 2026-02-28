import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { OfflineBanner } from '../components/OfflineBanner'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-app flex flex-col">
      <OfflineBanner />
      <header className="bg-app border-b border-white/5 px-4 py-3 safe-top">
        <h1 className="text-lg font-bold text-white">Pritness</h1>
      </header>
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
