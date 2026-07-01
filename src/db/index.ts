import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Transaction, BudgetItem, AppSettings, Category } from './types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './types'

interface HubuDB extends DBSchema {
  transactions: {
    key: string
    value: Transaction
    indexes: {
      'by-date': string
      'by-type': string
    }
  }
  budgets: {
    key: string
    value: BudgetItem
  }
  categories: {
    key: string
    value: Category
    indexes: {
      'by-type': string
    }
  }
  settings: {
    key: string
    value: AppSettings
  }
}

let dbInstance: IDBPDatabase<HubuDB> | null = null

async function getDB(): Promise<IDBPDatabase<HubuDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<HubuDB>('hubu-shangshu', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' })
        txStore.createIndex('by-date', 'date')
        txStore.createIndex('by-type', 'type')
        db.createObjectStore('budgets', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' })
        catStore.createIndex('by-type', 'type')
      }
    },
  })

  // 初始化默认分类（如果为空）
  const existingCats = await dbInstance.getAll('categories')
  if (existingCats.length === 0) {
    const now = Date.now()
    const allDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]
    const tx = dbInstance.transaction('categories', 'readwrite')
    for (const cat of allDefaults) {
      await tx.store.put({ ...cat, createdAt: now })
    }
    await tx.done
  }

  return dbInstance
}

// ===== 交易记录 =====

export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await getDB()
  await db.put('transactions', tx)
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  const db = await getDB()
  return db.get('transactions', id)
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('transactions', id)
}

export async function getTransactionsByMonth(yearMonth: string): Promise<Transaction[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('transactions', 'by-date')
  return all
    .filter(tx => tx.date.startsWith(yearMonth))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}

export async function getTransactionsByDateRange(start: string, end: string): Promise<Transaction[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(start, end)
  const results = await db.getAllFromIndex('transactions', 'by-date', range)
  return results.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}

// ===== 分类 =====

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB()
  const all = await db.getAll('categories')
  return all.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('categories', 'by-type', type)
  return all.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function addCategory(cat: Category): Promise<void> {
  const db = await getDB()
  await db.put('categories', cat)
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('categories', id)
}

// ===== 预算 =====

export async function addBudget(item: BudgetItem): Promise<void> {
  const db = await getDB()
  await db.put('budgets', item)
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('budgets', id)
}

export async function getAllBudgets(): Promise<BudgetItem[]> {
  const db = await getDB()
  return db.getAll('budgets')
}

// ===== 设置 =====

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB()
  return db.get('settings', 'main')
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB()
  await db.put('settings', settings)
}
