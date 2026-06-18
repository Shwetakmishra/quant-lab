import logo from '../assets/quant-logo.png'
import GlobalSearch from './GlobalSearch'
import { Home, Cards, Quiz, Formula, Flame, Logout } from './Icons'
import { SyncBadge } from './Header'

export function MobileTopBar({ onPick, streak, onSignOut, syncError }) {
  return (
    <header style={{ background: 'var(--navy)', color: '#fff', padding: '42px 18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,.18)',
            }}
          >
            <img src={logo} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>Quant Lab</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)' }}>GRE revision</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.14)', borderRadius: 999, padding: '6px 11px', fontSize: 12.5, fontWeight: 800 }}>
            <Flame size={14} color="var(--accent)" /> {streak}
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{
              width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Logout size={17} />
          </button>
        </div>
      </div>
      <GlobalSearch onPick={onPick} variant="mobile" />
      {syncError && <div style={{ marginTop: 10 }}><SyncBadge /></div>}
    </header>
  )
}

const TABS = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'cards', label: 'Cards', Icon: Cards },
  { key: 'quiz', label: 'Quizzes', Icon: Quiz },
  { key: 'formulas', label: 'Formulas', Icon: Formula },
]

export function MobileTabBar({ screen, onNav }) {
  return (
    <nav
      style={{
        position: 'sticky', bottom: 0, zIndex: 30, background: '#fff',
        borderTop: '1px solid rgba(58,54,86,.08)', padding: '9px 8px 20px',
        display: 'flex',
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const active = screen === key
        const color = active ? 'var(--accent)' : 'rgba(58,54,86,.4)'
        return (
          <button
            key={key}
            onClick={() => onNav(key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
              fontSize: 10, fontWeight: 700, color,
            }}
          >
            <Icon size={22} color={color} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
