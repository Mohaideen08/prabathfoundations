import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import Brand from '../components/Brand.jsx'
import LoadingOverlay from '../components/LoadingOverlay.jsx'
import logo from '../assets/prabath.jpg'
import { signIn } from '../data/auth.js'
import { supabase } from '../data/supabase.js'

export default function Login({ setupError = '' }) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	async function submit(event) {
		event.preventDefault()
		setLoading(true)
		setError('')
		try {
			await signIn(email, password)
		} catch (signInError) {
			setError(signInError.message)
		} finally {
			setLoading(false)
		}
	}

	return <main className="login-layout">
		{loading && <LoadingOverlay label="Signing you in..." />}
		<section className="login-hero"><Brand className="login-brand" /><div className="login-hero-copy"><p className="eyebrow">CONSTRUCTION & CONTRACT MANAGEMENT</p><h1>Prabath<br /><span>Pile Foundations.</span></h1><p>A strong foundation.<br />For every project ahead.</p></div><div className="hero-foot"><span className="hero-foot-line" />PLAN. BUILD. PROGRESS.</div></section>
		<section className="login-card"><div className="login-form-wrap"><img className="login-main-logo" src={logo} alt="Prabath Pile Foundations" width="112" height="150" /><h2>Welcome back</h2><p className="login-intro">Sign in to your account</p>
			{!supabase && <p className="notice error-text">Connect this frontend to a Supabase project using `.env.local`.</p>}
			{setupError && <p className="notice error-text">{setupError}</p>}
			<form onSubmit={submit}>
				<label>Email address<span className="login-input"><Mail size={17} /><input type="email" autoComplete="username" placeholder="Enter your email" value={email} onChange={event => setEmail(event.target.value)} required /></span></label>
				<label>Password<span className="login-input"><LockKeyhole size={17} /><input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required /></span></label>
				{error && <p className="error-text" role="alert">{error}</p>}
				<button className="btn primary login-submit" disabled={loading || !supabase}>{loading ? 'Signing in...' : 'Continue'}<ArrowRight size={16} /></button>
			</form>
			<p className="login-footnote"><ShieldCheck size={14} />Secure account access</p>
		</div></section>
	</main>
}
