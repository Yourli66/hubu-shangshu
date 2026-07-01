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

    if (isFirstTime && password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }
    if (password.length < 4) {
      setError('密码至少4位')
      return
    }

    setLoading(true)
    const ok = await onLogin(password)
    setLoading(false)
    if (!ok) setError('密码错误')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-bg w-full max-w-[520px] mx-auto shadow-2xl">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-[22px] flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏛️</span>
          </div>
          <h1 className="text-[28px] font-bold text-text tracking-tight">户部尚书</h1>
          <p className="text-[15px] text-text-secondary mt-1">个人财务管理</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={isFirstTime ? '设置密码' : '输入密码'}
            className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3.5 text-center text-[17px] tracking-[0.3em] text-text placeholder:text-text-tertiary placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            autoFocus
          />

          {isFirstTime && (
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="确认密码"
              className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3.5 text-center text-[17px] tracking-[0.3em] text-text placeholder:text-text-tertiary placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          )}

          {error && (
            <p className="text-expense text-[14px] text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-2xl text-[17px] font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? '验证中...' : isFirstTime ? '开始使用' : '进入'}
          </button>
        </form>

        {isFirstTime && (
          <p className="text-text-tertiary text-[13px] text-center mt-5">
            首次使用，请设置登录密码
          </p>
        )}
      </div>
    </div>
  )
}
