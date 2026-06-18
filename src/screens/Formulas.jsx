import { useState, useMemo } from 'react'
import { formulaSections } from '../lib/content'
import Math from '../lib/Math'
import { Eyebrow } from '../components/UI'
import { Search, Chevron } from '../components/Icons'

export default function Formulas({ initialQuery = '', isMobile }) {
  const [query, setQuery] = useState(initialQuery)
  // Manual open/closed state — first three open by default (per design).
  const [open, setOpen] = useState(() =>
    Object.fromEntries(formulaSections.map((s, i) => [s.key, i < 3]))
  )

  const q = query.trim().toLowerCase()
  const searching = q.length > 0

  const view = useMemo(() => {
    if (!searching) {
      return formulaSections.map((s) => ({ ...s, expanded: open[s.key], items: s.items }))
    }
    return formulaSections
      .map((s) => {
        const sectionMatch = s.name.toLowerCase().includes(q)
        const items = sectionMatch ? s.items : s.items.filter((f) => f.label.toLowerCase().includes(q))
        return { ...s, items, expanded: true }
      })
      .filter((s) => s.items.length > 0)
  }, [q, searching, open])

  const matchCount = searching ? view.reduce((n, s) => n + s.items.length, 0) : 0

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }))

  return (
    <div className="ql-fade" style={{ maxWidth: 820, margin: '0 auto', padding: isMobile ? '20px 16px 28px' : '34px 40px 56px' }}>
      <Eyebrow color="var(--teal)">Reference</Eyebrow>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '8px 0 18px' }}>Formula sheet</h1>

      {/* Search */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 11, height: 52, borderRadius: 14, padding: '0 16px', background: '#fff', border: '1.5px solid rgba(58,54,86,.12)', transition: 'border-color .15s' }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
        onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(58,54,86,.12)')}
      >
        <Search size={19} stroke="rgba(58,54,86,.45)" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search formulas — e.g. distance, σ, discriminant…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15.5, color: 'var(--text)' }}
        />
        {searching && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(58,54,86,.4)', fontSize: 13, fontWeight: 700 }}>
            Clear
          </button>
        )}
      </div>

      {searching && (
        <div style={{ fontSize: 13, color: 'rgba(58,54,86,.55)', margin: '14px 2px 0' }}>
          {matchCount} {matchCount === 1 ? 'formula' : 'formulas'} match
        </div>
      )}

      {/* Sections */}
      {view.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {view.map((s) => (
            <section key={s.key} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(58,54,86,.05)', boxShadow: 'var(--sh-card)', overflow: 'hidden' }}>
              <button
                onClick={() => !searching && toggle(s.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: isMobile ? '15px 18px' : '18px 22px', background: 'none', border: 'none',
                  cursor: searching ? 'default' : 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
                  {s.name}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(58,54,86,.4)' }}>{s.items.length}</span>
                </span>
                <Chevron size={18} stroke="rgba(58,54,86,.4)" style={{ transform: s.expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>

              {s.expanded && (
                <div style={{ padding: isMobile ? '0 18px 6px' : '0 22px 8px' }}>
                  {s.items.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', gap: isMobile ? 6 : 16,
                        padding: isMobile ? '13px 0' : '15px 0', borderTop: '1px solid rgba(58,54,86,.07)',
                        flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center',
                      }}
                    >
                      <span style={{ fontSize: 14, color: 'rgba(58,54,86,.62)', flex: 1 }}>{f.label}</span>
                      <span style={{ fontSize: 20, fontWeight: 600, color: '#3A3656' }}>
                        <Math tex={f.latex} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ query }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', marginTop: 14 }}>
      <div style={{ width: 60, height: 60, borderRadius: 999, background: 'var(--teal-wash)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Search size={26} stroke="var(--teal)" />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>No formulas match</h3>
      <p style={{ fontSize: 14, color: 'rgba(58,54,86,.55)', margin: 0 }}>
        Nothing for “{query}”. Try a topic name or a symbol like σ, √, or π.
      </p>
    </div>
  )
}
