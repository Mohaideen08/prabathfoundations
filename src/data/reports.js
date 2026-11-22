import { requireSupabase } from './supabase.js'

async function readAll(client, table, { siteId, dateColumn, from, to } = {}) {
  const rows = []
  const pageSize = 500

  for (let offset = 0; ; offset += pageSize) {
    let query = client.from(table).select('*').order('id').range(offset, offset + pageSize - 1)
    if (siteId) query = query.eq('site_id', siteId)
    if (dateColumn) query = query.gte(dateColumn, from).lte(dateColumn, to)
    const { data, error } = await query
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

export async function listReportSites() {
  const sites = await readAll(requireSupabase(), 'sites')
  return sites.sort((first, second) => first.name.localeCompare(second.name))
}

export function summarizeSiteReport(site, workers, expenses, payments, attendance, advances) {
  const total = records => Math.round(records.reduce((sum, record) => sum + Number(record.amount), 0) * 100) / 100
  const relatedWorkers = workers.filter(worker => worker.site_id === site.id
    || attendance.some(record => record.worker_id === worker.id)
    || expenses.some(record => record.worker_id === worker.id)
    || advances.some(record => record.worker_id === worker.id))
  const wages = relatedWorkers.map(worker => {
    const records = attendance.filter(record => record.worker_id === worker.id)
    const present = records.filter(record => record.status === 'Present').length
    const halfDays = records.filter(record => record.status === 'Half day').length
    const paidDays = present + halfDays * 0.5
    const earned = Math.round(paidDays * Number(worker.daily_rate) * 100) / 100
    const advanceAmount = total(advances.filter(record => record.worker_id === worker.id))
    return { worker, present, halfDays, paidDays, earned, advanceAmount, balance: Math.round((earned - advanceAmount) * 100) / 100 }
  })
  const expenseTotal = total(expenses)
  const paymentTotal = total(payments)
  const advanceTotal = total(advances)
  const standaloneAdvances = total(advances.filter(record => !record.expense_id))
  const cashOutflow = Math.round((expenseTotal + standaloneAdvances) * 100) / 100
  const categoryTotals = [...new Set(expenses.map(record => record.category))]
    .sort()
    .map(category => ({ category, amount: total(expenses.filter(record => record.category === category)) }))

  return {
    site, expenses, payments, attendance, advances, wages, categoryTotals,
    totals: {
      expenses: expenseTotal,
      payments: paymentTotal,
      advances: advanceTotal,
      standaloneAdvances,
      cashOutflow,
      cashBalance: Math.round((paymentTotal - cashOutflow) * 100) / 100,
      earnedWages: Math.round(wages.reduce((sum, row) => sum + row.earned, 0) * 100) / 100,
      paidDays: wages.reduce((sum, row) => sum + row.paidDays, 0),
    },
  }
}

export async function loadSiteReport({ siteId, from, to }) {
  if (!siteId || !from || !to || from > to) throw new Error('Select a site and a valid date range.')
  const client = requireSupabase()
  const { data: site, error } = await client.from('sites').select('*').eq('id', siteId).single()
  if (error) throw error
  const [workers, expenses, payments, attendance, advances] = await Promise.all([
    readAll(client, 'workers'),
    readAll(client, 'expenses', { siteId, dateColumn: 'expense_date', from, to }),
    readAll(client, 'payments', { siteId, dateColumn: 'payment_date', from, to }),
    readAll(client, 'attendance', { siteId, dateColumn: 'work_date', from, to }),
    readAll(client, 'advances', { siteId, dateColumn: 'advance_date', from, to }),
  ])

  return { ...summarizeSiteReport(site, workers, expenses, payments, attendance, advances), from, to }
}