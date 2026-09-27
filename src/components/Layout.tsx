import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const liensNav = [
  { to: '/', label: 'Tableau de bord', icone: '🏠' },
  { to: '/clients', label: 'Clients', icone: '👥' },
  { to: '/devis', label: 'Devis', icone: '📄' },
  { to: '/factures', label: 'Factures', icone: '🧾' },
  { to: '/parametres', label: 'Paramètres', icone: '⚙️' },
]

export default function Layout() {
  const [menuOuvert, setMenuOuvert] = useState(false)

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Barre de navigation mobile */}
      <header
        id="app-shell-header"
        className="md:hidden flex items-center justify-between bg-primary-600 text-white px-4 py-3 sticky top-0 z-30"
      >
        <span className="font-semibold text-lg">Devis &amp; Factures</span>
        <button
          onClick={() => setMenuOuvert((v) => !v)}
          className="p-2 rounded hover:bg-primary-500/50"
          aria-label="Ouvrir le menu"
        >
          <span className="text-xl">{menuOuvert ? '✕' : '☰'}</span>
        </button>
      </header>

      {/* Navigation latérale (desktop) / menu déroulant (mobile) */}
      <nav
        id="app-shell-nav"
        className={`
          bg-primary-600 text-white md:w-60 md:flex md:flex-col md:sticky md:top-0 md:h-screen
          ${menuOuvert ? 'block' : 'hidden'} md:block
        `}
      >
        <div className="hidden md:block px-5 py-6">
          <h1 className="text-xl font-bold leading-tight">Devis &amp; Factures</h1>
          <p className="text-primary-200 text-xs mt-1">100% local, sans compte</p>
        </div>
        <ul className="flex flex-col gap-1 px-3 pb-4 md:pb-0">
          {liensNav.map((lien) => (
            <li key={lien.to}>
              <NavLink
                to={lien.to}
                end={lien.to === '/'}
                onClick={() => setMenuOuvert(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive ? 'bg-white text-primary-700 font-semibold' : 'text-primary-100 hover:bg-primary-500/40'
                  }`
                }
              >
                <span aria-hidden>{lien.icone}</span>
                <span>{lien.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="hidden md:block mt-auto px-5 py-4 text-primary-200 text-xs">
          Vos données restent dans votre navigateur.
        </div>
      </nav>

      {/* Contenu */}
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
