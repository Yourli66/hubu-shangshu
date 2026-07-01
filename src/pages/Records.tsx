import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { Plus, Trash2, Edit3, ChevronLeft, ChevronRight } from 'lucide-react'
import { getTransactionsByMonth, addTransaction, deleteTransaction, getAllCategories } from '../db'
import type { Transaction, Category } from '../db/types'
import { CHANNEL_NAMES } from '../db/types'
import TransactionForm from '../components/TransactionForm'

export default function Records() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [catMap, setCatMap] = useState<Record<string, Category>>({})

  const load = useCallback(async () => {
    const [txs, cats] = await Promise.all([getTransactionsByMonth(month), getAllCategories()])
    setTransactions(txs)
    const map: Record<string, Category> = {}
    cats.forEach(c => { map[c.id] = c })
    setCatMap(map)
  }, [month])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (tx: Transaction) => { await addTransaction(tx); setShowForm(false); setEditing(undefined); await load() }
  const handleDelete = async (id: string) => { if (confirm('确定删除？')) { await deleteTransaction(id); await load() } }

  const grouped: Record<string, Transaction[]> = {}
  transactions.forEach(tx => { if (!grouped[tx.date]) grouped[tx.date] = []; grouped[tx.date].push(tx) })

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  if (showForm) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <h2 className="text-base font-bold mb-5">{editing ? '编辑记录' : '新增记录'}</h2>
          <TransactionForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(undefined) }} />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">记账</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark shadow-md shadow-primary/25">
          <Plus size={16} /> 记一笔
        </button>
      </div>

      {/* 月份 + 小结 */}
      <div className="bg-bg-card rounded-2xl border border-border p-4 mb-4">
        <div className="flex items-center justify-center gap-4 mb-3">
          <button onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))} className="p-1 rounded-lg hover:bg-bg-input">
            <ChevronLeft size={16} className="text-text-secondary" />
          </button>
          <span className="text-sm font-medium">{dayjs(month).format('YYYY.MM')}</span>
          <button onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))} className="p-1 rounded-lg hover:bg-bg-input">
            <ChevronRight size={16} className="text-text-secondary" />
          </button>
        </div>
        <div className="flex">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-tertiary">收入</p>
            <p className="text-base font-bold text-income">¥{totalIncome.toFixed(2)}</p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-tertiary">支出</p>
            <p className="text-base font-bold text-expense">¥{totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 列表 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-bg-card rounded-2xl border border-border py-16 text-center">
          <p className="text-text-tertiary text-sm">本月暂无记录</p>
          <p className="text-text-tertiary text-xs mt-1">点击「记一笔」开始</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([date, txs]) => {
            const dayTotal = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
            return (
              <div key={date} className="bg-bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex justify-between px-4 py-2 bg-bg-input/60">
                  <span className="text-xs text-text-secondary font-medium">{dayjs(date).format('M月D日 ddd')}</span>
                  <span className={`text-xs font-semibold ${dayTotal >= 0 ? 'text-income' : 'text-expense'}`}>
                    {dayTotal >= 0 ? '+' : ''}{dayTotal.toFixed(2)}
                  </span>
                </div>
                {txs.map((tx, i) => {
                  const cat = catMap[tx.categoryId]
                  return (
                    <div key={tx.id} className={`flex items-center px-4 py-3 gap-3 ${i < txs.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="w-9 h-9 rounded-xl bg-bg-input flex items-center justify-center text-lg shrink-0">{cat?.icon || '📦'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{cat?.name || '未分类'}</span>
                          <span className="text-[10px] text-text-tertiary bg-bg-input px-1.5 py-0.5 rounded">{CHANNEL_NAMES[tx.channel]}</span>
                        </div>
                        {tx.description && <p className="text-xs text-text-tertiary truncate mt-0.5">{tx.description}</p>}
                      </div>
                      <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                      </span>
                      <button onClick={() => { setEditing(tx); setShowForm(true) }} className="p-1.5 text-text-tertiary hover:text-primary rounded-lg hover:bg-bg-input"><Edit3 size={13} /></button>
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-text-tertiary hover:text-expense rounded-lg hover:bg-bg-input"><Trash2 size={13} /></button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
