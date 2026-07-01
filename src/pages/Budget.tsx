import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit3, Lock, TrendingUp } from 'lucide-react'
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
    const [bgs, txs, cats] = await Promise.all([
      getAllBudgets(),
      getTransactionsByMonth(dayjs().format('YYYY-MM')),
      getAllCategories(),
    ])
    setBudgets(bgs)
    const map: Record<string, Category> = {}
    cats.forEach(c => { map[c.id] = c })
    setCatMap(map)

    const expMap: Record<string, number> = {}
    txs.filter((t: Transaction) => t.type === 'expense').forEach((t: Transaction) => {
      expMap[t.categoryId] = (expMap[t.categoryId] || 0) + t.amount
    })
    setMonthExpenses(expMap)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (item: BudgetItem) => {
    await addBudget(item)
    setShowForm(false)
    setEditing(undefined)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此预算项吗？')) return
    await deleteBudget(id)
    await load()
  }

  const handleEdit = (item: BudgetItem) => { setEditing(item); setShowForm(true) }
  const handleCancel = () => { setShowForm(false); setEditing(undefined) }

  const fixedBudgets = budgets.filter(b => b.isFixed)
  const flexBudgets = budgets.filter(b => !b.isFixed)
  const totalFixed = fixedBudgets.reduce((s, b) => s + b.amount, 0)
  const totalFlex = flexBudgets.reduce((s, b) => s + b.amount, 0)

  const renderBudgetItem = (item: BudgetItem) => {
    const spent = monthExpenses[item.categoryId] || 0
    const percent = item.amount > 0 ? Math.min((spent / item.amount) * 100, 100) : 0
    const over = spent > item.amount
    const cat = catMap[item.categoryId]

    return (
      <div key={item.id} className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{cat?.icon || '📦'}</span>
            <span className="text-[15px] font-medium">{item.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => handleEdit(item)} className="p-2 text-text-tertiary hover:text-primary rounded-full hover:bg-bg-input">
              <Edit3 size={14} />
            </button>
            <button onClick={() => handleDelete(item.id)} className="p-2 text-text-tertiary hover:text-expense rounded-full hover:bg-bg-input">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="bg-bg-input rounded-full h-2.5 overflow-hidden mb-2.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-expense' : percent > 70 ? 'bg-warning' : 'bg-income'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[12px]">
          <span className={over ? 'text-expense font-medium' : 'text-text-secondary'}>
            已用 ¥{spent.toFixed(0)}{over ? ' · 超支' : ''}
          </span>
          <span className="text-text-secondary">预算 ¥{item.amount.toFixed(0)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      {showForm ? (
        <div className="bg-bg-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-[17px] font-semibold mb-6">{editing ? '编辑预算' : '新增预算'}</h2>
          <BudgetForm initial={editing} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-bold">预算管理</h2>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark shadow-sm"
            >
              <Plus size={16} /> 新增
            </button>
          </div>

          {/* 总览 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-bg-card rounded-2xl p-5 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Lock size={13} className="text-primary" />
                <span className="text-[12px] text-text-secondary">固定支出</span>
              </div>
              <p className="text-[24px] font-bold">¥{totalFixed.toFixed(0)}</p>
            </div>
            <div className="flex-1 bg-bg-card rounded-2xl p-5 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <TrendingUp size={13} className="text-warning" />
                <span className="text-[12px] text-text-secondary">浮动预算</span>
              </div>
              <p className="text-[24px] font-bold">¥{totalFlex.toFixed(0)}</p>
            </div>
          </div>

          {fixedBudgets.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[13px] font-medium text-text-secondary mb-2.5 px-1">固定支出</h3>
              <div className="bg-bg-card rounded-2xl shadow-sm divide-y divide-border">
                {fixedBudgets.map(renderBudgetItem)}
              </div>
            </div>
          )}

          {flexBudgets.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[13px] font-medium text-text-secondary mb-2.5 px-1">浮动预算</h3>
              <div className="bg-bg-card rounded-2xl shadow-sm divide-y divide-border">
                {flexBudgets.map(renderBudgetItem)}
              </div>
            </div>
          )}

          {budgets.length === 0 && (
            <div className="bg-bg-card rounded-2xl py-16 text-center shadow-sm">
              <div className="text-5xl mb-4">💰</div>
              <p className="text-[15px] text-text-secondary">暂无预算设置</p>
              <p className="text-[13px] text-text-tertiary mt-2">点击「新增」添加固定支出或浮动预算</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
