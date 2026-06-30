import { topics, countsFor, totals } from '../lib/content'
import { ProgressRing, TopicChip, Eyebrow } from '../components/UI'
import { Cards, Quiz, Formula, ArrowR, Flame } from '../components/Icons'

export default function Home({ name, goalDone, goalTotal, onNav, topic, setTopic, weak, isMobile }) {
  const pct = Math.min(100, Math.round((goalDone / goalTotal) * 100))
  const remaining = Math.max(0, goalTotal - goalDone)

  const actions = [
    { key: 'cards', title: 'Flashcards', Icon: Cards, tileBg: 'var(--accent-wash)', tint: 'var(--accent)', meta: `${totals.cards} cards · flip to recall`, metaColor: 'var(--accent)' },
    { key: 'quiz', title: 'Quizzes', Icon: Quiz, tileBg: 'var(--blue-wash)', tint: 'var(--blue)', meta: `${totals.quizzes} questions · mixed topics`, metaColor: 'var(--blue)' },
    { key: 'formulas', title: 'Formula sheet', Icon: Formula, tileBg: 'var(--teal-wash)', tint: 'var(--teal)', meta: `${totals.formulas} formulas · ${totals.topics} topics`, metaColor: 'var(--teal)' },
  ]

  return (
    <div className="ql-fade" style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '20px 16px 28px' : '34px 40px 56px' }}>
      {/* Greeting banner */}
      <div
        style={{
          borderRadius: 24, padding: isMobile ? 18 : '32px 36px',
          background: 'linear-gradient(135deg,#D7D0F2,#E6DFF6 55%,#FBE7DC)',
          border: '1px solid rgba(70,65,123,.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        }}
      >
        <div>
          <Eyebrow color="rgba(70,65,123,.6)" style={{ letterSpacing: '.08em' }}>
            {greeting()}, {name}
          </Eyebrow>
          <h1 style={{ fontSize: isMobile ? 18 : 27, fontWeight: 800, color: '#3B3766', letterSpacing: '-.02em', margin: '8px 0 6px' }}>
            Ready for a quick session?
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 14.5, color: 'rgba(59,55,102,.7)', margin: '0 0 18px' }}>
            {goalDone}/{goalTotal} cards reviewed today · {remaining} to hit your goal.
          </p>
          <button
            onClick={() => onNav('cards')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--navy)', color: '#fff',
              border: 'none', borderRadius: 999, padding: isMobile ? '11px 18px' : '13px 22px',
              fontSize: 14.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(70,65,123,.26)',
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--navy-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--navy)')}
          >
            Continue practising <ArrowR size={18} color="#fff" />
          </button>
        </div>
        <ProgressRing
          size={isMobile ? 74 : 120}
          pct={pct}
          color="var(--accent)"
          inner={
            <div style={{ fontSize: isMobile ? 18 : 26, fontWeight: 800, color: '#3B3766' }}>{pct}%</div>
          }
        />
      </div>

      {/* Action cards */}
      <div
        style={{
          display: 'grid', gap: isMobile ? 12 : 20, marginTop: isMobile ? 16 : 24,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
        }}
      >
        {actions.map((a) =>
          isMobile ? (
            <ActionRow key={a.key} {...a} onClick={() => onNav(a.key)} />
          ) : (
            <ActionCard key={a.key} {...a} onClick={() => onNav(a.key)} />
          )
        )}
      </div>

      {/* Focus areas (weak topics from quiz history) */}
      {weak.length > 0 && (
        <section style={{ marginTop: isMobile ? 26 : 36 }}>
          <SectionHead title="Focus areas" caption="from your quiz history" />
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', marginTop: 14 }}>
            {weak.map((w) => (
              <button
                key={w.topic}
                onClick={() => { setTopic(w.topic); onNav('quiz') }}
                style={{
                  textAlign: 'left', background: '#fff', border: '1px solid rgba(58,54,86,.06)', borderRadius: 16,
                  padding: 16, cursor: 'pointer', boxShadow: 'var(--sh-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text)' }}>{w.topic}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: w.pct < 50 ? 'var(--red)' : 'var(--amber)' }}>{w.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(58,54,86,.07)', marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${w.pct}%`, background: w.pct < 50 ? 'var(--red)' : 'var(--amber)', borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(58,54,86,.5)', marginTop: 8 }}>Practise to improve →</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Pick a topic */}
      <section style={{ marginTop: isMobile ? 26 : 36 }}>
        <SectionHead title="Pick a topic" caption={`${totals.topics} topics`} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {topics.map((t) => (
            <TopicChip
              key={t.id}
              name={t.name}
              count={countsFor(t.name).cards + countsFor(t.name).formulas}
              active={topic === t.name}
              onClick={() => setTopic(topic === t.name ? 'all' : t.name)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function SectionHead({ title, caption }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 12.5, color: 'rgba(58,54,86,.45)' }}>{caption}</span>
    </div>
  )
}

function ActionCard({ title, Icon, tileBg, tint, meta, metaColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', background: '#fff', borderRadius: 18, padding: 26,
        border: '1px solid rgba(58,54,86,.06)', boxShadow: 'var(--sh-card)', cursor: 'pointer',
        transition: 'transform .15s var(--ease), box-shadow .15s var(--ease)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--sh-lift)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--sh-card)' }}
    >
      <div style={{ width: 50, height: 50, borderRadius: 14, background: tileBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={26} color={tint} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'rgba(58,54,86,.6)', margin: '6px 0 14px', lineHeight: 1.45 }}>
        {descFor(title)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: metaColor, display: 'flex', alignItems: 'center', gap: 5 }}>
        {meta} <ArrowR size={14} color={metaColor} />
      </div>
    </button>
  )
}

function ActionRow({ title, Icon, tileBg, tint, meta, metaColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
        background: '#fff', borderRadius: 16, padding: 14,
        border: '1px solid rgba(58,54,86,.06)', boxShadow: 'var(--sh-card)', cursor: 'pointer',
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 13, background: tileBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} color={tint} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: metaColor }}>{meta}</div>
      </div>
      <ArrowR size={18} color="rgba(58,54,86,.3)" />
    </button>
  )
}

function descFor(title) {
  if (title === 'Flashcards') return 'Flip-to-reveal recall on key formulas and facts.'
  if (title === 'Quizzes') return 'Timed multiple-choice with instant explanations.'
  return 'Every formula, grouped and searchable.'
}
