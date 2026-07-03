import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function MonthPicker({
  current,
  onSelect,
  onClose,
}: {
  current: string
  onSelect: (month: string) => void
  onClose: () => void
}) {
  const [year, setYear] = useState(dayjs(current).year())
  const currentMonth = dayjs(current).month() // 0-based

  const handleSelect = (m: number) => {
    onSelect(dayjs().year(year).month(m).format('YYYY-MM'))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-lg bg-bg-card rounded-t-2xl border-t border-border p-5 pb-8 animate-slide-up"
        onClick={e => e.stopPropagation()}>
        {/* 年份选择 */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-xl hover:bg-bg-input">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <span className="text-lg font-bold min-w-[80px] text-center">{year} 年</span>
          <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-xl hover:bg-bg-input">
            <ChevronRight size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* 月份网格 */}
        <div className="grid grid-cols-4 gap-2.5">
          {MONTHS.map((label, i) => {
            const isSelected = year === dayjs(current).year() && i === currentMonth
            const isCurrent = year === dayjs().year() && i === dayjs().month()
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : isCurrent
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-bg-input text-text-secondary hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* 快捷按钮 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { onSelect(dayjs().format('YYYY-MM')); onClose() }}
            className="flex-1 py-2.5 rounded-xl bg-bg-input text-sm font-medium text-primary hover:bg-primary/10"
          >
            回到本月
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-bg-input text-sm font-medium text-text-tertiary hover:bg-bg-input/80"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
