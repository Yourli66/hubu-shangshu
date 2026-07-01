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
      if (!initial && cats.length > 0 && !cats.find(c => c.id === categoryId)) {
        setCategoryId(cats[0].id)
      }
    })
  }, [initial, categoryId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedCat = categories.find(c => c.id === categoryId)
    const now = Date.now()
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      categoryId,
      name: name || selectedCat?.name || '未命名',
      amount: parseFloat(amount) || 0,
      isFixed,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* 固定/浮动切换 */}
      <div className="flex bg-bg-input rounded-[10px] p-[3px]">
        <button
          type="button"
          onClick={() => setIsFixed(true)}
          className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all ${
            isFixed ? 'bg-bg-card shadow-sm text-text' : 'text-text-secondary'
          }`}
        >
          固定支出
        </button>
        <button
          type="button"
          onClick={() => setIsFixed(false)}
          className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all ${
            !isFixed ? 'bg-bg-card shadow-sm text-text' : 'text-text-secondary'
          }`}
        >
          浮动预算
        </button>
      </div>

      {/* 名称 */}
      <div>
        <label className="block text-[13px] text-text-secondary mb-2 px-1">名称</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：房贷、水电费..."
          className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3.5 text-[15px] text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
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

      {/* 金额 */}
      <div>
        <label className="block text-[13px] text-text-secondary mb-2 px-1">
          {isFixed ? '每月固定金额' : '每月预算金额'}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-light text-text-secondary">¥</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-2xl font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            required
            autoFocus
          />
        </div>
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
          {initial ? '保存' : '添加'}
        </button>
      </div>
    </form>
  )
}
