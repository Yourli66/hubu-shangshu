// ===== 数据类型定义 =====

/** 交易类型 */
export type TransactionType = 'income' | 'expense'

/** 支付渠道 */
export type PaymentChannel =
  | 'alipay'     // 支付宝
  | 'wechat'     // 微信支付
  | 'bank'       // 银行卡
  | 'cash'       // 现金
  | 'meituan'    // 美团
  | 'douyin'     // 抖音
  | 'jd'         // 京东
  | 'other'      // 其他

/** 自定义分类 */
export interface Category {
  id: string
  name: string
  type: TransactionType  // 属于收入还是支出
  icon: string           // emoji 图标
  sortOrder: number
  createdAt: number
}

/** 一笔交易记录 */
export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string      // 关联自定义分类
  description: string
  date: string            // YYYY-MM-DD
  channel: PaymentChannel
  createdAt: number
  updatedAt: number
}

/** 预算项（固定或浮动） */
export interface BudgetItem {
  id: string
  categoryId: string      // 关联自定义分类
  name: string
  amount: number
  isFixed: boolean
  createdAt: number
  updatedAt: number
}

/** 应用设置 */
export interface AppSettings {
  id: 'main'
  passwordHash: string
  currency: string
  createdAt: number
}

// ===== 默认分类 =====

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat_food',          name: '餐饮',   type: 'expense', icon: '🍜', sortOrder: 1 },
  { id: 'cat_transport',     name: '交通',   type: 'expense', icon: '🚇', sortOrder: 2 },
  { id: 'cat_shopping',      name: '购物',   type: 'expense', icon: '🛒', sortOrder: 3 },
  { id: 'cat_housing',       name: '房贷/房租', type: 'expense', icon: '🏠', sortOrder: 4 },
  { id: 'cat_utilities',     name: '水电费', type: 'expense', icon: '💡', sortOrder: 5 },
  { id: 'cat_entertainment', name: '娱乐',   type: 'expense', icon: '🎮', sortOrder: 6 },
  { id: 'cat_medical',       name: '医疗',   type: 'expense', icon: '💊', sortOrder: 7 },
  { id: 'cat_education',     name: '教育',   type: 'expense', icon: '📚', sortOrder: 8 },
  { id: 'cat_communication', name: '通信',   type: 'expense', icon: '📱', sortOrder: 9 },
  { id: 'cat_insurance',     name: '保险',   type: 'expense', icon: '🛡️', sortOrder: 10 },
  { id: 'cat_other_exp',     name: '其他',   type: 'expense', icon: '📦', sortOrder: 99 },
]

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat_salary',     name: '工资',   type: 'income', icon: '💰', sortOrder: 1 },
  { id: 'cat_bonus',      name: '奖金',   type: 'income', icon: '🎁', sortOrder: 2 },
  { id: 'cat_investment', name: '投资',   type: 'income', icon: '📈', sortOrder: 3 },
  { id: 'cat_sidejob',    name: '副业',   type: 'income', icon: '💼', sortOrder: 4 },
  { id: 'cat_other_inc',  name: '其他',   type: 'income', icon: '✨', sortOrder: 99 },
]

export const CHANNEL_NAMES: Record<PaymentChannel, string> = {
  alipay: '支付宝',
  wechat: '微信',
  bank: '银行卡',
  cash: '现金',
  meituan: '美团',
  douyin: '抖音',
  jd: '京东',
  other: '其他',
}

export const CHANNEL_ICONS: Record<PaymentChannel, string> = {
  alipay: '💙',
  wechat: '💚',
  bank: '💳',
  cash: '💵',
  meituan: '🟡',
  douyin: '🎵',
  jd: '🔴',
  other: '⚪',
}
