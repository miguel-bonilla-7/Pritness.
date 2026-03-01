import { House, Dumbbell, Camera, MessageCircle, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useCamera } from '../context/CameraContext'

const navItems = [
  { to: '/dashboard', icon: House, label: 'Home' },
  { to: '/wods', icon: Dumbbell, label: 'WODs' },
  { central: true as const },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const { triggerCamera } = useCamera()

  return (
    <nav className="fixed left-0 right-0 bottom-0 bg-card rounded-t-3xl shadow-card-glow z-50 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, i) => {
          if ('central' in item && item.central) {
            return (
              <button
                key="camera"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  triggerCamera()
                }}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-colors text-white flex-[0_0_64px] -mt-6"
                aria-label="Abrir cámara"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-black shadow-lg">
                  <Camera className="w-7 h-7" />
                </span>
                <span className="text-[10px] font-medium">Cámara</span>
              </button>
            )
          }
          const { to, icon: Icon, label } = item as { to: string; icon: typeof LayoutDashboard; label: string }
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-colors ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
