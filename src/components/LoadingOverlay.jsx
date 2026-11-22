import { createPortal } from 'react-dom'
import logo from '../assets/prabath.jpg'

export default function LoadingOverlay({ label = 'Loading workspace...', initial = false }) {
  return createPortal(
    <div className={`brand-loading ${initial ? 'brand-loading--initial' : ''}`} role="status" aria-live="polite" aria-busy="true">
      <div className="brand-loading-content">
        <img src={logo} alt="Prabath Pile Foundations" width="106" height="142" />
        <span className="brand-loading-track" aria-hidden="true"><span /></span>
        <p>{label}</p>
      </div>
    </div>,
    document.body,
  )
}