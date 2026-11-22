import RecordsPage from '../components/RecordsPage.jsx'
import * as api from '../data/workers.js'
import { listSites } from '../data/sites.js'

const config = {
  title: 'Workers',
  description: 'Maintain worker profiles, assignments, and daily rates.',
  api,
  fields: [
    { name: 'full_name', label: 'Full name', required: true }, { name: 'phone', label: 'Phone' },
    { name: 'worker_type', label: 'Trade / role', required: true },
    { name: 'site_id', label: 'Assigned site', type: 'select', loadOptions: async () => (await listSites()).map(row => ({ value: row.id, label: row.name })) },
    { name: 'daily_rate', label: 'Daily rate', type: 'number', min: 0, step: '0.01', required: true, defaultValue: 0 },
    { name: 'joined_on', label: 'Joined on', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 'Active', options: ['Active', 'Inactive'].map(value => ({ value, label: value })) },
    { name: 'user_id', label: 'Supabase Auth user UUID (optional)' },
  ],
  columns: [
    { name: 'full_name', label: 'Worker' }, { name: 'worker_type', label: 'Trade' }, { name: 'phone', label: 'Phone' },
    { name: 'site_id', label: 'Site', render: (row, choices) => choices.site_id?.find(option => option.value === row.site_id)?.label ?? '-' },
    { name: 'daily_rate', label: 'Daily rate', render: row => `INR ${Number(row.daily_rate).toLocaleString('en-IN')}` }, { name: 'status', label: 'Status' },
  ],
}

export default function Workers({ profile }) {
  return <RecordsPage config={config} profile={profile} />
}

