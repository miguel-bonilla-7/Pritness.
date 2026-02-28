import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { SyncProfileToUser } from './context/SyncProfileToUser'
import { DailyLogProvider } from './context/DailyLogContext'
import { AppRoutes } from './routes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <SyncProfileToUser />
          <DailyLogProvider>
            <AppRoutes />
          </DailyLogProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
