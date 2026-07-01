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
    const [txs, cats] = await Promise.all([
      getTransactionsByMonth(month),
      getAllCategories(),
    ])
    setTransactions(txs)
    const map: Record<string, Category> = {}
    cats.forEach(c => { map[c.id] = c })
    setCatMap(map)
  }, [month])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (tx: Transaction) => {
    await addTransaction(tx)
    setShowForm(false)
    setEditing(undefined)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条记录吗？')) return
    await deleteTransaction(id)
    await load()
  }

  const handleEdit = (tx: Transaction) => {
    setEditing(tx)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditing(undefined)
  }

  // 按日期分组
  const grouped: Record<string, Transaction[]> = {}
  transactions.forEach(tx => {
    if (!grouped[tx.date]) grouped[tx.date] = []
    grouped[tx.date].push(tx)
  })

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const prevMonth = () => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))
  const nextMonth = () => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))

  return (
    <div className="px-4 py-6">
      {showForm ? (
        <div className="bg-bg-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-[17px] font-semibold mb-6">{editing ? '编辑记录' : '新增记录'}</h2>
          <TransactionForm initial={editing} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      ) : (
        <>
          {/* 头部 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-bg-card active:bg-border">
                <ChevronLeft size={18} className="text-primary" />
              </button>
              <span className="text-[15px] font-semibold min-w-[100px] text-center">
                {dayjs(month).format('YYYY年M月')}
              </span>
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-bg-card active:bg-border">
                <ChevronRight size={18} className="text-primary" />
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark shadow-sm"
            >
              <Plus size={16} />
              记一笔
            </button>
          </div>

          {/* 月度小结 */}
          <div className="flex gap-4 mb-5 bg-bg-card rounded-2xl p-5 shadow-sm">
            <div className="flex-1 text-center">
              <p className="text-[12px] text-text-secondary mb-1">收入</p>
              <p className="text-[18px] font-semibold text-income">¥{totalIncome.toFixed(2)}</p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[12px] text-text-secondary mb-1">支出</p>
              <p className="text-[18px] font-semibold text-expense">¥{totalExpense.toFixed(2)}</p>
            </div>
          </div>

          {/* 记录列表 */}
          {Object.entries(grouped).length === 0 ? (
            <div className="bg-bg-card rounded-2xl py-16 text-center shadow-sm">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-[15px] text-text-secondary">本月暂无记录</p>
              <p className="text-[13px] text-text-tertiary mt-2">点击「记一笔」开始记账</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([date, txs]) => {
                const dayTotal = txs.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
                return (
                  <div key={date} className="bg-bg-card rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 bg-bg-input/50">
                      <span className="text-[13px] font-medium text-text-secondary">
                        {dayjs(date).format('M月D日 ddd')}
                      </span>
                      <span className={`text-[13px] font-semibold ${dayTotal >= 0 ? 'text-income' : 'text-expense'}`}>
                        {dayTotal >= 0 ? '+' : ''}{dayTotal.toFixed(2)}
                      </span>
                    </div>
                    {txs.map((tx, i) => {
                      const cat = catMap[tx.categoryId]
                      return (
                        <div key={tx.id} className={`flex items-center px-4 py-4 ${i < txs.length - 1 ? 'border-b border-border' : ''}`}>
                          {/* 图标 */}
                          <div className="w-10 h-10 rounded-xl bg-bg-input flex items-center justify-center text-xl mr-3 shrink-0">
                            {cat?.icon || '📦'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-medium">{cat?.name || '未分类'}</span>
                              <span className="text-[11px] text-text-tertiary px-1.5 py-0.5 bg-bg-input rounded-md">
                                {CHANNEL_NAMES[tx.channel]}
                              </span>
                            </div>
                            {tx.description && (
                              <p className="text-[13px] text-text-secondary mt-1 truncate">{tx.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className={`text-[16px] font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                              {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                            </span>
                            <button onClick={() => handleEdit(tx)} className="p-2 text-text-tertiary hover:text-primary rounded-full hover:bg-bg-input">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDelete(tx.id)} className="p-2 text-text-tertiary hover:text-expense rounded-full hover:bg-bg-input">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
