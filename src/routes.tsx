import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { WODsPage } from './pages/WODsPage'
import { ChatPage } from './pages/ChatPage'
import { ProfilePage } from './pages/ProfilePage'
import { useAuth } from './context/AuthContext'
import { PageSpinner } from './components/PageSpinner'

function RequireSession() {
  const { session, loading, configured } = useAuth()

  if (!configured) return <Navigate to="/login" replace />
  if (loading) return <PageSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<RequireSession />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="onboarding" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
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
