import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { getTransactionsByMonth, getAllBudgets, getAllCategories } from '../db'
import type { Transaction, BudgetItem, Category } from '../db/types'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const COLORS = ['#6366F1', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6', '#F97316', '#14B8A6', '#64748B']

export default function Dashboard() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [catMap, setCatMap] = useState<Record<string, Category>>({})

  const load = useCallback(async () => {
    const [txs, bgs, cats] = await Promise.all([getTransactionsByMonth(month), getAllBudgets(), getAllCategories()])
    setTransactions(txs)
    setBudgets(bgs)
    const map: Record<string, Category> = {}
    cats.forEach(c => { map[c.id] = c })
    setCatMap(map)
  }, [month])

  useEffect(() => { load() }, [load])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)

  const expenseByCategory: Record<string, number> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const name = catMap[t.categoryId]?.name || '未分类'
    expenseByCategory[name] = (expenseByCategory[name] || 0) + t.amount
  })
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  const dailyMap: Record<string, { income: number; expense: number }> = {}
  for (let d = 1; d <= dayjs(month).daysInMonth(); d++) dailyMap[String(d)] = { income: 0, expense: 0 }
  transactions.forEach(t => {
    const day = String(dayjs(t.date).date())
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 }
    if (t.type === 'income') dailyMap[day].income += t.amount
    else dailyMap[day].expense += t.amount
  })
  const barData = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }))

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 标题 + 月份 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">财务总览</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))} className="p-1.5 rounded-lg hover:bg-bg-input">
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>
          <span className="text-sm font-medium text-text-secondary min-w-[80px] text-center">
            {dayjs(month).format('YYYY.MM')}
          </span>
          <button onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))} className="p-1.5 rounded-lg hover:bg-bg-input">
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* 收支卡片 */}
      <div className="bg-bg-card rounded-2xl p-5 border border-border mb-4">
        <p className="text-xs text-text-tertiary mb-1">本月结余</p>
        <p className={`text-3xl font-bold tracking-tight mb-4 ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
          {balance >= 0 ? '+' : ''}¥{balance.toFixed(2)}
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 flex-1 bg-income/5 rounded-xl px-3 py-2.5">
            <TrendingUp size={16} className="text-income" />
            <div>
              <p className="text-[10px] text-text-tertiary">收入</p>
              <p className="text-sm font-semibold text-income">¥{totalIncome.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 bg-expense/5 rounded-xl px-3 py-2.5">
            <TrendingDown size={16} className="text-expense" />
            <div>
              <p className="text-[10px] text-text-tertiary">支出</p>
              <p className="text-sm font-semibold text-expense">¥{totalExpense.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 预算 */}
      {totalBudget > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">预算进度</span>
            <span className="text-xs text-text-tertiary">{((totalExpense / totalBudget) * 100).toFixed(0)}%</span>
          </div>
          <div className="bg-bg-input rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${totalExpense / totalBudget > 0.9 ? 'bg-expense' : 'bg-primary'}`}
              style={{ width: `${Math.min((totalExpense / totalBudget) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-text-tertiary">
            <span>¥{totalExpense.toFixed(0)}</span>
            <span>¥{totalBudget.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* 支出构成 */}
      {pieData.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
          <h3 className="text-sm font-medium mb-2">支出构成</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value"
                label={(p) => `${p.name ?? ''} ${((p.percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false} stroke="none"
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`}
                contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 每日 */}
      {transactions.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
          <h3 className="text-sm font-medium mb-2">每日收支</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} width={40} />
              <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`}
                contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
              <Bar dataKey="expense" fill="#EF4444" name="支出" radius={[3, 3, 0, 0]} />
              <Bar dataKey="income" fill="#10B981" name="收入" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="bg-bg-card rounded-2xl border border-border py-16 text-center">
          <p className="text-text-tertiary text-sm">本月暂无记录</p>
          <p className="text-text-tertiary text-xs mt-1">切换到「记账」开始记录</p>
        </div>
      )}
    </div>
  )
}
