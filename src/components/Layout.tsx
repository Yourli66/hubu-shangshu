import { useState, type ReactNode } from 'react'
import { LayoutDashboard, Receipt, Wallet, Settings, UserCircle, Plus } from 'lucide-react'
import AccountPanel from './AccountPanel'

const tabs = [
  { id: '/', label: '总览', icon: LayoutDashboard },
  { id: '/records', label: '记账', icon: Receipt },
  { id: '/budget', label: '预算', icon: Wallet },
  { id: '/settings', label: '设置', icon: Settings },
] as const

export type TabId = (typeof tabs)[number]['id']

const centerLabels: Partial<Record<TabId, string>> = {
  '/records': '记一笔',
  '/budget': '新增',
}

export default function Layout({
  activeTab,
  onTabChange,
  email,
  onAction,
  children,
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  email: string
  onAction?: () => void
  children: ReactNode
}) {
  const [showAccount, setShowAccount] = useState(false)
  const centerLabel = centerLabels[activeTab]

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      <header className="fixed top-0 right-0 z-40 px-4 pt-3 pointer-events-none">
        <button
          onClick={() => setShowAccount(true)}
          className="w-8 h-8 rounded-full bg-bg-card border border-border flex items-center justify-center shadow-sm pointer-events-auto"
        >
          <UserCircle size={20} className="text-text-secondary" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-nav backdrop-blur-lg border-t border-border safe-area-pb">
        <div className="flex justify-around items-end max-w-lg mx-auto">
          {tabs.slice(0, 2).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                activeTab === id ? 'text-primary' : 'text-text-tertiary'
              }`}
            >
              <Icon size={22} strokeWidth={activeTab === id ? 2.2 : 1.8} />
              <span className="text-[10px] mt-0.5 font-medium">{label}</span>
            </button>
          ))}

          {centerLabel ? (
            <button
              onClick={onAction}
              className="relative -top-3 flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                <Plus size={26} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] mt-0.5 font-medium text-primary">{centerLabel}</span>
            </button>
          ) : (
            <div className="w-12 py-2" />
          )}

          {tabs.slice(2).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                activeTab === id ? 'text-primary' : 'text-text-tertiary'
              }`}
            >
              <Icon size={22} strokeWidth={activeTab === id ? 2.2 : 1.8} />
              <span className="text-[10px] mt-0.5 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showAccount && (
        <AccountPanel email={email} onClose={() => setShowAccount(false)} />
      )}
    </div>
  )
}
