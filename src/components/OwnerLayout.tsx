import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Heart, Calendar, User, LogOut } from 'lucide-react'
import { useAppStore } from '@/store'

const navItems = [
  { to: '/pets', label: '宠物档案', icon: Heart },
  { to: '/appointment', label: '在线挂号', icon: Calendar },
  { to: '/profile', label: '个人中心', icon: User },
]

export default function OwnerLayout() {
  const { user, logout } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-display font-bold text-lg text-primary">
            🐾 宠医在线
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-light hover:text-text hover:bg-background'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-text-light">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-text-light hover:text-primary transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-text-light'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
