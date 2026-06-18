import logo from '../assets/quant-logo.png'
import { Home, Cards, Quiz, Formula, Flame } from './Icons'

const NAV = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'cards', label: 'Flashcards', Icon: Cards },
  { key: 'quiz', label: 'Quizzes', Icon: Quiz },
  { key: 'formulas', label: 'Formula sheet', Icon: Formula },
]

export default function Sidebar({ screen, onNav, streak, goalDone, goalTotal }) {
  const pct = Math.min(100, Math.round((goalDone / goalTotal) * 100))
  return (
    <aside
      style={{
        width: 248, flexShrink: 0, background: 'var(--navy)', color: '#fff',
        padding: '24px 16px', position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 6px', marginBottom: 28 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 11, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,.18)',
          }}
        >
          <img src={logo} alt="" width={34} height={34} style={{ objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em' }}>Quant Lab</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>GRE revision</div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.13em', color: 'rgba(255,255,255,.4)', padding: '0 8px 10px' }}>
        PRACTICE
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ key, label, Icon }) => {
          const active = screen === key
          return (
            <button
              key={key}
              onClick={() => onNav(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px',
                borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 14.5,
                textAlign: 'left', width: '100%',
                fontWeight: active ? 800 : 600,
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--navy)' : 'rgba(255,255,255,.78)',
                transition: 'background .15s, color .15s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.08)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={20} color={active ? 'var(--navy)' : '#fff'} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Streak card */}
      <div
        style={{
          marginTop: 'auto', background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800 }}>
          <Flame size={18} color="var(--accent)" /> {streak}-day streak
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', margin: '8px 0 9px' }}>
          {goalDone} of {goalTotal} cards today
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 999, transition: 'width .5s var(--ease)' }} />
        </div>
      </div>
    </aside>
  )
}
