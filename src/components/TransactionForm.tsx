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
      if (!initial && cats.length > 0 && !cats.find(c => c.id === categoryId)) {
        setCategoryId(cats[0].id)
      }
    })
  }, [type, initial, categoryId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      type,
      amount: parseFloat(amount) || 0,
      categoryId: categoryId,
      description,
      date,
      channel,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* 收入/支出切换 */}
      <div className="flex bg-bg-input rounded-[10px] p-[3px]">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all ${
              type === t
                ? 'bg-bg-card shadow-sm text-text'
                : 'text-text-secondary'
            }`}
          >
            {t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* 金额 */}
      <div>
        <label className="block text-[13px] text-text-secondary mb-2 px-1">金额</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-light text-text-secondary">¥</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-3xl font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            required
            autoFocus
          />
        </div>
      </div>

      {/* 分类 */}
      <div>
        <label className="block text-[13px] text-text-secondary mb-3 px-1">分类</label>
        <div className="grid grid-cols-4 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[12px] font-medium transition-all ${
                categoryId === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-bg-card border border-border text-text hover:bg-bg-input'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 日期 */}
      <div>
        <label className="block text-[13px] text-text-secondary mb-2 px-1">日期</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3.5 text-[15px] text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          required
        />
      </div>

      {/* 支付渠道 */}
      <div>
        <label className="block text-[13px] text-text-secondary mb-3 px-1">支付方式</label>
        <div className="grid grid-cols-4 gap-3">
          {(Object.entries(CHANNEL_NAMES) as [PaymentChannel, string][]).map(([key, name]) => (
            <button
              key={key}
              type="button"
              onClick={() => setChannel(key)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[12px] font-medium transition-all ${
                channel === key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-bg-card border border-border text-text hover:bg-bg-input'
              }`}
            >
              <span className="text-lg">{CHANNEL_ICONS[key]}</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 备注 */}
      <div>
        <label className="block text-[13px] text-text-secondary mb-2 px-1">备注</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="添加备注..."
          className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3.5 text-[15px] text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* 按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3.5 rounded-2xl bg-bg-input text-text text-[15px] font-medium hover:bg-border transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-[15px] font-semibold hover:bg-primary-dark transition-colors shadow-sm"
        >
          {initial ? '保存' : '记一笔'}
        </button>
      </div>
    </form>
  )
}
