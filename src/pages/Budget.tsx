import { useState, useEffect, useCallback } from 'react'
import { Trash2, Edit3, Check, ArrowDownWideNarrow, PenLine, X, Plus } from 'lucide-react'
import { getAllBudgets, addBudget, deleteBudget, getTransactionsByMonth, getAllCategories, addTransaction } from '../db'
import type { BudgetItem, Transaction, Category, PaymentChannel } from '../db/types'
import { CHANNEL_NAMES, CHANNEL_ICONS } from '../db/types'
import BudgetForm from '../components/BudgetForm'
import dayjs from 'dayjs'

type SortMode = 'amount-desc' | 'amount-asc' | 'name'

export default function Budget({ month }: { month: string }) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BudgetItem | undefined>()
  const [monthExpenses, setMonthExpenses] = useState<Record<string, number>>({})
  const [monthTxs, setMonthTxs] = useState<Transaction[]>([])
  const [catMap, setCatMap] = useState<Record<string, Category>>({})
  const [sortMode, setSortMode] = useState<SortMode>('amount-desc')
  const [quickAddId, setQuickAddId] = useState<string | null>(null)
  const [qaAmount, setQaAmount] = useState('')
  const [qaDesc, setQaDesc] = useState('')
  const [qaChannel, setQaChannel] = useState<PaymentChannel>('wechat')

  const load = useCallback(async () => {
    const [bgs, txs, cats] = await Promise.all([getAllBudgets(), getTransactionsByMonth(month), getAllCategories()])
    setBudgets(bgs)
    setMonthTxs(txs)
    const map: Record<string, Category> = {}; cats.forEach(c => { map[c.id] = c }); setCatMap(map)
    const exp: Record<string, number> = {}
    txs.filter((t: Transaction) => t.type === 'expense').forEach((t: Transaction) => { exp[t.categoryId] = (exp[t.categoryId] || 0) + t.amount })
    setMonthExpenses(exp)
  }, [month])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (item: BudgetItem) => { await addBudget(item); setShowForm(false); setEditing(undefined); await load() }
  const handleDelete = async (id: string) => { if (confirm('确定删除？')) { await deleteBudget(id); await load() } }

  const isFixedPaid = (item: BudgetItem) => {
    return monthTxs.some(t => t.type === 'expense' && t.categoryId === item.categoryId && t.description === `[固定] ${item.name}`)
  }

  const handlePayFixed = async (item: BudgetItem) => {
    if (isFixedPaid(item)) return
    const now = Date.now()
    await addTransaction({
      id: crypto.randomUUID(), type: 'expense', amount: item.amount, categoryId: item.categoryId,
      description: `[固定] ${item.name}`, date: dayjs(month).format('YYYY-MM') === dayjs().format('YYYY-MM') ? dayjs().format('YYYY-MM-DD') : `${month}-01`, channel: 'bank',
      createdAt: now, updatedAt: now,
    })
    await load()
  }

  const handleQuickAdd = async (item: BudgetItem) => {
    const amt = parseFloat(qaAmount)
    if (!amt || amt <= 0) return
    const now = Date.now()
    await addTransaction({
      id: crypto.randomUUID(), type: 'expense', amount: amt, categoryId: item.categoryId,
      description: qaDesc || item.name, date: dayjs(month).format('YYYY-MM') === dayjs().format('YYYY-MM') ? dayjs().format('YYYY-MM-DD') : `${month}-01`, channel: qaChannel,
      createdAt: now, updatedAt: now,
    })
    setQuickAddId(null); setQaAmount(''); setQaDesc(''); setQaChannel('wechat')
    await load()
  }

  const openQuickAdd = (id: string) => {
    setQuickAddId(quickAddId === id ? null : id)
    setQaAmount(''); setQaDesc(''); setQaChannel('wechat')
  }

  const sortFn = (a: BudgetItem, b: BudgetItem) => {
    if (sortMode === 'amount-desc') return b.amount - a.amount
    if (sortMode === 'amount-asc') return a.amount - b.amount
    return a.name.localeCompare(b.name, 'zh')
  }

  const fixedBudgets = budgets.filter(b => b.isFixed).sort(sortFn)
  const flexBudgets = budgets.filter(b => !b.isFixed).sort(sortFn)
  const totalFixed = fixedBudgets.reduce((s, b) => s + b.amount, 0)
  const totalFlex = flexBudgets.reduce((s, b) => s + b.amount, 0)
  const paidCount = fixedBudgets.filter(b => isFixedPaid(b)).length
  const totalFlexSpent = flexBudgets.reduce((s, b) => s + (monthExpenses[b.categoryId] || 0), 0)

  const cycleSortMode = () => {
    setSortMode(m => m === 'amount-desc' ? 'amount-asc' : m === 'amount-asc' ? 'name' : 'amount-desc')
  }
  const sortLabel = sortMode === 'amount-desc' ? '金额↓' : sortMode === 'amount-asc' ? '金额↑' : '名称'

  if (showForm) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <h2 className="text-base font-bold mb-5">{editing ? '编辑预算' : '新增预算'}</h2>
          <BudgetForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(undefined) }} />
        </div>
      </div>
    )
  }

  const renderFixedItem = (item: BudgetItem) => {
    const paid = isFixedPaid(item)
    const cat = catMap[item.categoryId]
    return (
      <div key={item.id} className="px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{cat?.icon || '📦'}</span>
            <span className={`text-sm font-medium ${paid ? 'text-text-tertiary line-through' : ''}`}>{item.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold">¥{item.amount.toFixed(0)}</span>
            {paid ? (
              <span className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-income/10 text-income text-[10px] font-semibold">
                <Check size={12} /> 已支付
              </span>
            ) : (
              <button onClick={() => handlePayFixed(item)}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-semibold hover:bg-primary-dark shadow-sm">
                <Check size={12} /> 支付
              </button>
            )}
            <button onClick={() => { setEditing(item); setShowForm(true) }} className="p-1 text-text-tertiary hover:text-primary rounded-lg hover:bg-bg-input"><Edit3 size={13} /></button>
            <button onClick={() => handleDelete(item.id)} className="p-1 text-text-tertiary hover:text-expense rounded-lg hover:bg-bg-input"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    )
  }

  const renderFlexItem = (item: BudgetItem) => {
    const spent = monthExpenses[item.categoryId] || 0
    const pct = item.amount > 0 ? Math.min((spent / item.amount) * 100, 100) : 0
    const over = spent > item.amount
    const cat = catMap[item.categoryId]
    const isOpen = quickAddId === item.id
    return (
      <div key={item.id} className="px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat?.icon || '📦'}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => openQuickAdd(item.id)}
              className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold ${isOpen ? 'bg-expense/10 text-expense' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
              {isOpen ? <X size={12} /> : <PenLine size={12} />}
              {isOpen ? '收起' : '记一笔'}
            </button>
            <button onClick={() => { setEditing(item); setShowForm(true) }} className="p-1 text-text-tertiary hover:text-primary rounded-lg hover:bg-bg-input"><Edit3 size={13} /></button>
            <button onClick={() => handleDelete(item.id)} className="p-1 text-text-tertiary hover:text-expense rounded-lg hover:bg-bg-input"><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="bg-bg-input rounded-full h-1.5 overflow-hidden mb-1.5">
          <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-expense' : pct > 70 ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-text-tertiary">
          <span className={over ? 'text-expense font-medium' : ''}>已用 ¥{spent.toFixed(0)}{over ? ' · 超支' : ''}</span>
          <span>预算 ¥{item.amount.toFixed(0)}</span>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-border space-y-2.5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">¥</span>
              <input type="number" step="0.01" min="0" value={qaAmount} onChange={e => setQaAmount(e.target.value)}
                placeholder="实际金额" autoFocus
                className="w-full bg-bg-input rounded-xl pl-8 pr-3 py-2.5 text-lg font-bold placeholder:text-text-tertiary placeholder:font-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <input value={qaDesc} onChange={e => setQaDesc(e.target.value)} placeholder="备注（可选）"
              className="w-full bg-bg-input rounded-xl px-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(CHANNEL_NAMES) as [PaymentChannel, string][]).map(([key, name]) => (
                <button key={key} type="button" onClick={() => setQaChannel(key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                    qaChannel === key ? 'bg-primary text-white shadow-sm' : 'bg-bg-input text-text-secondary'
                  }`}>
                  <span className="text-xs">{CHANNEL_ICONS[key]}</span>{name}
                </button>
              ))}
            </div>
            <button onClick={() => handleQuickAdd(item)}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark shadow-md shadow-primary/25">
              确认记账
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">预算</h1>
        <button onClick={() => { setEditing(undefined); setShowForm(true) }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm">
          <Plus size={14} /> 新增
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-[10px] text-text-tertiary mb-1">固定支出</p>
          <p className="text-xl font-bold">¥{totalFixed.toFixed(0)}</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">{paidCount}/{fixedBudgets.length} 已支付</p>
        </div>
        <div className="flex-1 bg-bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-[10px] text-text-tertiary mb-1">浮动预算</p>
          <p className="text-xl font-bold">¥{totalFlex.toFixed(0)}</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">已用 ¥{totalFlexSpent.toFixed(0)}</p>
        </div>
      </div>

      {fixedBudgets.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs text-text-secondary font-medium">固定支出</p>
            <button onClick={cycleSortMode} className="flex items-center gap-0.5 text-[10px] text-text-tertiary hover:text-primary">
              <ArrowDownWideNarrow size={12} /> {sortLabel}
            </button>
          </div>
          <div className="bg-bg-card rounded-2xl border border-border divide-y divide-border">{fixedBudgets.map(renderFixedItem)}</div>
        </div>
      )}
      {flexBudgets.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-text-secondary font-medium mb-2 px-1">浮动预算</p>
          <div className="bg-bg-card rounded-2xl border border-border divide-y divide-border">{flexBudgets.map(renderFlexItem)}</div>
        </div>
      )}
      {budgets.length === 0 && (
        <div className="bg-bg-card rounded-2xl border border-border py-16 text-center">
          <p className="text-text-tertiary text-sm">暂无预算</p>
          <p className="text-text-tertiary text-xs mt-1">点击底部「新增」添加</p>
        </div>
      )}
    </div>
  )
}
