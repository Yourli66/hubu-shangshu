import { useState } from 'react'
import { supabase } from '../db/supabase'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthPage({ onAuthed }: { onAuthed: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      onAuthed()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败'
      if (msg.includes('Invalid login')) setError('邮箱或密码错误')
      else if (msg.includes('already registered')) setError('该邮箱已注册，请直接登录')
      else if (msg.includes('valid email')) setError('请输入有效的邮箱地址')
      else if (msg.includes('at least')) setError('密码至少6位')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-text mb-1">
          户部尚书
        </h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          个人财务管理
        </p>

        <div className="flex bg-bg-input rounded-xl p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLogin ? 'bg-bg-card text-text shadow-sm' : 'text-text-secondary'
            }`}
          >
            <LogIn size={16} />
            登录
          </button>
          <button
            onClick={() => { setIsLogin(false); setError('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isLogin ? 'bg-bg-card text-text shadow-sm' : 'text-text-secondary'
            }`}
          >
            <UserPlus size={16} />
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            required
            className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少6位）"
            required
            minLength={6}
            className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary"
          />

          {error && (
            <p className="text-xs text-expense text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? '请稍候...' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <p className="text-[10px] text-text-tertiary text-center mt-6">
          {isLogin ? '没有账号？点上方「注册」' : '已有账号？点上方「登录」'}
        </p>
        <p className="text-[10px] text-text-tertiary text-center mt-2">
          与「大脑」共享账号
        </p>
      </div>
    </div>
  )
}
