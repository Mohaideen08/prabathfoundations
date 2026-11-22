import { useState } from 'react'
import { Check, UserRound } from 'lucide-react'
import { updateProfile } from '../data/profiles.js'
import LoadingOverlay from '../components/LoadingOverlay.jsx'

export default function Accounts({ profile }) {
	const [name, setName] = useState(profile.full_name || '')
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const [saving, setSaving] = useState(false)

	async function save(event) {
		event.preventDefault()
		setSaving(true)
		setMessage('')
		setError('')
		try {
			await updateProfile(profile.id, { full_name: name })
			setMessage('Profile updated.')
		} catch (saveError) {
			setError(saveError.message)
		} finally {
			setSaving(false)
		}
	}

	return <section className="page-body account-page">
		{saving && <LoadingOverlay label="Saving your profile..." />}
		<div className="page-heading"><div><h1>Account</h1><p>Your profile and workspace access.</p></div></div>
		<section className="panel account-panel"><div className="account-avatar"><UserRound size={22} /></div><div className="account-meta"><span className="eyebrow">SIGNED-IN PROFILE</span><h2>{profile.full_name || 'Complete your profile'}</h2><p>{profile.role === 'admin' ? 'Administrator' : 'Worker account'}</p></div>
			<form onSubmit={save} className="account-form"><label>Full name<input value={name} onChange={event => setName(event.target.value)} required /></label><label>Role<input value={profile.role} disabled /></label><button className="btn primary" disabled={saving}><Check size={16} />{saving ? 'Saving...' : 'Save profile'}</button>{message && <p className="success-text">{message}</p>}{error && <p className="error-text">{error}</p>}</form>
		</section>
	</section>
}
