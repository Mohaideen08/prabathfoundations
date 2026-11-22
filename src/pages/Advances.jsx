import RecordsPage from '../components/RecordsPage.jsx'
import * as api from '../data/advances.js'
import { listSites } from '../data/sites.js'
import { listWorkers } from '../data/workers.js'

const config = {
  title: 'Advances',
  description: 'Record worker advances and repayment history.',
  api,
  fields: [
    { name: 'worker_id', label: 'Worker', type: 'select', required: true, loadOptions: async () => (await listWorkers()).map(row => ({ value: row.id, label: row.full_name })) },
    { name: 'site_id', label: 'Site', type: 'select', required: true, loadOptions: async () => (await listSites()).map(row => ({ value: row.id, label: row.name })) },
    { name: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true },
    { name: 'advance_date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    { name: 'description', label: 'Description', required: true },
  ],
  columns: [
    { name: 'advance_date', label: 'Date' }, { name: 'worker_id', label: 'Worker', render: (row, choices) => choices.worker_id?.find(option => option.value === row.worker_id)?.label ?? '-' },
    { name: 'site_id', label: 'Site', render: (row, choices) => choices.site_id?.find(option => option.value === row.site_id)?.label ?? '-' },
    { name: 'description', label: 'Description' }, { name: 'amount', label: 'Amount', render: row => `INR ${Number(row.amount).toLocaleString('en-IN')}` },
  ],
}

export default function Advances({ profile }) {
  return <RecordsPage config={config} profile={profile} />
}

