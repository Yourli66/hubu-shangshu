import { useState, useEffect } from 'react'
import { supabase } from './db/supabase'
import type { Session } from '@supabase/supabase-js'
import Layout, { type TabId } from './components/Layout'
import AuthPage from './components/AuthPage'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Budget from './pages/Budget'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('/')
  const [actionTrigger, setActionTrigger] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="text-primary text-sm">加载中...</div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage onAuthed={() => {}} />
  }

  return (
    <Layout activeTab={tab} onTabChange={setTab} email={session.user.email ?? ''} onAction={() => setActionTrigger(n => n + 1)}>
      {tab === '/' && <Dashboard />}
      {tab === '/records' && <Records actionTrigger={actionTrigger} />}
      {tab === '/budget' && <Budget actionTrigger={actionTrigger} />}
      {tab === '/settings' && <SettingsPage />}
    </Layout>
  )
}
