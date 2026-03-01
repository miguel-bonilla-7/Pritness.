import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { WODsPage } from './pages/WODsPage'
import { ChatPage } from './pages/ChatPage'
import { ProfilePage } from './pages/ProfilePage'
import { useAuth } from './context/AuthContext'
import { useUser } from './context/UserContext'
import { PageSpinner } from './components/PageSpinner'

function RequireSession() {
  const { session, loading, configured } = useAuth()

  if (!configured) return <Navigate to="/login" replace />
  if (loading) {
    return <PageSpinner />
  }
  if (!session) {
    console.debug('[Pritness Routes] Sin sesión, redirigiendo a /login')
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function RedirectToApp() {
  const { profileFromDb, profileLoading, loading } = useAuth()
  const { profile } = useUser()
  const hasProfile = Boolean(profile ?? profileFromDb)

  if (loading || profileLoading) return <PageSpinner />
  if (!hasProfile) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profileFromDb, profileLoading, loading } = useAuth()
  const { profile } = useUser()
  const hasProfile = Boolean(profile ?? profileFromDb)

  if (loading || profileLoading) return <PageSpinner />
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
          <Route path="trends" element={<Navigate to="/wods" replace />} />
          <Route path="wods" element={<WODsPage />} />
          <Route path="camera" element={<Navigate to="/dashboard" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export { AppRoutes }
