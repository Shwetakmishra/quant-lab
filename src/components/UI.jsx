// Small shared presentational primitives.

export function ProgressRing({ size = 120, pct = 0, color = 'var(--accent)', track = 'rgba(255,255,255,.6)', inner, innerBg = '#fff', innerScale = 0.75 }) {
  const innerSize = Math.round(size * innerScale)
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${color} ${pct}%, ${track} 0)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .5s var(--ease)',
      }}
    >
      <div
        style={{
          width: innerSize, height: innerSize, borderRadius: '50%', background: innerBg,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {inner}
      </div>
    </div>
  )
}

export function TopicChip({ name, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
        fontSize: 13.5, fontWeight: 700, padding: '10px 9px 10px 17px', borderRadius: 999,
        background: active ? 'var(--navy)' : '#fff',
        color: active ? '#fff' : 'var(--navy)',
        border: active ? '1.5px solid var(--navy)' : '1.5px solid rgba(58,54,86,.1)',
        transition: 'all .15s',
      }}
    >
      {name}
      <span
        style={{
          background: active ? 'rgba(255,255,255,.2)' : 'var(--canvas)',
          color: active ? '#fff' : 'rgba(58,54,86,.5)',
          borderRadius: 999, padding: '1px 9px', fontSize: 11,
        }}
      >
        {count}
      </span>
    </button>
  )
}

export function Eyebrow({ children, color = 'var(--accent)', style }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color, textTransform: 'uppercase', ...style }}>
      {children}
    </div>
  )
}
