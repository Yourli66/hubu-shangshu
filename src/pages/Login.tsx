import { useState } from 'react'

interface Props {
  onLogin: (password: string) => Promise<boolean>
  isFirstTime: boolean
}

export default function Login({ onLogin, isFirstTime }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (isFirstTime && password !== confirmPassword) { setError('两次密码不一致'); return }
    if (password.length < 4) { setError('密码至少4位'); return }
    setLoading(true)
    const ok = await onLogin(password)
    setLoading(false)
    if (!ok) setError('密码错误')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 bg-bg">
      <div className="w-full max-w-xs">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-bold text-text">户部尚书</h1>
          <p className="text-sm text-text-secondary mt-1">个人财务管理</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={isFirstTime ? '设置密码' : '输入密码'}
            className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-center text-base tracking-widest placeholder:tracking-normal placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            autoFocus
          />
          {isFirstTime && (
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="确认密码"
              className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-center text-base tracking-widest placeholder:tracking-normal placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          )}
          {error && <p className="text-expense text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '验证中...' : isFirstTime ? '开始使用' : '进入'}
          </button>
        </form>
        {isFirstTime && (
          <p className="text-text-tertiary text-xs text-center mt-6">首次使用，请设置登录密码</p>
        )}
      </div>
    </div>
  )
}
