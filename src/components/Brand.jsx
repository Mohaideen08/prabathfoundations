import logo from '../assets/prabath.jpg'

export default function Brand({ className = '' }) {
  return <div className={`brand ${className}`}>
    <img className="brand-image" src={logo} alt="Prabath Pile Foundations logo" width="48" height="64" />
    <span className="brand-name"><strong>PRABATH</strong><span>PILE FOUNDATIONS</span></span>
  </div>
}