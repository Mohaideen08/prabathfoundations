import RecordsPage from '../components/RecordsPage.jsx'
import * as api from '../data/expenses.js'
import { categories } from '../data/constants.js'
import { listSites } from '../data/sites.js'
import { listWorkers } from '../data/workers.js'

const config = {
  title: 'Expenses',
  description: 'Record and review site costs by category.',
  api,
  fields: [
    { name: 'site_id', label: 'Site', type: 'select', required: true, loadOptions: async () => (await listSites()).map(row => ({ value: row.id, label: row.name })) },
    { name: 'category', label: 'Category', type: 'select', required: true, options: categories.map(value => ({ value, label: value })) },
    { name: 'worker_id', label: 'Worker receiving advance', type: 'select', required: true, visibleWhen: values => values.category === 'Labour Advances', loadOptions: async () => (await listWorkers()).map(row => ({ value: row.id, label: row.full_name })) },
    { name: 'amount', label: 'Amount', type: 'number', min: 0.01, step: '0.01', required: true },
    { name: 'description', label: 'Description', required: true }, { name: 'expense_date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
  ],
  columns: [
    { name: 'expense_date', label: 'Date' }, { name: 'site_id', label: 'Site', render: (row, choices) => choices.site_id?.find(option => option.value === row.site_id)?.label ?? '-' },
    { name: 'category', label: 'Category' }, { name: 'description', label: 'Description' },
    { name: 'worker_id', label: 'Worker', render: (row, choices) => choices.worker_id?.find(option => option.value === row.worker_id)?.label ?? '-' },
    { name: 'amount', label: 'Amount', render: row => `INR ${Number(row.amount).toLocaleString('en-IN')}` },
  ],
}

export default function Expenses({ profile }) {
  return <RecordsPage config={config} profile={profile} />
}

