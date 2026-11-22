import { useEffect, useState } from 'react'
import { CalendarCheck, Clock3 } from 'lucide-react'
import RecordsPage from '../components/RecordsPage.jsx'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import * as api from '../data/attendance.js'
import { today } from '../data/constants.js'
import { listSites } from '../data/sites.js'
import { getWorkerForUser, listWorkers } from '../data/workers.js'

const config = {
  title: 'Attendance',
  recordLabel: 'Attendance entry',
  description: 'Store daily attendance against a worker and site.',
  api,
  fields: [
    { name: 'worker_id', label: 'Worker', type: 'select', required: true, loadOptions: async () => (await listWorkers()).map(row => ({ value: row.id, label: row.full_name })) },
    { name: 'site_id', label: 'Site', type: 'select', required: true, loadOptions: async () => (await listSites()).map(row => ({ value: row.id, label: row.name })) },
    { name: 'work_date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 'Present', options: ['Present', 'Absent', 'Half day', 'Leave'].map(value => ({ value, label: value })) },
    { name: 'check_in', label: 'Check-in time', type: 'time' },
  ],
  columns: [
    { name: 'work_date', label: 'Date' }, { name: 'worker_id', label: 'Worker', render: (row, choices) => choices.worker_id?.find(option => option.value === row.worker_id)?.label ?? '-' },
    { name: 'site_id', label: 'Site', render: (row, choices) => choices.site_id?.find(option => option.value === row.site_id)?.label ?? '-' },
    { name: 'status', label: 'Status' }, { name: 'check_in', label: 'Check-in' },
  ],
}

export default function Attendance({ profile }) {
  return profile.role === 'admin'
    ? <RecordsPage config={config} profile={profile} />
    : <WorkerAttendance profile={profile} />
}

function WorkerAttendance({ profile }) {
  const [worker, setWorker] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const workDate = today()
  const todayRecord = records.find(record => record.work_date === workDate)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const linkedWorker = await getWorkerForUser(profile.id)
        const attendance = linkedWorker
          ? await api.list({ filters: { worker_id: linkedWorker.id } })
          : []
        if (active) {
          setWorker(linkedWorker)
          setRecords(attendance)
        }
      } catch (loadError) {
        if (active) setError(loadError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [profile.id])

  async function markPresent() {
    setSaving(true)
    setError('')
    setMessage('')
    const now = new Date()
    const checkIn = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(value => String(value).padStart(2, '0'))
      .join(':')

    try {
      const attendance = await api.create({
        worker_id: worker.id,
        site_id: worker.site_id,
        work_date: workDate,
        status: 'Present',
        check_in: checkIn,
      })
      setRecords(current => [attendance, ...current])
      setMessage('Attendance marked for today.')
    } catch (saveError) {
      setError(saveError.code === '23505' ? 'Attendance has already been marked for today.' : saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return <section className="page-body">
    {(loading || saving) && <LoadingOverlay label={saving ? 'Saving your attendance...' : 'Loading attendance...'} />}
    <div className="page-heading"><div><h1>My attendance</h1><p>Mark today’s attendance and review your previous records.</p></div></div>
    {error && <p className="notice error-text" role="alert">{error}</p>}
    {loading ? <p className="muted">Loading attendance...</p> : !worker ? <p className="notice">Your login is not linked to a worker profile. Ask an administrator to link your account.</p> : !worker.site_id ? <p className="notice">You do not have an assigned site yet. Ask an administrator to assign one before marking attendance.</p> : (
      <section className="panel worker-checkin">
        <div className="checkin-icon"><CalendarCheck size={20} /></div>
        <div className="checkin-copy"><span className="eyebrow">{workDate}</span><h2>{todayRecord ? 'Attendance marked' : 'Mark today present'}</h2><p>{todayRecord ? `Checked in at ${todayRecord.check_in || 'time not recorded'}` : 'Your check-in will be saved against your assigned site.'}</p></div>
        {todayRecord ? <span className="status-badge present">Present</span> : <button className="btn primary" onClick={markPresent} disabled={saving || worker.status !== 'Active'}><Clock3 size={16} />{saving ? 'Saving...' : 'Mark present'}</button>}
        {worker.status !== 'Active' && !todayRecord && <p className="error-text">Your worker profile is inactive.</p>}
        {message && <p className="success-text">{message}</p>}
      </section>
    )}
    <section className="panel table-panel">
      <div className="table-header"><div><h4>Attendance history</h4><span className="record-count">{records.length} records</span></div></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Check-in</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="3">Loading records...</td></tr> : records.length === 0 ? <tr><td colSpan="3">No attendance records yet.</td></tr> : records.map(record => <tr key={record.id}><td>{record.work_date}</td><td>{record.status}</td><td>{record.check_in || '-'}</td></tr>)}
      </tbody></table></div>
    </section>
  </section>
}

