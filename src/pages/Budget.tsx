import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit3 } from 'lucide-react'
import { getAllBudgets, addBudget, deleteBudget, getTransactionsByMonth, getAllCategories } from '../db'
import type { BudgetItem, Transaction, Category } from '../db/types'
import BudgetForm from '../components/BudgetForm'
import dayjs from 'dayjs'

export default function Budget() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BudgetItem | undefined>()
  const [monthExpenses, setMonthExpenses] = useState<Record<string, number>>({})
  const [catMap, setCatMap] = useState<Record<string, Category>>({})

  const load = useCallback(async () => {
    const [bgs, txs, cats] = await Promise.all([getAllBudgets(), getTransactionsByMonth(dayjs().format('YYYY-MM')), getAllCategories()])
    setBudgets(bgs)
    const map: Record<string, Category> = {}; cats.forEach(c => { map[c.id] = c }); setCatMap(map)
    const exp: Record<string, number> = {}
    txs.filter((t: Transaction) => t.type === 'expense').forEach((t: Transaction) => { exp[t.categoryId] = (exp[t.categoryId] || 0) + t.amount })
    setMonthExpenses(exp)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (item: BudgetItem) => { await addBudget(item); setShowForm(false); setEditing(undefined); await load() }
  const handleDelete = async (id: string) => { if (confirm('确定删除？')) { await deleteBudget(id); await load() } }

  const fixedBudgets = budgets.filter(b => b.isFixed)
  const flexBudgets = budgets.filter(b => !b.isFixed)
  const totalFixed = fixedBudgets.reduce((s, b) => s + b.amount, 0)
  const totalFlex = flexBudgets.reduce((s, b) => s + b.amount, 0)

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

  const renderItem = (item: BudgetItem) => {
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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">预算</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark shadow-md shadow-primary/25">
          <Plus size={16} /> 新增
        </button>
      </div>

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
          <p className="text-xs text-text-secondary font-medium mb-2 px-1">固定支出</p>
          <div className="bg-bg-card rounded-2xl border border-border divide-y divide-border">{fixedBudgets.map(renderItem)}</div>
        </div>
      )}
      {flexBudgets.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-text-secondary font-medium mb-2 px-1">浮动预算</p>
          <div className="bg-bg-card rounded-2xl border border-border divide-y divide-border">{flexBudgets.map(renderItem)}</div>
        </div>
      )}
      {budgets.length === 0 && (
        <div className="bg-bg-card rounded-2xl border border-border py-16 text-center">
          <p className="text-text-tertiary text-sm">暂无预算</p>
          <p className="text-text-tertiary text-xs mt-1">点击「新增」添加</p>
        </div>
      )}
    </div>
  )
}
