import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { getTransactionsByMonth, getAllBudgets, getAllCategories } from '../db'
import type { Transaction, BudgetItem, Category } from '../db/types'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#F97316', '#EF4444', '#14B8A6', '#64748B']

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

  // 支出按分类汇总
  const expByCat: Record<string, { name: string; icon: string; value: number }> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = catMap[t.categoryId]
    const key = t.categoryId
    if (!expByCat[key]) expByCat[key] = { name: cat?.name || '未分类', icon: cat?.icon || '📦', value: 0 }
    expByCat[key].value += t.amount
  })
  const categoryRank = Object.values(expByCat).sort((a, b) => b.value - a.value)
  const pieData = categoryRank.map(c => ({ name: c.name, value: c.value }))

  // 每日累计支出趋势
  const daysInMonth = dayjs(month).daysInMonth()
  const dailyExpense: number[] = Array(daysInMonth).fill(0)
  const dailyIncome: number[] = Array(daysInMonth).fill(0)
  transactions.forEach(t => {
    const d = dayjs(t.date).date() - 1
    if (d >= 0 && d < daysInMonth) {
      if (t.type === 'expense') dailyExpense[d] += t.amount
      else dailyIncome[d] += t.amount
    }
  })
  let cumExp = 0, cumInc = 0
  const trendData = dailyExpense.map((exp, i) => {
    cumExp += exp
    cumInc += dailyIncome[i]
    return { day: i + 1, 累计支出: Math.round(cumExp), 累计收入: Math.round(cumInc) }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPieLabel = (p: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = p
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{(percent * 100).toFixed(0)}%</text>
  }

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

      {/* 预算进度 */}
      {totalBudget > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">预算进度</span>
            <span className={`text-xs font-semibold ${totalExpense / totalBudget > 0.9 ? 'text-expense' : 'text-primary'}`}>
              {((totalExpense / totalBudget) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-bg-input rounded-full h-2.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${totalExpense / totalBudget > 0.9 ? 'bg-expense' : totalExpense / totalBudget > 0.7 ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${Math.min((totalExpense / totalBudget) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-text-tertiary">
            <span>已用 ¥{totalExpense.toFixed(0)}</span>
            <span>预算 ¥{totalBudget.toFixed(0)}</span>
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <>
          {/* 收支趋势 */}
          <div className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
            <h3 className="text-sm font-medium mb-3">收支趋势</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} interval={Math.floor(daysInMonth / 6)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v, name) => [`¥${Number(v)}`, String(name)]}
                  labelFormatter={(d) => `${dayjs(month).format('M')}月${d}日`}
                  contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="累计支出" stroke="#EF4444" strokeWidth={2} fill="url(#gExp)" dot={false} />
                <Area type="monotone" dataKey="累计收入" stroke="#10B981" strokeWidth={2} fill="url(#gInc)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-5 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-expense" /><span className="text-[10px] text-text-tertiary">累计支出</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-income" /><span className="text-[10px] text-text-tertiary">累计收入</span></div>
            </div>
          </div>

          {/* 支出构成饼图 */}
          {pieData.length > 0 && (
            <div className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
              <h3 className="text-sm font-medium mb-1">支出构成</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={82} dataKey="value"
                    label={renderPieLabel} labelLine={false} stroke="none" animationBegin={0} animationDuration={800}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `¥${Number(v).toFixed(2)}`}
                    contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 11, color: '#64748B' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 分类排行 */}
          {categoryRank.length > 0 && (
            <div className="bg-bg-card rounded-2xl border border-border overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium">支出排行</h3>
              </div>
              {categoryRank.map((cat, i) => {
                const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0
                return (
                  <div key={cat.name} className={`px-4 py-3 ${i < categoryRank.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-expense">¥{cat.value.toFixed(0)}</span>
                        <span className="text-[10px] text-text-tertiary ml-1.5">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="bg-bg-input rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
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
