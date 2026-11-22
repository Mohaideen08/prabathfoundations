import { lazy, Suspense, useEffect, useState } from 'react'
import { BriefcaseBusiness, ClipboardCheck, Coins, CreditCard, FileText, HardHat, LayoutDashboard, LogOut, Menu, ReceiptText, Users } from 'lucide-react'
import { getSession, onAuthStateChange, signOut } from './data/auth.js'
import { getProfile } from './data/profiles.js'
import { supabase } from './data/supabase.js'
import Accounts from './pages/Accounts.jsx'
import Advances from './pages/Advances.jsx'
import Attendance from './pages/Attendance.jsx'
import Expenses from './pages/Expenses.jsx'
import Login from './pages/Login.jsx'
import Payments from './pages/Payments.jsx'
import Salary from './pages/Salary.jsx'
import Reports from './pages/Reports.jsx'
import Sites from './pages/Sites.jsx'
import Workers from './pages/Workers.jsx'
import Brand from './components/Brand.jsx'
import LoadingOverlay from './components/LoadingOverlay.jsx'
import './App.css'
import './theme.css'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'sites', label: 'Sites', icon: BriefcaseBusiness, component: Sites },
  { id: 'workers', label: 'Workers', icon: HardHat, component: Workers },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText, component: Expenses },
  { id: 'payments', label: 'Payments', icon: CreditCard, component: Payments },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, component: Attendance },
  { id: 'salary', label: 'Salary', icon: Coins, component: Salary },
  { id: 'reports', label: 'Reports', icon: FileText, component: Reports },
  { id: 'advances', label: 'Advances', icon: Coins, component: Advances },
  { id: 'accounts', label: 'My account', icon: Users, component: Accounts },
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profileState, setProfileState] = useState({ userId: null, profile: null, error: '' })
  const [activePage, setActivePage] = useState(() => window.location.hash.slice(1) || 'dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handlePageChange = () => {
      setActivePage(window.location.hash.slice(1) || 'dashboard')
      setMenuOpen(false)
    }
    window.addEventListener('hashchange', handlePageChange)
    return () => window.removeEventListener('hashchange', handlePageChange)
  }, [])

  useEffect(() => {
    let active = true

    getSession()
      .then(value => { if (active) setSession(value) })
      .catch(error => {
        if (active) {
          setProfileState({ userId: null, profile: null, error: error.message })
          setSession(null)
        }
      })

    const unsubscribe = supabase ? onAuthStateChange(value => setSession(value)) : () => {}
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    if (session?.user) {
      getProfile(session.user.id)
        .then(profile => { if (active) setProfileState({ userId: session.user.id, profile, error: '' }) })
        .catch(error => { if (active) setProfileState({ userId: session.user.id, profile: null, error: error.message }) })
    }

    return () => { active = false }
  }, [session])

  if (session === undefined) return <LoadingOverlay label="Opening your workspace..." initial />
  if (!session) return <Login setupError={profileState.error} />
  if (profileState.userId !== session.user.id) return <LoadingOverlay label="Loading your account..." initial />
  const { profile } = profileState
  if (!profile) return profileState.error
    ? <main className="app-message">{profileState.error}</main>
    : <LoadingOverlay label="Loading your account..." initial />

  const availableNavigation = profile.role === 'admin'
    ? navigation.filter(item => item.id !== 'advances')
    : navigation.filter(item => ['dashboard', 'attendance', 'advances', 'accounts'].includes(item.id))
  const page = availableNavigation.find(item => item.id === activePage) ?? availableNavigation[0]
  const Page = page.component

  return (
    <div className="app-layout">
      {menuOpen && <button className="overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Brand className="sidebar-brand" />
        <p className="nav-caption">{profile.role === 'admin' ? 'ADMIN WORKSPACE' : 'WORKER WORKSPACE'}</p>
        <nav aria-label="Main navigation">
          {availableNavigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page.id === id ? 'active' : ''}
              onClick={() => { window.location.hash = id; setMenuOpen(false) }}
            >
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{profile.full_name?.slice(0, 1) || 'U'}</span>
          <span><strong>{profile.full_name || session.user.email}</strong><small>{profile.role}</small></span>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div className="left">
            <button className="icon-only mobile" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={18} /></button>
            <div><p className="eyebrow">PRABATH PILE FOUNDATIONS</p><h2>{page.label}</h2></div>
          </div>
          <div className="topbar-account"><span className="topbar-identity"><strong>{profile.full_name || 'My account'}</strong><small>{profile.role}</small></span><span className="avatar" aria-hidden="true">{profile.full_name?.slice(0, 1) || 'U'}</span><button className="icon-only" title="Sign out" aria-label="Sign out" onClick={() => signOut()}><LogOut size={17} /></button></div>
        </header>
        <Suspense fallback={<LoadingOverlay label="Opening dashboard..." />}><Page profile={profile} /></Suspense>
      </main>
    </div>
  )
}