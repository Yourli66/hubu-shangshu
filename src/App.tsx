import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from './db'
import Layout, { type TabId } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Budget from './pages/Budget'
import SettingsPage from './pages/SettingsPage'
import Login from './pages/Login'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('/')

  useEffect(() => {
    getSettings().then(s => {
      setIsFirstTime(!s)
      setLoading(false)
    })
  }, [])

  const handleLogin = async (password: string): Promise<boolean> => {
    const hash = await hashPassword(password)
    if (isFirstTime) {
      await saveSettings({ id: 'main', passwordHash: hash, currency: 'CNY', createdAt: Date.now() })
      setIsFirstTime(false)
      setAuthed(true)
      return true
    }
    const settings = await getSettings()
    if (settings && settings.passwordHash === hash) {
      setAuthed(true)
      return true
    }
    return false
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="text-primary text-lg font-medium">加载中...</div>
      </div>
    )
  }

  if (!authed) {
    return <Login onLogin={handleLogin} isFirstTime={isFirstTime} />
  }

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {tab === '/' && <Dashboard />}
      {tab === '/records' && <Records />}
      {tab === '/budget' && <Budget />}
      {tab === '/settings' && <SettingsPage onLogout={() => setAuthed(false)} />}
    </Layout>
  )
}
