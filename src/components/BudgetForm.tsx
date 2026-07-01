import { useState, useEffect } from 'react'
import type { BudgetItem, Category } from '../db/types'
import { getCategoriesByType } from '../db'

interface Props {
  initial?: BudgetItem
  onSubmit: (item: BudgetItem) => void
  onCancel: () => void
}

export default function BudgetForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [isFixed, setIsFixed] = useState(initial?.isFixed ?? true)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getCategoriesByType('expense').then(cats => {
      setCategories(cats)
      if (!initial && cats.length > 0 && !cats.find(c => c.id === categoryId)) setCategoryId(cats[0].id)
    })
  }, [initial, categoryId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedCat = categories.find(c => c.id === categoryId)
    const now = Date.now()
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(), categoryId,
      name: name || selectedCat?.name || '未命名',
      amount: parseFloat(amount) || 0, isFixed,
      createdAt: initial?.createdAt ?? now, updatedAt: now,
    })
  }

  const inputCls = 'w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex bg-bg-input rounded-lg p-0.5">
        {[true, false].map(fixed => (
          <button key={String(fixed)} type="button" onClick={() => setIsFixed(fixed)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isFixed === fixed ? 'bg-bg-card shadow-sm text-text' : 'text-text-tertiary'}`}>
            {fixed ? '固定支出' : '浮动预算'}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-text-secondary mb-1.5 block">名称</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="例：房贷、水电费..." className={inputCls + ' placeholder:text-text-tertiary'} />
      </div>

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

      <div>
        <label className="text-xs text-text-secondary mb-1.5 block">{isFixed ? '每月固定金额' : '每月预算金额'}</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-tertiary">¥</span>
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" required autoFocus
            className="w-full bg-bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-bg-input text-text-secondary text-sm font-medium hover:bg-border">取消</button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark shadow-md shadow-primary/25">
          {initial ? '保存' : '添加'}
        </button>
      </div>
    </form>
  )
}
