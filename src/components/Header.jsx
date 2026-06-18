import GlobalSearch from './GlobalSearch'
import { Flame, Logout } from './Icons'

export default function Header({ onPick, streak, initials, onSignOut, syncError }) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '18px 40px',
        background: 'rgba(248,246,252,.86)', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(58,54,86,.07)',
      }}
    >
      <GlobalSearch onPick={onPick} variant="desktop" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {syncError && <SyncBadge />}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-wash)',
            color: 'var(--brown)', borderRadius: 999, padding: '7px 13px', fontSize: 13, fontWeight: 800,
          }}
        >
          <Flame size={15} color="var(--brown)" /> {streak}
        </div>
        <div
          style={{
            width: 42, height: 42, borderRadius: 999, background: 'var(--navy)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800,
          }}
        >
          {initials}
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          style={{
            width: 42, height: 42, borderRadius: 999, border: '1.5px solid rgba(58,54,86,.12)',
            background: '#fff', color: 'rgba(58,54,86,.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(58,54,86,.12)'; e.currentTarget.style.color = 'rgba(58,54,86,.6)' }}
        >
          <Logout size={19} />
        </button>
      </div>
    </header>
  )
}

export function SyncBadge() {
  return (
    <span
      title="Changes are saved locally and will sync when the connection returns."
      style={{
        fontSize: 12, fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-wash)',
        borderRadius: 999, padding: '6px 12px', whiteSpace: 'nowrap',
      }}
    >
      Offline · saved locally
    </span>
  )
}
