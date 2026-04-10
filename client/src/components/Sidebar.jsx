import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">✦</span>
        <span className="sidebar-brand-text">Maquiagem</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
          <span className="sidebar-link-icon">📅</span>
          Agendamentos
        </NavLink>
        <NavLink to="/todos" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
          <span className="sidebar-link-icon">📋</span>
          Todos os Agendamentos
        </NavLink>
        <NavLink to="/despesas" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
          <span className="sidebar-link-icon">🧾</span>
          Despesas
        </NavLink>
        <NavLink to="/financeiro" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
          <span className="sidebar-link-icon">💰</span>
          Financeiro
        </NavLink>
      </nav>
    </aside>
  )
}
