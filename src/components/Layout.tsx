import { type ReactNode } from 'react'
import { LayoutDashboard, Receipt, Wallet, Settings } from 'lucide-react'

const tabs = [
  { id: '/', label: '总览', icon: LayoutDashboard },
  { id: '/records', label: '记账', icon: Receipt },
  { id: '/budget', label: '预算', icon: Wallet },
  { id: '/settings', label: '设置', icon: Settings },
] as const

export type TabId = (typeof tabs)[number]['id']

export default function Layout({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-nav backdrop-blur-lg border-t border-border safe-area-pb">
        <div className="flex justify-around max-w-lg mx-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
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
    </div>
  )
}
