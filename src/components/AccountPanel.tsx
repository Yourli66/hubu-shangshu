import { useState } from 'react'
import { supabase } from '../db/supabase'
import { X, LogOut, KeyRound } from 'lucide-react'

export default function AccountPanel({ email, onClose }: { email: string; onClose: () => void }) {
  const [showPwForm, setShowPwForm] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw.length < 6) { setMsg('密码至少6位'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) setMsg(error.message)
    else { setMsg('密码已修改'); setNewPw(''); setShowPwForm(false) }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-bg-card w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">账号设置</h2>
          <button onClick={onClose} className="text-text-tertiary">
            <X size={20} />
          </button>
        </div>

        <div className="bg-bg-input rounded-xl px-4 py-3 mb-4">
          <div className="text-[10px] text-text-tertiary">当前账号</div>
          <div className="text-sm text-text font-medium">{email}</div>
        </div>

        {!showPwForm ? (
          <div className="space-y-2">
            <button
              onClick={() => setShowPwForm(true)}
              className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left"
            >
              <KeyRound size={18} className="text-primary" />
              <span className="text-sm text-text">修改密码</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left"
            >
              <LogOut size={18} className="text-expense" />
              <span className="text-sm text-expense">退出登录</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePw} className="space-y-3">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="输入新密码（至少6位）"
              minLength={6}
              required
              className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowPwForm(false); setMsg('') }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm text-text-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-primary text-white py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {loading ? '...' : '确认修改'}
              </button>
            </div>
          </form>
        )}

        {msg && <p className="text-xs text-center mt-3 text-primary">{msg}</p>}
      </div>
    </div>
  )
}
