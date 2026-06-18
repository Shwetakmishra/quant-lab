import { useMemo, useState, useEffect } from 'react'
import { flashcards, topics, topicColor } from '../lib/content'
import Tex from '../lib/Math'
import { Eyebrow } from '../components/UI'
import { Shuffle, ArrowL, ArrowR, Check, Cards as CardsIcon } from '../components/Icons'

function shuffled(arr, seed) {
  // Deterministic-ish shuffle so re-renders within a session stay stable.
  const a = [...arr]
  let s = seed + 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcards({ activeTopic, cardStatus, markCard, isMobile }) {
  const [topic, setTopic] = useState(activeTopic !== 'all' ? activeTopic : 'all')
  const [shuffle, setShuffle] = useState(false)
  const [seed, setSeed] = useState(0)
  const [markedOnly, setMarkedOnly] = useState(false)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { setTopic(activeTopic !== 'all' ? activeTopic : 'all') }, [activeTopic])

  const deck = useMemo(() => {
    let d = topic === 'all' ? flashcards : flashcards.filter((c) => c.topic === topic)
    if (markedOnly) d = d.filter((c) => cardStatus[c.id] === 'review')
    return shuffle ? shuffled(d, seed) : d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, markedOnly, shuffle, seed, cardStatus])

  useEffect(() => { setIdx(0); setFlipped(false) }, [topic, markedOnly, shuffle, seed])

  const total = deck.length
  const card = deck[Math.min(idx, total - 1)]
  const known = deck.filter((c) => cardStatus[c.id] === 'known').length
  const review = deck.filter((c) => cardStatus[c.id] === 'review').length
  const markedCount = (topic === 'all' ? flashcards : flashcards.filter((c) => c.topic === topic)).filter((c) => cardStatus[c.id] === 'review').length

  const go = (delta) => { setFlipped(false); setIdx((i) => (i + delta + total) % total) }
  const advance = () => { setFlipped(false); setIdx((i) => (i + 1) % total) }
  const gotIt = () => { markCard(card.id, 'known'); advance() }
  const reviewAgain = () => { markCard(card.id, 'review'); advance() }

  const accent = topic === 'all' ? 'var(--accent)' : topicColor(topic)
  const pct = total ? Math.round(((Math.min(idx, total - 1) + 1) / total) * 100) : 0

  return (
    <div className="ql-fade" style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '20px 16px 28px' : '34px 40px 56px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 14, flexDirection: isMobile ? 'column' : 'row' }}>
        <div>
          <Eyebrow color={accent}>{(topic === 'all' ? 'All topics' : topic)} · Flashcards</Eyebrow>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '6px 0 0' }}>
            {total ? `Card ${Math.min(idx, total - 1) + 1} ` : 'No cards '}
            <span style={{ color: 'rgba(58,54,86,.4)' }}>{total ? `of ${total}` : 'to study'}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Pill bg="var(--green-wash)" fg="var(--green-deep)">{known} known</Pill>
          <Pill bg="var(--amber-wash)" fg="var(--amber)">{review} to review</Pill>
          <button
            onClick={() => { setShuffle((s) => !s); setSeed((n) => n + 1) }}
            title="Shuffle"
            style={{
              display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '8px 14px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: shuffle ? '1.5px solid var(--navy)' : '1.5px solid rgba(58,54,86,.12)',
              background: shuffle ? 'var(--navy)' : '#fff',
              color: shuffle ? '#fff' : 'var(--text)',
              transition: 'all .15s',
            }}
          >
            <Shuffle size={16} color={shuffle ? '#fff' : 'var(--text)'} /> Shuffle
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
        <FilterChip active={topic === 'all'} onClick={() => setTopic('all')}>All</FilterChip>
        {topics.map((t) => (
          <FilterChip key={t.id} active={topic === t.name} color={t.color} onClick={() => setTopic(t.name)}>
            {t.name}
          </FilterChip>
        ))}
        <div style={{ width: 1, background: 'rgba(58,54,86,.12)', margin: '0 2px', flexShrink: 0 }} />
        <FilterChip active={markedOnly} color="var(--amber)" onClick={() => setMarkedOnly((m) => !m)}>
          ★ Marked {markedCount > 0 ? `(${markedCount})` : ''}
        </FilterChip>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(58,54,86,.07)', overflow: 'hidden', margin: '16px 0 22px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: accent, borderRadius: 999, transition: 'width .35s var(--ease)' }} />
      </div>

      {total === 0 ? (
        <EmptyDeck markedOnly={markedOnly} onReset={() => { setMarkedOnly(false); setTopic('all') }} />
      ) : (
        <>
          {/* Flip card */}
          <div style={{ perspective: 1800 }}>
            <div
              onClick={() => setFlipped((f) => !f)}
              style={{
                position: 'relative', width: '100%', height: isMobile ? 340 : 380, cursor: 'pointer',
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform .55s var(--ease)',
              }}
            >
              {/* Front */}
              <Face shadow="var(--sh-flip-front)" bg="#fff">
                <Eyebrow color="var(--accent)">Prompt</Eyebrow>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: isMobile ? 21 : 28, fontWeight: 700, color: 'var(--text)', textAlign: 'center', textWrap: 'balance', lineHeight: 1.35, margin: 0 }}>
                    {card.front}
                  </p>
                </div>
                <Hint dark>{isMobile ? 'Tap to flip' : 'Click to flip'}</Hint>
              </Face>

              {/* Back */}
              <Face
                back
                shadow="var(--sh-flip-back)"
                bg="linear-gradient(150deg,#534D92,#6B62A8)"
              >
                <Eyebrow color="var(--accent)">Answer</Eyebrow>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#fff' }}>
                  <div style={{ color: '#fff' }}>
                    <Tex tex={card.latex} block />
                  </div>
                  <p style={{ fontSize: isMobile ? 14 : 15.5, color: 'rgba(255,255,255,.78)', textAlign: 'center', lineHeight: 1.5, margin: 0, maxWidth: 460 }}>
                    {card.answer}
                  </p>
                </div>
                <Hint>{isMobile ? 'Tap to flip back' : 'Click to flip back'}</Hint>
              </Face>
            </div>
          </div>

          {/* Controls */}
          {isMobile ? (
            <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <CtrlBtn variant="review" onClick={reviewAgain} full>Review again</CtrlBtn>
                <CtrlBtn variant="got" onClick={gotIt} full>Got it</CtrlBtn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <CtrlBtn variant="ghost" onClick={() => go(-1)} full><ArrowL size={17} /> Prev</CtrlBtn>
                <CtrlBtn variant="navy" onClick={() => go(1)} full>Next <ArrowR size={17} color="#fff" /></CtrlBtn>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
              <CtrlBtn variant="ghost" onClick={() => go(-1)}><ArrowL size={17} /> Prev</CtrlBtn>
              <div style={{ display: 'flex', gap: 10 }}>
                <CtrlBtn variant="review" onClick={reviewAgain}>Review again</CtrlBtn>
                <CtrlBtn variant="got" onClick={gotIt}><Check size={17} color="#fff" /> Got it</CtrlBtn>
              </div>
              <CtrlBtn variant="navy" onClick={() => go(1)}>Next <ArrowR size={17} color="#fff" /></CtrlBtn>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Face({ children, back, shadow, bg }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: 24, padding: 28,
        backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : 'none',
        background: bg, boxShadow: shadow,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}

function Hint({ children, dark }) {
  return (
    <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: dark ? 'rgba(58,54,86,.4)' : 'rgba(255,255,255,.6)' }}>
      {children}
    </div>
  )
}

function Pill({ children, bg, fg }) {
  return (
    <span style={{ background: bg, color: fg, borderRadius: 999, padding: '7px 13px', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function FilterChip({ children, active, color = 'var(--navy)', onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        border: active ? `1.5px solid ${color}` : '1.5px solid rgba(58,54,86,.1)',
        background: active ? color : '#fff',
        color: active ? '#fff' : 'var(--text)',
        transition: 'all .15s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function CtrlBtn({ children, variant, onClick, full }) {
  const styles = {
    ghost: { background: '#fff', color: 'var(--text)', border: '1.5px solid rgba(58,54,86,.14)' },
    navy: { background: 'var(--navy)', color: '#fff', border: 'none', boxShadow: '0 6px 16px rgba(70,65,123,.24)' },
    review: { background: 'var(--amber-wash)', color: 'var(--amber)', border: 'none' },
    got: { background: 'var(--green)', color: '#fff', border: 'none', boxShadow: '0 6px 16px rgba(108,190,150,.3)' },
  }[variant]
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 999, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, cursor: 'pointer',
        width: full ? '100%' : 'auto', ...styles,
      }}
    >
      {children}
    </button>
  )
}

function EmptyDeck({ markedOnly, onReset }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 24, border: '1px solid rgba(58,54,86,.06)', boxShadow: 'var(--sh-card)' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--accent-wash)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CardsIcon size={28} color="var(--accent)" />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
        {markedOnly ? 'No cards marked for review' : 'No cards here yet'}
      </h3>
      <p style={{ fontSize: 14, color: 'rgba(58,54,86,.6)', margin: '0 0 18px' }}>
        {markedOnly ? 'Mark cards “Review again” while studying to build a focused deck.' : 'Try another topic.'}
      </p>
      <button onClick={onReset} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
        Study all cards
      </button>
    </div>
  )
}
