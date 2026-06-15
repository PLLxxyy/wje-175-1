import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Calendar, Settings, LogOut } from 'lucide-react'
import { useAppStore } from '@/store'

const sidebarItems = [
  { to: '/admin', label: '数据概览', icon: BarChart3 },
  { to: '/admin/schedule', label: '排班管理', icon: Calendar },
  { to: '/admin/settings', label: '号源设置', icon: Settings },
]

export default function AdminLayout() {
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
          🐾 宠医在线 · 管理后台
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
                end={item.to === '/admin'}
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
