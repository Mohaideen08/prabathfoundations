import RecordsPage from '../components/RecordsPage.jsx'
import * as api from '../data/sites.js'

const config = {
  title: 'Sites',
  description: 'Manage projects, clients, and contract progress.',
  api,
  fields: [
    { name: 'name', label: 'Site name', required: true },
    { name: 'location', label: 'Location', required: true },
    { name: 'client_name', label: 'Client', required: true },
    { name: 'contract_amount', label: 'Contract amount', type: 'number', min: 0, step: '0.01', required: true, defaultValue: 0 },
    { name: 'progress', label: 'Progress (%)', type: 'number', min: 0, max: 100, required: true, defaultValue: 0 },
    { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 'In progress', options: ['In progress', 'Completed', 'On hold'].map(value => ({ value, label: value })) },
    { name: 'start_date', label: 'Start date', type: 'date' },
    { name: 'end_date', label: 'End date', type: 'date' },
  ],
  columns: [
    { name: 'name', label: 'Site' }, { name: 'client_name', label: 'Client' }, { name: 'location', label: 'Location' },
    { name: 'contract_amount', label: 'Contract', render: row => `INR ${Number(row.contract_amount).toLocaleString('en-IN')}` },
    { name: 'progress', label: 'Progress', render: row => `${row.progress}%` }, { name: 'status', label: 'Status' },
  ],
}

export default function Sites({ profile }) {
  return <RecordsPage config={config} profile={profile} />
}

