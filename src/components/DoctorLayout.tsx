import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { ClipboardList, Users, LogOut } from 'lucide-react'
import { useAppStore } from '@/store'

const sidebarItems = [
  { to: '/doctor', label: '今日挂号', icon: ClipboardList },
  { to: '/doctor/queue', label: '排队管理', icon: Users },
]

export default function DoctorLayout() {
  const { user, logout } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-surface border-b border-border sticky top-0 z-30 h-14 flex items-center justify-between px-4">
        <div className="font-display font-bold text-lg text-primary">
          🐾 宠医在线 · 医生端
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-light">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-text-light hover:text-primary transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        <aside className="w-56 bg-surface border-r border-border hidden md:flex flex-col">
          <nav className="flex-1 py-4">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-text-light hover:text-text hover:bg-background'
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
