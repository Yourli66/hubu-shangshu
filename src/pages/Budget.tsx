import { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Edit3, Check, ArrowDownWideNarrow } from 'lucide-react'
import { getAllBudgets, addBudget, deleteBudget, getTransactionsByMonth, getAllCategories, addTransaction } from '../db'
import type { BudgetItem, Transaction, Category } from '../db/types'
import BudgetForm from '../components/BudgetForm'
import dayjs from 'dayjs'

type SortMode = 'amount-desc' | 'amount-asc' | 'name'

export default function Budget({ actionTrigger }: { actionTrigger: number }) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BudgetItem | undefined>()
  const [monthExpenses, setMonthExpenses] = useState<Record<string, number>>({})
  const [monthTxs, setMonthTxs] = useState<Transaction[]>([])
  const [catMap, setCatMap] = useState<Record<string, Category>>({})
  const [sortMode, setSortMode] = useState<SortMode>('amount-desc')
  const prevTrigger = useRef(actionTrigger)

  useEffect(() => {
    if (actionTrigger !== prevTrigger.current) {
      prevTrigger.current = actionTrigger
      setEditing(undefined)
      setShowForm(true)
    }
  }, [actionTrigger])

  const load = useCallback(async () => {
    const curMonth = dayjs().format('YYYY-MM')
    const [bgs, txs, cats] = await Promise.all([getAllBudgets(), getTransactionsByMonth(curMonth), getAllCategories()])
    setBudgets(bgs)
    setMonthTxs(txs)
    const map: Record<string, Category> = {}; cats.forEach(c => { map[c.id] = c }); setCatMap(map)
    const exp: Record<string, number> = {}
    txs.filter((t: Transaction) => t.type === 'expense').forEach((t: Transaction) => { exp[t.categoryId] = (exp[t.categoryId] || 0) + t.amount })
    setMonthExpenses(exp)
  }, [])

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
      id: crypto.randomUUID(),
      type: 'expense',
      amount: item.amount,
      categoryId: item.categoryId,
      description: `[固定] ${item.name}`,
      date: dayjs().format('YYYY-MM-DD'),
      channel: 'bank',
      createdAt: now,
      updatedAt: now,
    })
    await load()
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
                <Check size={12} /> 标记支付
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
    return (
      <div key={item.id} className="px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat?.icon || '📦'}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          <div className="flex gap-0.5">
            <button onClick={() => { setEditing(item); setShowForm(true) }} className="p-1.5 text-text-tertiary hover:text-primary rounded-lg hover:bg-bg-input"><Edit3 size={13} /></button>
            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-text-tertiary hover:text-expense rounded-lg hover:bg-bg-input"><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="bg-bg-input rounded-full h-1.5 overflow-hidden mb-1.5">
          <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-expense' : pct > 70 ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-text-tertiary">
          <span className={over ? 'text-expense font-medium' : ''}>已用 ¥{spent.toFixed(0)}{over ? ' · 超支' : ''}</span>
          <span>¥{item.amount.toFixed(0)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold mb-5">预算</h1>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-[10px] text-text-tertiary mb-1">固定支出</p>
          <p className="text-xl font-bold">¥{totalFixed.toFixed(0)}</p>
        </div>
        <div className="flex-1 bg-bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-[10px] text-text-tertiary mb-1">浮动预算</p>
          <p className="text-xl font-bold">¥{totalFlex.toFixed(0)}</p>
        </div>
      </div>

      {fixedBudgets.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs text-text-secondary font-medium">
              固定支出
              <span className="text-text-tertiary ml-1.5">{paidCount}/{fixedBudgets.length} 已支付</span>
            </p>
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
