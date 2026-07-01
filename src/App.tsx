import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { getSettings, saveSettings } from './db'
import type { AppSettings } from './db/types'
import Layout from './components/Layout'
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

  useEffect(() => {
    getSettings().then(s => {
      setIsFirstTime(!s)
      setLoading(false)
    })
  }, [])

  const handleLogin = async (password: string): Promise<boolean> => {
    const hash = await hashPassword(password)

    if (isFirstTime) {
      // 首次使用，保存密码
      const settings: AppSettings = {
        id: 'main',
        passwordHash: hash,
        currency: 'CNY',
        createdAt: Date.now(),
      }
      await saveSettings(settings)
      setIsFirstTime(false)
      setAuthed(true)
      return true
    }

    // 验证密码
    const settings = await getSettings()
    if (settings && settings.passwordHash === hash) {
      setAuthed(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    setAuthed(false)
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="text-primary-light text-lg">加载中...</div>
      </div>
    )
  }

  if (!authed) {
    return <Login onLogin={handleLogin} isFirstTime={isFirstTime} />
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/records" element={<Records />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
