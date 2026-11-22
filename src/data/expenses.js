import { createTableApi } from './tableApi.js'

const expenses = createTableApi('expenses')

export const listExpenses = options => expenses.list({ orderBy: 'expense_date', ...options })
export const getExpense = id => expenses.get(id)
export const createExpense = values => expenses.create(values)
export const updateExpense = (id, values) => expenses.update(id, values)
export const deleteExpense = id => expenses.remove(id)
export const list = listExpenses
export const create = createExpense
export const update = updateExpense
export const remove = deleteExpense