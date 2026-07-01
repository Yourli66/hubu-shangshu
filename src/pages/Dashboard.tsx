import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getTransactionsByMonth, getAllBudgets, getAllCategories } from '../db'
import type { Transaction, BudgetItem, Category } from '../db/types'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const COLORS = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#5AC8FA', '#FF2D55', '#5856D6', '#00C7BE', '#FFD60A', '#FF6482']

export default function Dashboard() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [catMap, setCatMap] = useState<Record<string, Category>>({})

  const load = useCallback(async () => {
    const [txs, bgs, cats] = await Promise.all([
      getTransactionsByMonth(month),
      getAllBudgets(),
      getAllCategories(),
    ])
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

  // 按分类汇总支出
  const expenseByCategory: Record<string, number> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const name = catMap[t.categoryId]?.name || '未分类'
    expenseByCategory[name] = (expenseByCategory[name] || 0) + t.amount
  })
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  // 按日汇总
  const dailyMap: Record<string, { income: number; expense: number }> = {}
  const daysInMonth = dayjs(month).daysInMonth()
  for (let d = 1; d <= daysInMonth; d++) dailyMap[String(d)] = { income: 0, expense: 0 }
  transactions.forEach(t => {
    const day = String(dayjs(t.date).date())
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 }
    if (t.type === 'income') dailyMap[day].income += t.amount
    else dailyMap[day].expense += t.amount
  })
  const barData = Object.entries(dailyMap).map(([day, v]) => ({ day, income: v.income, expense: v.expense }))

  const prevMonth = () => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))
  const nextMonth = () => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))

  return (
    <div className="px-4 py-6 space-y-5">
      {/* 月份选择 */}
      <div className="flex items-center justify-center gap-6">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-bg-card active:bg-border">
          <ChevronLeft size={20} className="text-primary" />
        </button>
        <span className="text-[17px] font-semibold min-w-[120px] text-center">
          {dayjs(month).format('YYYY年M月')}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-bg-card active:bg-border">
          <ChevronRight size={20} className="text-primary" />
        </button>
      </div>

      {/* 收支概览 */}
      <div className="bg-bg-card rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-5">
          <p className="text-[13px] text-text-secondary mb-2">本月结余</p>
          <p className={`text-[36px] font-bold tracking-tight ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
            ¥{Math.abs(balance).toFixed(2)}
          </p>
        </div>
        <div className="flex border-t border-border pt-5">
          <div className="flex-1 text-center">
            <p className="text-[13px] text-text-secondary mb-1.5">收入</p>
            <p className="text-[20px] font-semibold text-income">¥{totalIncome.toFixed(2)}</p>
          </div>
          <div className="w-px bg-border" />
          <div className="flex-1 text-center">
            <p className="text-[13px] text-text-secondary mb-1.5">支出</p>
            <p className="text-[20px] font-semibold text-expense">¥{totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 预算 */}
      {totalBudget > 0 && (
        <div className="bg-bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold">预算</h3>
            <span className="text-[13px] text-text-secondary">
              {((totalExpense / totalBudget) * 100).toFixed(0)}% 已使用
            </span>
          </div>
          <div className="bg-bg-input rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalExpense / totalBudget > 0.9 ? 'bg-expense' : totalExpense / totalBudget > 0.7 ? 'bg-warning' : 'bg-income'
              }`}
              style={{ width: `${Math.min((totalExpense / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2.5 text-[12px] text-text-secondary">
            <span>¥{totalExpense.toFixed(0)}</span>
            <span>¥{totalBudget.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* 支出构成 */}
      {pieData.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold mb-4">支出构成</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value"
                label={(props) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false} stroke="none"
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`}
                contentStyle={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 12, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 每日收支 */}
      {transactions.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold mb-4">每日收支</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8E8E93' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#8E8E93' }} width={45} />
              <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`}
                contentStyle={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 12, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="expense" fill="#FF3B30" name="支出" radius={[4, 4, 0, 0]} />
              <Bar dataKey="income" fill="#34C759" name="收入" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 空状态 */}
      {transactions.length === 0 && (
        <div className="bg-bg-card rounded-2xl py-16 text-center shadow-sm">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-[15px] text-text-secondary">本月暂无记录</p>
          <p className="text-[13px] text-text-tertiary mt-2">点击下方「记账」开始记录</p>
        </div>
      )}
    </div>
  )
}
