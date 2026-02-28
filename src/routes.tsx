import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { TrendsPage } from './pages/TrendsPage'
import { CameraPage } from './pages/CameraPage'
import { ChatPage } from './pages/ChatPage'
import { ProfilePage } from './pages/ProfilePage'
import { useAuth } from './context/AuthContext'
import { useUser } from './context/UserContext'

function RequireSession() {
  const { session, loading, configured } = useAuth()

  if (!configured) return <Navigate to="/login" replace />
  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-gray-400">Comprobando sesión...</p>
      </div>
    )
  }
  if (!session) {
    console.debug('[Pritness Routes] Sin sesión, redirigiendo a /login')
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function RedirectToApp() {
  const { profileFromDb, profileLoading } = useAuth()
  const { profile } = useUser()
  const hasProfile = Boolean(profile ?? profileFromDb)

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    )
  }
  if (!hasProfile) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profileFromDb, profileLoading } = useAuth()
  const { profile } = useUser()
  const hasProfile = Boolean(profile ?? profileFromDb)

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    )
  }
  if (!hasProfile) {
    console.debug('[Pritness Routes] Sin perfil, redirigiendo a /onboarding')
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<RequireSession />}>
        <Route index element={<RedirectToApp />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route element={<RequireProfile><MainLayout /></RequireProfile>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="camera" element={<CameraPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export { AppRoutes }
