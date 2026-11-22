import RecordsPage from '../components/RecordsPage.jsx'
import * as api from '../data/payments.js'
import { listSites } from '../data/sites.js'

const config = {
  title: 'Payments',
  description: 'Track client payments against site contracts.',
  api,
  fields: [
    { name: 'site_id', label: 'Site', type: 'select', required: true, loadOptions: async () => (await listSites()).map(row => ({ value: row.id, label: row.name })) },
    { name: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true },
    { name: 'payment_date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    { name: 'payment_type', label: 'Type', required: true, defaultValue: 'Progress payment' }, { name: 'description', label: 'Reference / description' },
  ],
  columns: [
    { name: 'payment_date', label: 'Date' }, { name: 'site_id', label: 'Site', render: (row, choices) => choices.site_id?.find(option => option.value === row.site_id)?.label ?? '-' },
    { name: 'payment_type', label: 'Type' }, { name: 'description', label: 'Reference' },
    { name: 'amount', label: 'Amount', render: row => `INR ${Number(row.amount).toLocaleString('en-IN')}` },
  ],
}

export default function Payments({ profile }) {
  return <RecordsPage config={config} profile={profile} />
}

