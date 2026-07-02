import { useState, useEffect } from 'react'
import { Download, Upload, Trash2, ChevronRight, Tags, Plus, X } from 'lucide-react'
import { getAllCategories, addCategory, deleteCategory, getAllBudgets, addBudget, addTransaction, getTransactionsByDateRange } from '../db'
import { supabase } from '../db/supabase'
import type { Category, TransactionType } from '../db/types'

const EMOJIS = ['🍜','🚇','🛒','🏠','💡','🎮','💊','📚','📱','🛡️','📦','💰','🎁','📈','💼','✨','🎬','🏋️','☕','🍺','👕','💇','🧹','🚗','✈️','🎂','💐','🔧','🐱','🎵']

export default function SettingsPage() {
  const [msg, setMsg] = useState('')
  const [showCats, setShowCats] = useState(false)
  const [cats, setCats] = useState<Category[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('📦')
  const [addType, setAddType] = useState<TransactionType>('expense')

  useEffect(() => { loadCats() }, [])
  const loadCats = async () => setCats(await getAllCategories())
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  const handleAddCat = async () => {
    if (!addName.trim()) { flash('请输入名称'); return }
    await addCategory({ id: `cat_${Date.now()}`, name: addName.trim(), type: addType, icon: addIcon, sortOrder: 50, createdAt: Date.now() })
    setAddName(''); setAddIcon('📦'); setShowAdd(false); await loadCats(); flash('已添加')
  }

  const handleDelCat = async (c: Category) => {
    if (!confirm(`删除「${c.name}」？`)) return
    await deleteCategory(c.id); await loadCats()
  }

  const handleExport = async () => {
    try {
      const [txs, budgets, categories] = await Promise.all([
        getTransactionsByDateRange('2000-01-01', '2099-12-31'),
        getAllBudgets(),
        getAllCategories(),
      ])
      const data = { transactions: txs, budgets, categories, exportedAt: new Date().toISOString() }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)]))
      a.download = `hubu-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      flash('已导出')
    } catch { flash('导出失败') }
  }

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      try {
        const data = JSON.parse(await file.text())
        let count = 0
        if (data.categories) { for (const c of data.categories) { await addCategory(c); count++ } }
        if (data.budgets) { for (const b of data.budgets) { await addBudget(b); count++ } }
        if (data.transactions) { for (const t of data.transactions) { await addTransaction(t); count++ } }
        await loadCats(); flash(`已导入 ${count} 条`)
      } catch { flash('导入失败') }
    }; input.click()
  }

  const handleClear = async () => {
    if (!confirm('确定清除所有数据？不可恢复！')) return
    if (!confirm('建议先导出备份！确认清除？')) return
    try {
      await supabase.from('finance_transactions').delete().neq('id', '')
      await supabase.from('finance_budgets').delete().neq('id', '')
      flash('已清除')
    } catch { flash('清除失败') }
  }

  const expCats = cats.filter(c => c.type === 'expense')
  const incCats = cats.filter(c => c.type === 'income')

  const row = (icon: React.ReactNode, label: string, sub: string | undefined, onClick: () => void, danger?: boolean) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-input/60 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-bg-input flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 text-left">
        <p className={`text-sm ${danger ? 'text-expense' : ''}`}>{label}</p>
        {sub && <p className="text-[10px] text-text-tertiary">{sub}</p>}
      </div>
      <ChevronRight size={14} className="text-text-tertiary" />
    </button>
  )

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-bold">设置</h1>

      {msg && <div className="bg-primary/10 rounded-xl px-4 py-2.5 text-sm text-primary font-medium text-center">{msg}</div>}

      {/* 分类管理 */}
      <div>
        <p className="text-xs text-text-secondary font-medium mb-2 px-1">分类管理</p>
        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
          {row(<Tags size={15} className="text-primary" />, '自定义分类', `${cats.length} 个`, () => setShowCats(!showCats))}
          {showCats && (
            <div className="border-t border-border px-4 py-3 space-y-4">
              {showAdd ? (
                <div className="space-y-3">
                  <div className="flex bg-bg-input rounded-lg p-0.5">
                    {(['expense', 'income'] as const).map(t => (
                      <button key={t} onClick={() => setAddType(t)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium ${addType === t ? 'bg-bg-card shadow-sm' : 'text-text-tertiary'}`}>
                        {t === 'expense' ? '支出' : '收入'}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setAddIcon(e)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${addIcon === e ? 'bg-primary text-white ring-2 ring-primary/30' : 'bg-bg-input'}`}>{e}</button>
                    ))}
                  </div>
                  <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="分类名称" autoFocus
                    className="w-full bg-bg-input rounded-lg px-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg bg-bg-input text-xs font-medium">取消</button>
                    <button onClick={handleAddCat} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold">添加</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAdd(true)}
                  className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-primary font-medium flex items-center justify-center gap-1 hover:bg-bg-input">
                  <Plus size={14} /> 添加新分类
                </button>
              )}

              {expCats.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-tertiary mb-1">支出</p>
                  {expCats.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm"><span className="mr-2">{c.icon}</span>{c.name}</span>
                      <button onClick={() => handleDelCat(c)} className="p-1 text-text-tertiary hover:text-expense"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
              {incCats.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-tertiary mb-1">收入</p>
                  {incCats.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm"><span className="mr-2">{c.icon}</span>{c.name}</span>
                      <button onClick={() => handleDelCat(c)} className="p-1 text-text-tertiary hover:text-expense"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 数据 */}
      <div>
        <p className="text-xs text-text-secondary font-medium mb-2 px-1">数据</p>
        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {row(<Download size={15} className="text-income" />, '导出数据', '备份为 JSON', handleExport)}
          {row(<Upload size={15} className="text-primary" />, '导入数据', '从备份恢复', handleImport)}
          {row(<Trash2 size={15} className="text-expense" />, '清除数据', '不可恢复', handleClear, true)}
        </div>
      </div>

      <p className="text-center text-[10px] text-text-tertiary pt-2 pb-4">户部尚书 v1.0 · 数据云端同步</p>
    </div>
  )
}
