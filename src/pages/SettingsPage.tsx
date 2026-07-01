import { useState, useEffect } from 'react'
import { Shield, Download, Upload, Trash2, ChevronRight, Tags, Plus, X } from 'lucide-react'
import { getSettings, saveSettings, getAllCategories, addCategory, deleteCategory } from '../db'
import type { AppSettings, Category, TransactionType } from '../db/types'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

interface Props {
  onLogout: () => void
}

const EMOJI_OPTIONS = ['🍜','🚇','🛒','🏠','💡','🎮','💊','📚','📱','🛡️','📦','💰','🎁','📈','💼','✨','🎬','🏋️','🐱','🎵','☕','🍺','👕','💇','🧹','🚗','✈️','🎂','💐','🔧']

export default function SettingsPage({ onLogout }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [message, setMessage] = useState('')

  // 分类管理
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📦')
  const [newCatType, setNewCatType] = useState<TransactionType>('expense')

  useEffect(() => {
    getSettings().then(s => setSettings(s ?? null))
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setCategories(await getAllCategories())
  }

  const showMsg = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 4) { showMsg('密码至少4位'); return }
    const hash = await hashPassword(newPassword)
    const updated: AppSettings = { id: 'main', passwordHash: hash, currency: 'CNY', createdAt: settings?.createdAt ?? Date.now() }
    await saveSettings(updated)
    setSettings(updated)
    setNewPassword('')
    setShowPasswordForm(false)
    showMsg('密码已更新')
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) { showMsg('请输入分类名称'); return }
    await addCategory({
      id: `cat_custom_${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
      icon: newCatIcon,
      sortOrder: 50,
      createdAt: Date.now(),
    })
    setNewCatName('')
    setNewCatIcon('📦')
    setShowAddForm(false)
    await loadCategories()
    showMsg('分类已添加')
  }

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`确定删除「${cat.name}」分类吗？`)) return
    await deleteCategory(cat.id)
    await loadCategories()
    showMsg('分类已删除')
  }

  const handleExport = async () => {
    const { openDB } = await import('idb')
    const db = await openDB('hubu-shangshu', 2)
    const data = {
      transactions: await db.getAll('transactions'),
      budgets: await db.getAll('budgets'),
      categories: await db.getAll('categories'),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hubu-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMsg('数据已导出')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const { openDB } = await import('idb')
        const db = await openDB('hubu-shangshu', 2)
        for (const store of ['transactions', 'budgets', 'categories'] as const) {
          if (data[store]) {
            const tx = db.transaction(store, 'readwrite')
            for (const item of data[store]) await tx.store.put(item)
            await tx.done
          }
        }
        await loadCategories()
        showMsg(`已导入 ${data.transactions?.length || 0} 条记录`)
      } catch {
        showMsg('导入失败，请检查文件格式')
      }
    }
    input.click()
  }

  const handleClearAll = async () => {
    if (!confirm('确定清除所有数据吗？此操作不可恢复！')) return
    if (!confirm('真的要清除吗？建议先导出备份！')) return
    const { openDB } = await import('idb')
    const db = await openDB('hubu-shangshu', 2)
    await db.clear('transactions')
    await db.clear('budgets')
    showMsg('数据已清除')
  }

  const expenseCats = categories.filter(c => c.type === 'expense')
  const incomeCats = categories.filter(c => c.type === 'income')

  return (
    <div className="px-4 py-6 space-y-6">
      <h2 className="text-[20px] font-bold">设置</h2>

      {message && (
        <div className="bg-income/10 border border-income/20 rounded-2xl px-4 py-3 text-[14px] text-income font-medium text-center">
          {message}
        </div>
      )}

      {/* 分类管理 */}
      <div>
        <h3 className="text-[13px] font-medium text-text-secondary mb-2.5 px-1">分类管理</h3>
        <div className="bg-bg-card rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-bg-input/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-warning/10 rounded-xl flex items-center justify-center">
                <Tags size={17} className="text-warning" />
              </div>
              <div className="text-left">
                <p className="text-[15px]">自定义分类</p>
                <p className="text-[12px] text-text-secondary">管理收支分类（{categories.length}个）</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-text-tertiary transition-transform ${showCategoryManager ? 'rotate-90' : ''}`} />
          </button>

          {showCategoryManager && (
            <div className="border-t border-border">
              {/* 新增按钮 */}
              <div className="px-4 py-3">
                {showAddForm ? (
                  <div className="space-y-4">
                    {/* 类型选择 */}
                    <div className="flex bg-bg-input rounded-[10px] p-[3px]">
                      {(['expense', 'income'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setNewCatType(t)}
                          className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition-all ${
                            newCatType === t ? 'bg-bg-card shadow-sm text-text' : 'text-text-secondary'
                          }`}
                        >
                          {t === 'expense' ? '支出' : '收入'}
                        </button>
                      ))}
                    </div>

                    {/* 图标选择 */}
                    <div>
                      <p className="text-[12px] text-text-secondary mb-2">选择图标</p>
                      <div className="flex flex-wrap gap-2">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button key={emoji} type="button" onClick={() => setNewCatIcon(emoji)}
                            className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                              newCatIcon === emoji ? 'bg-primary text-white shadow-md scale-110' : 'bg-bg-input hover:bg-border'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 名称 */}
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="分类名称"
                      className="w-full bg-bg-input rounded-xl px-4 py-3 text-[15px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      autoFocus
                    />

                    <div className="flex gap-3">
                      <button onClick={() => setShowAddForm(false)}
                        className="flex-1 py-2.5 rounded-xl bg-bg-input text-text text-[14px] font-medium"
                      >
                        取消
                      </button>
                      <button onClick={handleAddCategory}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[14px] font-semibold"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-[14px] text-primary font-medium hover:bg-bg-input"
                  >
                    <Plus size={16} /> 添加新分类
                  </button>
                )}
              </div>

              {/* 支出分类 */}
              <div className="px-4 pb-2">
                <p className="text-[12px] text-text-secondary mb-2">支出分类</p>
                <div className="space-y-1">
                  {expenseCats.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-bg-input">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-[14px]">{cat.name}</span>
                      </div>
                      <button onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-text-tertiary hover:text-expense rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 收入分类 */}
              <div className="px-4 pb-4">
                <p className="text-[12px] text-text-secondary mb-2">收入分类</p>
                <div className="space-y-1">
                  {incomeCats.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-bg-input">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-[14px]">{cat.name}</span>
                      </div>
                      <button onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-text-tertiary hover:text-expense rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 安全 */}
      <div>
        <h3 className="text-[13px] font-medium text-text-secondary mb-2.5 px-1">安全</h3>
        <div className="bg-bg-card rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-bg-input/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield size={17} className="text-primary" />
              </div>
              <span className="text-[15px]">修改密码</span>
            </div>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
          {showPasswordForm && (
            <div className="px-4 pb-4 border-t border-border">
              <div className="flex gap-2 mt-4">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="输入新密码..."
                  className="flex-1 bg-bg-input rounded-xl px-4 py-3 text-[15px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={handleChangePassword}
                  className="px-5 py-3 bg-primary text-white rounded-xl text-[14px] font-semibold"
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 数据 */}
      <div>
        <h3 className="text-[13px] font-medium text-text-secondary mb-2.5 px-1">数据</h3>
        <div className="bg-bg-card rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
          <button onClick={handleExport} className="w-full flex items-center justify-between px-4 py-4 hover:bg-bg-input/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-income/10 rounded-xl flex items-center justify-center">
                <Download size={17} className="text-income" />
              </div>
              <div className="text-left">
                <p className="text-[15px]">导出数据</p>
                <p className="text-[12px] text-text-secondary">备份为 JSON 文件</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
          <button onClick={handleImport} className="w-full flex items-center justify-between px-4 py-4 hover:bg-bg-input/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <Upload size={17} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-[15px]">导入数据</p>
                <p className="text-[12px] text-text-secondary">从备份文件恢复</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
          <button onClick={handleClearAll} className="w-full flex items-center justify-between px-4 py-4 hover:bg-bg-input/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-expense/10 rounded-xl flex items-center justify-center">
                <Trash2 size={17} className="text-expense" />
              </div>
              <div className="text-left">
                <p className="text-[15px] text-expense">清除所有数据</p>
                <p className="text-[12px] text-text-secondary">不可恢复，请先备份</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        </div>
      </div>

      <button onClick={onLogout}
        className="w-full py-3.5 bg-bg-card rounded-2xl text-[15px] text-expense font-medium hover:bg-bg-input shadow-sm"
      >
        退出登录
      </button>

      <div className="text-center text-[12px] text-text-tertiary pt-2 pb-6">
        <p>户部尚书 v1.0</p>
        <p className="mt-1">数据存储于本地浏览器</p>
      </div>
    </div>
  )
}
