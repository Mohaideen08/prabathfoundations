import { useEffect, useState } from 'react'
import { Download, FileText, Printer } from 'lucide-react'
import { today } from '../data/constants.js'
import { listReportSites, loadSiteReport } from '../data/reports.js'
import LoadingOverlay from '../components/LoadingOverlay.jsx'

const currency = value => `INR ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const sum = rows => rows.reduce((amount, row) => amount + Number(row.amount), 0)
const byDate = (rows, key) => [...rows].sort((first, second) => first[key].localeCompare(second[key]))
const textColumn = (label, key) => ({ label, value: row => row[key] ?? '-' })
const amountColumn = (label, key) => ({ label, value: row => Number(row[key]), money: true })

function reportSections(report) {
  const workerNames = new Map(report.wages.map(row => [row.worker.id, row.worker.full_name]))
  const workerColumn = { label: 'Worker', value: row => workerNames.get(row.worker_id) || row.worker_id || '-' }
  return [
    {
      title: 'Expenses by category',
      columns: [textColumn('Category', 'category'), amountColumn('Amount', 'amount')],
      rows: report.categoryTotals,
    },
    {
      title: 'Worker wage summary',
      columns: [
        { label: 'Worker', value: row => row.worker.full_name },
        { label: 'Trade', value: row => row.worker.worker_type || '-' },
        { label: 'Current daily rate', value: row => Number(row.worker.daily_rate), money: true },
        textColumn('Present', 'present'), textColumn('Half days', 'halfDays'), textColumn('Paid days', 'paidDays'),
        amountColumn('Earned wages', 'earned'), amountColumn('Advances', 'advanceAmount'), amountColumn('Balance', 'balance'),
      ],
      rows: report.wages,
    },
    {
      title: 'Expense transactions',
      columns: [textColumn('Date', 'expense_date'), textColumn('Category', 'category'), workerColumn, textColumn('Description', 'description'), amountColumn('Amount', 'amount')],
      rows: byDate(report.expenses, 'expense_date'),
    },
    {
      title: 'Client payments',
      columns: [textColumn('Date', 'payment_date'), textColumn('Type', 'payment_type'), textColumn('Reference / description', 'description'), amountColumn('Amount', 'amount')],
      rows: byDate(report.payments, 'payment_date'),
    },
    {
      title: 'Worker advances',
      columns: [textColumn('Date', 'advance_date'), workerColumn, textColumn('Description', 'description'), { label: 'Source', value: row => row.expense_id ? 'Included in expenses' : 'Standalone advance' }, amountColumn('Amount', 'amount')],
      rows: byDate(report.advances, 'advance_date'),
    },
    {
      title: 'Attendance records',
      columns: [textColumn('Date', 'work_date'), workerColumn, textColumn('Status', 'status'), textColumn('Check-in', 'check_in')],
      rows: byDate(report.attendance, 'work_date'),
    },
  ]
}

function ReportTable({ title, columns, rows }) {
  return <section className="report-section">
    <header className="report-section-heading"><h3>{title}</h3><span>{rows.length} records</span></header>
    <div className="table-wrap"><table>
      <thead><tr>{columns.map(column => <th key={column.label}>{column.label}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.map((row, index) => <tr key={row.id ?? row.worker?.id ?? index}>{columns.map(column => <td key={column.label} className={column.money ? 'report-amount' : undefined}>{column.money ? currency(column.value(row)) : column.value(row)}</td>)}</tr>) : <tr><td colSpan={columns.length}>No records in this date range.</td></tr>}</tbody>
    </table></div>
  </section>
}

export default function Reports() {
  const [sites, setSites] = useState([])
  const [sitesLoading, setSitesLoading] = useState(true)
  const [filters, setFilters] = useState(() => ({ siteId: '', from: `${today().slice(0, 7)}-01`, to: today() }))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listReportSites()
      .then(rows => { if (active) setSites(rows) })
      .catch(loadError => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setSitesLoading(false) })
    return () => { active = false }
  }, [])

  function changeFilter(event) {
    setFilters(current => ({ ...current, [event.target.name]: event.target.value }))
    setReport(null)
    setError('')
  }

  async function generate(event) {
    event.preventDefault()
    setError('')
    setReport(null)
    if (!filters.siteId || !filters.from || !filters.to || filters.from > filters.to) {
      setError('Choose a site and a valid date range. The end date must be on or after the start date.')
      return
    }
    setLoading(true)
    try {
      setReport(await loadSiteReport(filters))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function exportExcel() {
    setExporting(true)
    setError('')
    try {
      const { utils, writeFile } = await import('xlsx')
      const workbook = utils.book_new()
      const { site, totals } = report
      const details = [
        ['Prabath Pile Foundations site report', site.name], ['From', report.from], ['To (inclusive)', report.to],
        ['Location', site.location], ['Client', site.client_name], ['Status', site.status],
        ['Progress (%)', site.progress], ['Contract amount (INR)', Number(site.contract_amount)],
        ['Site start', site.start_date || ''], ['Site end', site.end_date || ''],
        [], ['Selected period totals (INR)'],
        ['Client payments', totals.payments], ['Expenses including linked advances', totals.expenses],
        ['Standalone advances', totals.standaloneAdvances], ['Total cash outflow', totals.cashOutflow],
        ['Net cash movement', totals.cashBalance], ['All worker advances', totals.advances],
        ['Estimated earned wages', totals.earnedWages], ['Paid days', totals.paidDays],
        [], ['Wage basis', 'Current daily rates; wages are estimates, not recorded salary payments.'],
        ['Cash basis', 'Net cash movement excludes estimated wages; linked advances are counted once.'],
      ]
      utils.book_append_sheet(workbook, utils.aoa_to_sheet(details), 'Site summary')
      for (const section of reportSections(report)) {
        const values = [section.columns.map(column => column.label), ...section.rows.map(row => section.columns.map(column => column.value(row)))]
        utils.book_append_sheet(workbook, utils.aoa_to_sheet(values), section.title)
      }
      const safeName = site.name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 80) || 'site'
      writeFile(workbook, `${safeName}_${report.from}_${report.to}.xlsx`)
    } catch (exportError) {
      setError(`Export failed: ${exportError.message}`)
    } finally {
      setExporting(false)
    }
  }

  return <section className="page-body reports-page">
    {(sitesLoading || loading || exporting) && <LoadingOverlay label={exporting ? 'Preparing your export...' : loading ? 'Preparing your site report...' : 'Loading sites...'} />}
    <div className="page-heading report-controls"><div><h1>Site reports</h1><p>Project details and activity for the selected period.</p></div></div>
    <form className="report-filters report-controls" onSubmit={generate}>
      <fieldset disabled={loading || sitesLoading || exporting}>
        <label>Site<select name="siteId" required value={filters.siteId} onChange={changeFilter}><option value="">{sitesLoading ? 'Loading sites...' : 'Select site'}</option>{sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
        <label>From<input type="date" name="from" required value={filters.from} onChange={changeFilter} /></label>
        <label>To<input type="date" name="to" required min={filters.from} value={filters.to} onChange={changeFilter} /></label>
        <button className="btn primary" type="submit" disabled={!sites.length}><FileText size={16} />{loading ? 'Generating...' : 'Generate report'}</button>
      </fieldset>
    </form>
    {error && <p className="notice error-text report-controls" role="alert">{error}</p>}
    {!sitesLoading && !sites.length && !error && <p className="muted report-controls">No sites available. Add a site first.</p>}
    {loading && <p className="muted" role="status">Loading site activity...</p>}
    {!report && !loading && sites.length > 0 && <p className="muted">No report generated.</p>}
    {report && <article className="site-report">
      <header className="report-heading"><div><p className="eyebrow">PRABATH PILE FOUNDATIONS / SITE REPORT</p><h2>{report.site.name}</h2><p>{report.from} to {report.to} (inclusive)</p></div><div className="report-export report-controls"><button className="btn secondary" onClick={exportExcel} disabled={exporting}><Download size={16} />{exporting ? 'Exporting...' : 'Excel'}</button><button className="btn secondary" onClick={() => window.print()}><Printer size={16} />Print / PDF</button></div></header>
      <dl className="report-site-details">
        {[['Client', report.site.client_name], ['Location', report.site.location], ['Status', report.site.status], ['Progress', `${report.site.progress}%`], ['Contract value', currency(report.site.contract_amount)], ['Start date', report.site.start_date], ['End date', report.site.end_date], ['Workers', report.wages.length]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '-'}</dd></div>)}
      </dl>
      <section className="report-section"><header className="report-section-heading"><h3>Period financial summary</h3></header>
        <dl className="report-finances">
          {[['Client payments received', report.totals.payments], ['Expenses (including linked advances)', report.totals.expenses], ['Standalone advances', report.totals.standaloneAdvances], ['Total cash outflow', report.totals.cashOutflow], ['Net cash movement', report.totals.cashBalance], ['All worker advances', report.totals.advances], ['Estimated earned wages', report.totals.earnedWages]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{currency(value)}</dd></div>)}
        </dl>
        <p className="report-note">Net cash movement = payments minus expenses and standalone advances. Linked advances are included in expenses once. Wage estimates use current daily rates and are not recorded salary payments or included in cash outflow.</p>
      </section>
      {reportSections(report).map(section => <ReportTable key={section.title} {...section} />)}
      <footer className="report-footer">{report.attendance.length} attendance records / {report.totals.paidDays} paid days / {report.payments.length} client payments / {currency(sum(report.expenses))} expenses</footer>
    </article>}
  </section>
}