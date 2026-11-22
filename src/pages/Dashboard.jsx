import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, HardHat, ReceiptText, WalletCards } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import { listAdvances } from '../data/advances.js'
import { listAttendance } from '../data/attendance.js'
import { listExpenses } from '../data/expenses.js'
import { listPayments } from '../data/payments.js'
import { listSites } from '../data/sites.js'
import { listWorkers } from '../data/workers.js'

const currency = amount => `INR ${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const chartColors = ['#0895a2', '#f4a137', '#3b8fba', '#6baa77', '#c47a86', '#717eab', '#99b95a', '#8fa5b4']

export default function Dashboard({ profile }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listSites(), listWorkers(), listExpenses(), listPayments(), listAttendance(), listAdvances()])
      .then(([sites, workers, expenses, payments, attendance, advances]) => {
        if (active) setData({ sites, workers, expenses, payments, attendance, advances })
      })
      .catch(loadError => { if (active) setError(loadError.message) })
    return () => { active = false }
  }, [])

  if (error) return <section className="page-body"><p className="notice error-text">{error}</p></section>
  if (!data) return <section className="page-body"><LoadingOverlay label="Loading your dashboard..." /><p className="muted">Loading your workspace...</p></section>

  const total = rows => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const siteChart = data.sites.map(site => ({
    name: site.name,
    Expenses: total(data.expenses.filter(row => row.site_id === site.id)),
    Payments: total(data.payments.filter(row => row.site_id === site.id)),
  }))
  const expenseChart = [...new Set(data.expenses.map(row => row.category))].map(name => ({ name, value: total(data.expenses.filter(row => row.category === name)) }))
  const cards = profile.role === 'admin'
    ? [
        { label: 'Active sites', value: data.sites.filter(site => site.status === 'In progress').length, note: `${data.sites.length} total projects`, icon: BriefcaseBusiness, tone: 'orange' },
        { label: 'Active workers', value: data.workers.filter(worker => worker.status === 'Active').length, note: `${data.workers.length} registered`, icon: HardHat, tone: 'blue' },
        { label: 'Recorded expenses', value: currency(total(data.expenses)), note: `${data.expenses.length} transactions`, icon: ReceiptText, tone: 'red' },
        { label: 'Client payments', value: currency(total(data.payments)), note: `${data.payments.length} transactions`, icon: WalletCards, tone: 'green' },
      ]
    : [
        { label: 'Attendance records', value: data.attendance.length, note: 'Your saved attendance', icon: BriefcaseBusiness, tone: 'orange' },
        { label: 'Advances', value: currency(total(data.advances)), note: `${data.advances.length} recorded`, icon: WalletCards, tone: 'green' },
      ]

  return <section className="page-body">
    <div className="welcome-row"><div><p className="eyebrow">{profile.role === 'admin' ? 'PROJECT OVERVIEW' : 'MY WORKSPACE'}</p><h1>Welcome back{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1><p>{profile.role === 'admin' ? 'Your projects, people, and progress at a glance.' : 'Your attendance and advances, all in one place.'}</p></div><div className="today-stamp">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
    <div className={`stats-grid ${profile.role === 'worker' ? 'worker-stats' : ''}`}>
      {cards.map(({ label, value, note, icon: Icon, tone }) => <article className="stat-card" key={label}>
        <div className="stat-head"><span>{label}</span><span className={`icon-box ${tone}`}><Icon size={16} /></span></div>
        <h3>{value}</h3><p>{note}</p>
      </article>)}
    </div>
    {profile.role === 'admin' && <div className="dashboard-charts">
      <section className="panel dashboard-chart-panel"><header><h4>Site financial overview</h4><div className="chart-key"><span><i style={{ background: '#0895a2' }} />Payments</span><span><i style={{ background: '#f4a137' }} />Expenses</span></div></header>
        {siteChart.length ? <div className="dashboard-chart" role="img" aria-label="Bar chart comparing client payments and expenses by site"><ResponsiveContainer width="100%" height="100%"><BarChart data={siteChart} margin={{ top: 16, right: 12, bottom: 10, left: 0 }}><CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e7eff4" /><XAxis dataKey="name" tick={{ fill: '#7690a2', fontSize: 10 }} tickFormatter={value => value.length > 14 ? `${value.slice(0, 13)}...` : value} axisLine={false} tickLine={false} interval="preserveStartEnd" /><YAxis width={48} tick={{ fill: '#7690a2', fontSize: 10 }} tickFormatter={value => value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${value / 1000}k` : value} axisLine={false} tickLine={false} /><Tooltip formatter={currency} contentStyle={{ borderRadius: 6, border: '1px solid #dce7ee', fontSize: 11 }} cursor={{ fill: '#edf6fa' }} /><Bar dataKey="Payments" fill="#0895a2" radius={[3, 3, 0, 0]} maxBarSize={24} /><Bar dataKey="Expenses" fill="#f4a137" radius={[3, 3, 0, 0]} maxBarSize={24} /></BarChart></ResponsiveContainer></div> : <div className="chart-empty">No site activity yet.</div>}
      </section>
      <section className="panel dashboard-chart-panel"><header><h4>Expense breakdown</h4><span className="record-count">By category</span></header>
        {expenseChart.length ? <div className="expense-chart-layout"><div className="expense-donut" role="img" aria-label="Donut chart of recorded expenses by category"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseChart} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} stroke="none">{expenseChart.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={currency} contentStyle={{ borderRadius: 6, border: '1px solid #dce7ee', fontSize: 11 }} /></PieChart></ResponsiveContainer><span className="donut-caption"><strong>{expenseChart.length}</strong><small>categories</small></span></div><div className="expense-legend">{expenseChart.map((entry, index) => <div key={entry.name}><i style={{ background: chartColors[index % chartColors.length] }} /><span>{entry.name}</span><b>{total(data.expenses) ? Math.round(entry.value / total(data.expenses) * 100) : 0}%</b></div>)}</div></div> : <div className="chart-empty">No expenses recorded.</div>}
      </section>
    </div>}
    {profile.role === 'admin' && <div className="grid-two">
      <section className="panel overview-panel"><header><h4>Recent expenses</h4><span className="record-count">Latest activity</span></header>
        <div className="compact-list">{[...data.expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date)).slice(0, 5).map(row => <div className="compact-row" key={row.id}><div><strong>{row.description || row.category}</strong><small>{row.category} · {row.expense_date}</small></div><b>{currency(row.amount)}</b><ArrowDownRight size={16} className="negative-icon" /></div>)}{data.expenses.length === 0 && <p className="empty-note">No expenses recorded.</p>}</div>
      </section>
      <section className="panel overview-panel"><header><h4>Recent payments</h4><span className="record-count">Latest activity</span></header>
        <div className="compact-list">{[...data.payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).slice(0, 5).map(row => <div className="compact-row" key={row.id}><div><strong>{row.payment_type}</strong><small>{row.description || 'Client payment'} · {row.payment_date}</small></div><b>{currency(row.amount)}</b><ArrowUpRight size={16} className="positive-icon" /></div>)}{data.payments.length === 0 && <p className="empty-note">No payments recorded.</p>}</div>
      </section>
    </div>}
  </section>
}