import { supabase } from './supabase'
import type { Transaction, BudgetItem, AppSettings, Category } from './types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './types'

// ===== 分类 =====

let categoriesInitialized = false

async function ensureDefaultCategories(): Promise<void> {
  if (categoriesInitialized) return
  const { data } = await supabase.from('finance_categories').select('id').limit(1)
  if (data && data.length > 0) { categoriesInitialized = true; return }

  const now = Date.now()
  const allDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]
  const rows = allDefaults.map(c => ({
    id: c.id, name: c.name, type: c.type, icon: c.icon, sort_order: c.sortOrder, created_at: now,
  }))
  await supabase.from('finance_categories').insert(rows)
  categoriesInitialized = true
}

export async function getAllCategories(): Promise<Category[]> {
  await ensureDefaultCategories()
  const { data, error } = await supabase.from('finance_categories').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, name: r.name, type: r.type, icon: r.icon, sortOrder: r.sort_order, createdAt: r.created_at }))
}

export async function getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
  await ensureDefaultCategories()
  const { data, error } = await supabase.from('finance_categories').select('*').eq('type', type).order('sort_order')
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, name: r.name, type: r.type, icon: r.icon, sortOrder: r.sort_order, createdAt: r.created_at }))
}

export async function addCategory(cat: Category): Promise<void> {
  const { error } = await supabase.from('finance_categories').upsert({
    id: cat.id, name: cat.name, type: cat.type, icon: cat.icon, sort_order: cat.sortOrder, created_at: cat.createdAt,
  })
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('finance_categories').delete().eq('id', id)
  if (error) throw error
}

// ===== 交易记录 =====

export async function addTransaction(tx: Transaction): Promise<void> {
  const { error } = await supabase.from('finance_transactions').upsert({
    id: tx.id, type: tx.type, amount: tx.amount, category_id: tx.categoryId,
    description: tx.description, date: tx.date, channel: tx.channel,
    created_at: tx.createdAt, updated_at: tx.updatedAt,
  })
  if (error) throw error
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  const { data, error } = await supabase.from('finance_transactions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return undefined
  return toTransaction(data)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('finance_transactions').delete().eq('id', id)
  if (error) throw error
}

export async function getTransactionsByMonth(yearMonth: string): Promise<Transaction[]> {
  const start = `${yearMonth}-01`
  const end = `${yearMonth}-31`
  const { data, error } = await supabase
    .from('finance_transactions').select('*')
    .gte('date', start).lte('date', end)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toTransaction)
}

export async function getTransactionsByDateRange(start: string, end: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('finance_transactions').select('*')
    .gte('date', start).lte('date', end)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toTransaction)
}

function toTransaction(r: Record<string, unknown>): Transaction {
  return {
    id: r.id as string, type: r.type as Transaction['type'], amount: Number(r.amount),
    categoryId: r.category_id as string, description: r.description as string,
    date: r.date as string, channel: r.channel as Transaction['channel'],
    createdAt: r.created_at as number, updatedAt: r.updated_at as number,
  }
}

// ===== 预算 =====

export async function addBudget(item: BudgetItem): Promise<void> {
  const { error } = await supabase.from('finance_budgets').upsert({
    id: item.id, category_id: item.categoryId, name: item.name,
    amount: item.amount, is_fixed: item.isFixed,
    created_at: item.createdAt, updated_at: item.updatedAt,
  })
  if (error) throw error
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('finance_budgets').delete().eq('id', id)
  if (error) throw error
}

export async function getAllBudgets(): Promise<BudgetItem[]> {
  const { data, error } = await supabase.from('finance_budgets').select('*')
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id as string, categoryId: r.category_id as string, name: r.name as string,
    amount: Number(r.amount), isFixed: r.is_fixed as boolean,
    createdAt: r.created_at as number, updatedAt: r.updated_at as number,
  }))
}

// ===== 设置（保留本地，不需要同步）=====

export async function getSettings(): Promise<AppSettings | undefined> {
  return undefined
}

export async function saveSettings(_settings: AppSettings): Promise<void> {
  // 设置不再需要，认证由 Supabase Auth 管理
}
