import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import LoadingOverlay from './LoadingOverlay.jsx'

const emptyValues = fields => Object.fromEntries(fields.map(field => [field.name, field.defaultValue ?? '']))

export default function RecordsPage({ config, profile }) {
  const { title, description, api, fields, columns, recordLabel = title.slice(0, -1) } = config
  const [records, setRecords] = useState([])
  const [options, setOptions] = useState({})
  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setError('')
    try {
      const [rows, ...choices] = await Promise.all([
        api.list(),
        ...fields.filter(field => field.loadOptions).map(field => field.loadOptions()),
      ])
      setRecords(rows)
      setOptions(Object.fromEntries(fields.filter(field => field.loadOptions).map((field, index) => [field.name, choices[index]])))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.list(),
      ...fields.filter(field => field.loadOptions).map(field => field.loadOptions()),
    ]).then(([rows, ...choices]) => {
      if (!active) return
      setRecords(rows)
      setOptions(Object.fromEntries(fields.filter(field => field.loadOptions).map((field, index) => [field.name, choices[index]])))
    }).catch(loadError => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [config, api, fields])

  function startCreate() {
    setEditingId(null)
    setForm(emptyValues(fields))
  }

  function startEdit(record) {
    setEditingId(record.id)
    setForm(Object.fromEntries(fields.map(field => [field.name, record[field.name] ?? ''])))
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const values = Object.fromEntries(fields.map(field => {
      if (field.visibleWhen && !field.visibleWhen(form)) return [field.name, null]
      let value = form[field.name]
      if (field.type === 'number') value = value === '' ? null : Number(value)
      if ((field.type === 'select' || field.type === 'date' || field.type === 'time' || field.name === 'user_id') && !value) value = null
      return [field.name, value]
    }))

    try {
      if (editingId) await api.update(editingId, values)
      else await api.create(values)
      setForm(null)
      await load()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(record) {
    if (!window.confirm(`Delete this ${title.toLowerCase()} record?`)) return
    setError('')
    try {
      await api.remove(record.id)
      await load()
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  const visibleRecords = records.filter(record =>
    columns.some(column => String(column.render ? column.render(record, options) : record[column.name] ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <section className="page-body">
      {(loading || saving) && <LoadingOverlay label={saving ? 'Saving your changes...' : `Loading ${title.toLowerCase()}...`} />}
      <div className="page-heading">
        <div><h1>{title}</h1><p>{description}</p></div>
          {profile.role === 'admin' && <button className="btn primary" onClick={startCreate}><Plus size={16} /> Add {recordLabel}</button>}
      </div>
      {error && <p className="notice error-text" role="alert">{error}</p>}
      <section className="panel table-panel">
        <div className="table-header">
          <div><h4>{title} records</h4><span className="record-count">{records.length} total</span></div>
          <label className="search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} /></label>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>{columns.map(column => <th key={column.name}>{column.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={columns.length + 1}>Loading records...</td></tr> : visibleRecords.length === 0 ? <tr><td colSpan={columns.length + 1}>No records found.</td></tr> : visibleRecords.map(record => (
                <tr key={record.id}>
                  {columns.map(column => <td key={column.name}>{column.render ? column.render(record, options) : record[column.name] || '-'}</td>)}
                  <td><div className="row-actions">{profile.role === 'admin' && <button title="Edit" aria-label={`Edit ${title} record`} onClick={() => startEdit(record)}><Pencil size={15} /></button>}{profile.role === 'admin' && <button title="Delete" aria-label={`Delete ${title} record`} onClick={() => remove(record)}><Trash2 size={15} /></button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {form && <div className="modal-wrap" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setForm(null) }}>
        <form className="modal" onSubmit={save}>
          <header className="modal-title"><div><p className="eyebrow">DATABASE RECORD</p><h3>{editingId ? 'Edit' : 'Add'} {recordLabel}</h3></div><button type="button" className="icon-only" aria-label="Close" onClick={() => setForm(null)}><X size={17} /></button></header>
          <div className="form-grid">
            {fields.filter(field => !field.visibleWhen || field.visibleWhen(form)).map(field => <label key={field.name}>{field.label}
              {field.type === 'select' ? <select required={field.required} value={form[field.name]} onChange={event => setForm({ ...form, [field.name]: event.target.value })}>
                <option value="">Select {field.label.toLowerCase()}</option>
                {(field.options ?? options[field.name] ?? []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select> : <input required={field.required} type={field.type ?? 'text'} min={field.min} max={field.max} step={field.step} value={form[field.name]} onChange={event => setForm({ ...form, [field.name]: event.target.value })} />}
            </label>)}
          </div>
          <div className="modal-actions"><button type="button" className="btn secondary" onClick={() => setForm(null)}>Cancel</button><button className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save record'}</button></div>
        </form>
      </div>}
    </section>
  )
}