import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Receipt, Wallet, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '总览' },
  { to: '/records', icon: Receipt, label: '记账' },
  { to: '/budget', icon: Wallet, label: '预算' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Layout() {
  return (
    <div className="w-full max-w-[520px] min-h-[100dvh] flex flex-col bg-bg mx-auto shadow-2xl relative">
      {/* Header */}
      <header className="bg-bg-nav backdrop-blur-nav border-b border-border sticky top-0 z-40">
        <div className="px-5 py-3 flex items-center justify-center">
          <h1 className="text-[17px] font-semibold text-text">户部尚书</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="absolute bottom-0 left-0 right-0 bg-bg-nav backdrop-blur-nav border-t border-border pb-safe z-50">
        <div className="flex justify-around items-center">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center pt-2 pb-1 px-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-text-tertiary'
                }`
              }
            >
              <Icon size={24} />
              <span className="mt-0.5 text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
