import { useState } from 'react'
import logo from '../assets/quant-logo.png'
import { Mail } from '../components/Icons'

export default function SignIn({ auth }) {
  const [email, setEmail] = useState('')
  const { linkState, error, sentTo, sendMagicLink, resetLink, isConfigured } = auth
  const sending = linkState === 'sending'
  const sent = linkState === 'sent'

  const onSubmit = (e) => {
    e.preventDefault()
    if (email.trim()) sendMagicLink(email.trim())
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background:
          'radial-gradient(1100px 620px at 78% -8%, #E6DFF6 0%, rgba(230,223,246,0) 55%),' +
          'radial-gradient(900px 560px at 8% 108%, #FBE7DC 0%, rgba(251,231,220,0) 55%),' +
          'var(--canvas)',
      }}
    >
      <div
        className="ql-fade"
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 24,
          border: '1px solid rgba(58,54,86,.06)',
          boxShadow: '0 24px 70px rgba(58,54,86,.14)',
          padding: '38px 34px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 26 }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: 'var(--navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(70,65,123,.28)',
            }}
          >
            <img src={logo} alt="" width={34} height={34} style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-.01em' }}>Quant Lab</div>
            <div style={{ fontSize: 12, color: 'rgba(58,54,86,.55)' }}>GRE Quant revision</div>
          </div>
        </div>

        {!sent ? (
          <>
            <h1 style={{ fontSize: 25, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', margin: '0 0 6px' }}>
              Sign in to study
            </h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'rgba(58,54,86,.6)', margin: '0 0 24px' }}>
              We'll email you a magic link — no password needed. Your progress syncs across devices.
            </p>

            <form onSubmit={onSubmit}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(58,54,86,.5)', textTransform: 'uppercase' }}>
                Email address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', marginTop: 8, marginBottom: 16, height: 52,
                  borderRadius: 14, border: '1.5px solid rgba(58,54,86,.14)',
                  padding: '0 16px', fontSize: 16, color: 'var(--text)', outline: 'none',
                  transition: 'border-color .15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--navy)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(58,54,86,.14)')}
              />
              <button
                type="submit"
                disabled={sending || !email.trim()}
                style={{
                  width: '100%', height: 52, borderRadius: 999, border: 'none',
                  background: !email.trim() ? 'rgba(58,54,86,.12)' : 'var(--navy)',
                  color: !email.trim() ? 'rgba(58,54,86,.4)' : '#fff',
                  fontSize: 15.5, fontWeight: 800, cursor: !email.trim() || sending ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: !email.trim() ? 'none' : '0 8px 20px rgba(70,65,123,.28)',
                  transition: 'background .15s',
                }}
              >
                {sending ? (
                  <Spinner />
                ) : (
                  <>
                    <Mail size={19} /> Send magic link
                  </>
                )}
              </button>
            </form>

            {!isConfigured && (
              <Note tone="warn">
                Supabase isn't configured yet. Paste your anon key into <code>.env.local</code> and restart{' '}
                <code>npm run dev</code>.
              </Note>
            )}
            {error && <Note tone="error">{error}</Note>}
          </>
        ) : (
          <div className="ql-fade" style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: 999, margin: '0 auto 18px',
                background: 'var(--accent-wash)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Mail size={28} />
            </div>
            <h1 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>Check your email</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'rgba(58,54,86,.62)', margin: '0 0 22px' }}>
              We sent a sign-in link to <strong style={{ color: 'var(--text)' }}>{sentTo}</strong>. Click it on this
              device to land back here, signed in.
            </p>
            <button
              onClick={resetLink}
              style={{
                background: 'none', border: '1.5px solid rgba(58,54,86,.16)', borderRadius: 999,
                padding: '11px 22px', fontSize: 14, fontWeight: 700, color: 'var(--text)', cursor: 'pointer',
              }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Note({ children, tone }) {
  const map = {
    warn: { bg: 'var(--amber-wash)', fg: 'var(--amber)' },
    error: { bg: 'var(--red-wash)', fg: 'var(--red)' },
  }
  const c = map[tone] || map.warn
  return (
    <div style={{ marginTop: 16, background: c.bg, color: c.fg, borderRadius: 12, padding: '12px 14px', fontSize: 13, lineHeight: 1.5 }}>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <span
      style={{
        width: 20, height: 20, borderRadius: 999,
        border: '2.5px solid rgba(255,255,255,.35)', borderTopColor: '#fff',
        display: 'inline-block', animation: 'qlSpin .7s linear infinite',
      }}
    />
  )
}
