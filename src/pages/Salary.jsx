import { useEffect, useState } from 'react'
import { CalendarDays, Search } from 'lucide-react'
import { listAdvances } from '../data/advances.js'
import { listAttendance } from '../data/attendance.js'
import { today } from '../data/constants.js'
import { calculateSalaries } from '../data/salary.js'
import { listWorkers } from '../data/workers.js'
import LoadingOverlay from '../components/LoadingOverlay.jsx'

const currency = value => `INR ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Salary() {
  const [month, setMonth] = useState(() => today().slice(0, 7))
  const [search, setSearch] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listWorkers(), listAttendance(), listAdvances()])
      .then(([workers, attendance, advances]) => {
        if (active) setData({ workers, attendance, advances })
      })
      .catch(loadError => { if (active) setError(loadError.message) })
    return () => { active = false }
  }, [])

  const rows = data && month ? calculateSalaries(data.workers, data.attendance, data.advances, month) : []
  const visibleRows = rows.filter(row => `${row.worker.full_name} ${row.worker.worker_type}`.toLowerCase().includes(search.toLowerCase()))
  const totals = rows.reduce((sum, row) => ({
    earned: sum.earned + row.earned,
    advances: sum.advances + row.advanceAmount,
    balance: sum.balance + row.balance,
  }), { earned: 0, advances: 0, balance: 0 })

  return <section className="page-body">
    {!data && !error && <LoadingOverlay label="Loading salary details..." />}
    <div className="page-heading">
      <div><h1>Worker salary</h1><p>Monthly attendance, earned wages, and labour advances.</p></div>
      <label className="salary-month"><CalendarDays size={16} /><span>Month</span><input aria-label="Salary month" type="month" required value={month} onChange={event => setMonth(event.target.value)} /></label>
    </div>
    {error && <p className="notice error-text" role="alert">{error}</p>}
    <div className="stats-grid salary-stats">
      <article className="stat-card"><div className="stat-head"><span>Earned wages</span></div><h3>{currency(totals.earned)}</h3></article>
      <article className="stat-card"><div className="stat-head"><span>Advances this month</span></div><h3>{currency(totals.advances)}</h3></article>
      <article className="stat-card"><div className="stat-head"><span>Balance after advances</span></div><h3>{currency(totals.balance)}</h3></article>
    </div>
    <section className="panel table-panel">
      <div className="table-header"><div><h4>Salary summary</h4><span className="record-count">{rows.length} workers</span></div><label className="search"><Search size={15} /><input aria-label="Search workers" placeholder="Search workers" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <div className="table-wrap"><table><thead><tr><th>Worker</th><th>Daily rate</th><th>Present</th><th>Half days</th><th>Paid days</th><th>Earned wages</th><th>Advances</th><th>Balance</th></tr></thead><tbody>
        {!data && !error ? <tr><td colSpan="8">Loading salary...</td></tr> : visibleRows.length === 0 ? <tr><td colSpan="8">{error ? 'Salary could not be loaded.' : 'No workers found for this selection.'}</td></tr> : visibleRows.map(row => <tr key={row.worker.id}>
          <td>{row.worker.full_name}</td><td>{currency(row.worker.daily_rate)}</td><td>{row.presentDays}</td><td>{row.halfDays}</td><td>{row.paidDays}</td><td>{currency(row.earned)}</td><td>{currency(row.advanceAmount)}</td><td>{currency(row.balance)}</td>
        </tr>)}
      </tbody></table></div>
    </section>
  </section>
}