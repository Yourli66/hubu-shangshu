import { useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { LayoutDashboard, Receipt, Wallet, Settings, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import AccountPanel from './AccountPanel'
import MonthPicker from './MonthPicker'

const tabs = [
  { id: '/', label: '总览', icon: LayoutDashboard },
  { id: '/records', label: '记账', icon: Receipt },
  { id: '/budget', label: '预算', icon: Wallet },
  { id: '/settings', label: '设置', icon: Settings },
] as const

export type TabId = (typeof tabs)[number]['id']

// centerLabels removed — month selector is always shown in center

export default function Layout({
  activeTab,
  onTabChange,
  email,
  month,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  children,
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  email: string
  onAction?: () => void
  month?: string
  onPrevMonth?: () => void
  onNextMonth?: () => void
  onSelectMonth?: (month: string) => void
  children: ReactNode
}) {
  const [showAccount, setShowAccount] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

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

          {month ? (
            <div className="flex items-center gap-1 py-2">
              <button onClick={onPrevMonth} className="p-1 rounded-lg hover:bg-bg-input">
                <ChevronLeft size={16} className="text-text-secondary" />
              </button>
              <button onClick={() => setShowMonthPicker(true)}
                className="text-xs font-semibold text-text-secondary min-w-[60px] text-center px-1.5 py-1 rounded-lg hover:bg-bg-input active:bg-primary/10">
                {dayjs(month).format('YYYY.MM')}
              </button>
              <button onClick={onNextMonth} className="p-1 rounded-lg hover:bg-bg-input">
                <ChevronRight size={16} className="text-text-secondary" />
              </button>
            </div>
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
      {showMonthPicker && month && (
        <MonthPicker
          current={month}
          onSelect={(m) => { if (onSelectMonth) onSelectMonth(m) }}
          onClose={() => setShowMonthPicker(false)}
        />
      )}
    </div>
  )
}
