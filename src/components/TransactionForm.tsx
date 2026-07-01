import { useState, useEffect } from 'react'
import type { Transaction, TransactionType, PaymentChannel, Category } from '../db/types'
import { CHANNEL_NAMES, CHANNEL_ICONS } from '../db/types'
import { getCategoriesByType } from '../db'
import dayjs from 'dayjs'

interface Props {
  initial?: Transaction
  onSubmit: (tx: Transaction) => void
  onCancel: () => void
}

export default function TransactionForm({ initial, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(initial?.date ?? dayjs().format('YYYY-MM-DD'))
  const [channel, setChannel] = useState<PaymentChannel>(initial?.channel ?? 'wechat')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getCategoriesByType(type).then(cats => {
      setCategories(cats)
      if (!initial && cats.length > 0 && !cats.find(c => c.id === categoryId)) setCategoryId(cats[0].id)
    })
  }, [type, initial, categoryId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      type, amount: parseFloat(amount) || 0, categoryId, description, date, channel,
      createdAt: initial?.createdAt ?? now, updatedAt: now,
    })
  }

  const inputCls = 'w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 类型切换 */}
      <div className="flex bg-bg-input rounded-lg p-0.5">
        {(['expense', 'income'] as const).map(t => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === t ? 'bg-bg-card shadow-sm text-text' : 'text-text-tertiary'}`}>
            {t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* 金额 */}
      <div>
        <label className="text-xs text-text-secondary mb-1.5 block">金额</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-tertiary">¥</span>
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" required autoFocus
            className="w-full bg-bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      {/* 分类 */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">分类</label>
        <div className="grid grid-cols-4 gap-2.5">
          {categories.map(cat => (
            <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-medium transition-all ${
                categoryId === cat.id ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-bg-input text-text-secondary hover:bg-border'
              }`}>
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 日期 */}
      <div>
        <label className="text-xs text-text-secondary mb-1.5 block">日期</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputCls} />
      </div>

      {/* 支付方式 */}
      <div>
        <label className="text-xs text-text-secondary mb-2 block">支付方式</label>
        <div className="grid grid-cols-4 gap-2.5">
          {(Object.entries(CHANNEL_NAMES) as [PaymentChannel, string][]).map(([key, name]) => (
            <button key={key} type="button" onClick={() => setChannel(key)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${
                channel === key ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-bg-input text-text-secondary hover:bg-border'
              }`}>
              <span className="text-base">{CHANNEL_ICONS[key]}</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 备注 */}
      <div>
        <label className="text-xs text-text-secondary mb-1.5 block">备注</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="添加备注..." className={inputCls + ' placeholder:text-text-tertiary'} />
      </div>

      {/* 按钮 */}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-bg-input text-text-secondary text-sm font-medium hover:bg-border">
          取消
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark shadow-md shadow-primary/25">
          {initial ? '保存' : '记一笔'}
        </button>
      </div>
    </form>
  )
}
