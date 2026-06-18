import { useState, useRef, useEffect } from 'react'
import { searchAll, topicColor, topicWash } from '../lib/content'
import { Search } from './Icons'

export default function GlobalSearch({ onPick, variant = 'desktop' }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const results = searchAll(q)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const mobile = variant === 'mobile'
  const pick = (r) => {
    setOpen(false)
    setQ('')
    onPick(r)
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: mobile ? '100%' : 360, maxWidth: '100%' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, height: 46,
          borderRadius: 999, padding: '0 16px',
          background: mobile ? 'rgba(255,255,255,.14)' : '#fff',
          border: mobile ? '1px solid rgba(255,255,255,.18)' : '1.5px solid rgba(58,54,86,.1)',
          transition: 'border-color .15s',
        }}
      >
        <Search size={18} stroke={mobile ? 'rgba(255,255,255,.8)' : 'rgba(58,54,86,.45)'} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={(e) => {
            setOpen(true)
            if (!mobile) e.currentTarget.parentElement.style.borderColor = 'var(--navy)'
          }}
          onBlur={(e) => { if (!mobile) e.currentTarget.parentElement.style.borderColor = 'rgba(58,54,86,.1)' }}
          placeholder="Search formulas & cards…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14.5, color: mobile ? '#fff' : 'var(--text)',
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="ql-pop"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 40,
            background: '#fff', borderRadius: 14, boxShadow: 'var(--sh-pop)',
            border: '1px solid rgba(58,54,86,.06)', padding: 6, transformOrigin: 'top',
          }}
        >
          {results.map((r) => (
            <button
              key={r.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(r)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                padding: '10px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F6FC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: topicWash(r.topic), color: topicColor(r.topic),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontStyle: 'italic', fontSize: 16,
                }}
              >
                {r.glyph}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(58,54,86,.5)' }}>{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && results.length === 0 && (
        <div
          className="ql-pop"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 40,
            background: '#fff', borderRadius: 14, boxShadow: 'var(--sh-pop)',
            border: '1px solid rgba(58,54,86,.06)', padding: '16px', textAlign: 'center',
            fontSize: 13.5, color: 'rgba(58,54,86,.55)',
          }}
        >
          No matches for “{q}”
        </div>
      )}
    </div>
  )
}
