import { useState, useMemo, useEffect, useRef } from 'react'
import { quizzes, topics, topicColor } from '../lib/content'
import { MixedMath } from '../lib/Math'
import { ProgressRing, Eyebrow } from '../components/UI'
import { Clock, Check, Cross, ArrowR, ArrowL, Quiz as QuizIcon } from '../components/Icons'

const LENGTHS = [5, 10, 'All']

function pick(arr, n, seed) {
  const a = [...arr]
  let s = seed + 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return n === 'All' ? a : a.slice(0, Math.min(n, a.length))
}

export default function Quiz({ activeTopic, saveQuiz, isMobile }) {
  const [phase, setPhase] = useState('setup') // setup | run | results
  const [topic, setTopic] = useState(activeTopic !== 'all' ? activeTopic : 'Mixed')
  const [length, setLength] = useState(5)
  const [seed, setSeed] = useState(0)

  useEffect(() => { setTopic(activeTopic !== 'all' ? activeTopic : 'Mixed') }, [activeTopic])

  const deck = useMemo(() => {
    const pool = topic === 'Mixed' ? quizzes : quizzes.filter((q) => q.topic === topic)
    return pick(pool, length, seed)
  }, [topic, length, seed])

  const start = () => { setSeed((n) => n + 1); setPhase('run') }

  if (phase === 'setup') {
    return <Setup topic={topic} setTopic={setTopic} length={length} setLength={setLength} onStart={start} isMobile={isMobile} />
  }
  return (
    <Runner
      key={seed}
      deck={deck}
      topicLabel={topic}
      isMobile={isMobile}
      saveQuiz={saveQuiz}
      onRestart={() => setPhase('setup')}
    />
  )
}

/* ---------------- Setup ---------------- */
function Setup({ topic, setTopic, length, setLength, onStart, isMobile }) {
  const choices = ['Mixed', ...topics.map((t) => t.name)]
  return (
    <div className="ql-fade" style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px' }}>
      <Eyebrow color="var(--blue)">Quiz</Eyebrow>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '8px 0 4px' }}>Build a quiz set</h1>
      <p style={{ fontSize: 14.5, color: 'rgba(58,54,86,.6)', margin: '0 0 26px' }}>Pick a topic and how many questions you want.</p>

      <Label>Topic</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, margin: '12px 0 26px' }}>
        {choices.map((c) => {
          const active = topic === c
          const color = c === 'Mixed' ? 'var(--navy)' : topicColor(c)
          return (
            <button
              key={c}
              onClick={() => setTopic(c)}
              style={{
                borderRadius: 999, padding: '10px 16px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                border: active ? `1.5px solid ${color}` : '1.5px solid rgba(58,54,86,.1)',
                background: active ? color : '#fff', color: active ? '#fff' : 'var(--text)', transition: 'all .15s',
              }}
            >
              {c}
            </button>
          )
        })}
      </div>

      <Label>Length</Label>
      <div style={{ display: 'flex', gap: 10, margin: '12px 0 30px' }}>
        {LENGTHS.map((l) => {
          const active = length === l
          return (
            <button
              key={l}
              onClick={() => setLength(l)}
              style={{
                flex: 1, borderRadius: 14, padding: '16px 0', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                border: active ? '1.5px solid var(--blue)' : '1.5px solid rgba(58,54,86,.1)',
                background: active ? 'var(--blue-wash)' : '#fff', color: active ? 'var(--blue)' : 'var(--text)', transition: 'all .15s',
              }}
            >
              {l === 'All' ? 'All' : l}
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(58,54,86,.45)', marginTop: 2 }}>
                {l === 'All' ? 'questions' : 'questions'}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={onStart}
        style={{
          width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 999,
          padding: 16, fontSize: 15.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(70,65,123,.26)',
        }}
      >
        Start quiz →
      </button>
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(58,54,86,.5)', textTransform: 'uppercase' }}>{children}</div>
}

/* ---------------- Runner (in-question + results) ---------------- */
function Runner({ deck, topicLabel, isMobile, saveQuiz, onRestart }) {
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState(false)
  const [reviewWrong, setReviewWrong] = useState(false)
  const [answers, setAnswers] = useState([]) // { id, topic, selected, correct, isRight }
  const [secs, setSecs] = useState(deck.length * 45)
  const saved = useRef(false)

  const q = deck[qIdx]
  const total = deck.length

  // Countdown — ends the quiz when it hits 0.
  useEffect(() => {
    if (results) return
    if (secs <= 0) { finish(answers); return }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs, results])

  const finish = (finalAnswers) => {
    setResults(true)
    if (!saved.current) {
      saved.current = true
      saveQuiz(perTopicBreakdown(finalAnswers))
    }
  }

  const check = () => {
    if (selected === null) return
    const isRight = selected === q.correct
    setAnswers((a) => [...a, { id: q.id, topic: q.topic, selected, correct: q.correct, isRight, q }])
    setAnswered(true)
  }

  const next = () => {
    if (qIdx + 1 >= total) {
      finish(answers)
    } else {
      setQIdx((i) => i + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  if (results) {
    return (
      <Results
        answers={answers}
        total={total}
        reviewWrong={reviewWrong}
        setReviewWrong={setReviewWrong}
        onRestart={onRestart}
        isMobile={isMobile}
      />
    )
  }

  const accent = topicLabel === 'Mixed' ? 'var(--blue)' : topicColor(topicLabel)
  const pct = Math.round(((qIdx + (answered ? 1 : 0)) / total) * 100)

  return (
    <div className="ql-fade" style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '20px 16px 28px' : '34px 40px 56px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <Eyebrow color="var(--blue)">{q.topic} Quiz</Eyebrow>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '6px 0 0' }}>
            Question {qIdx + 1} <span style={{ color: 'rgba(58,54,86,.4)' }}>of {total}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1.5px solid rgba(58,54,86,.1)', borderRadius: 999, padding: '8px 14px', fontSize: 14, fontWeight: 800, color: secs <= 15 ? 'var(--red)' : 'var(--text)' }}>
          <Clock size={16} stroke={secs <= 15 ? 'var(--red)' : 'rgba(58,54,86,.5)'} /> {fmt(secs)}
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(58,54,86,.07)', overflow: 'hidden', margin: '16px 0 22px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: accent, borderRadius: 999, transition: 'width .35s var(--ease)' }} />
      </div>

      {/* Question card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: isMobile ? '22px 20px' : '32px 32px 28px', boxShadow: 'var(--sh-card)', border: '1px solid rgba(58,54,86,.05)' }}>
        <div style={{ fontSize: isMobile ? 19 : 23, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)', marginBottom: 22 }}>
          {q.questionLatex ? <MixedMath text={q.questionLatex} /> : q.question}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {q.options.map((opt, i) => (
            <Option key={i} idx={i} text={opt} q={q} selected={selected} answered={answered} onSelect={() => !answered && setSelected(i)} isMobile={isMobile} />
          ))}
        </div>

        {answered && <Feedback isRight={selected === q.correct} explanation={q.explanation} />}
      </div>

      {/* Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        {!answered ? (
          <button
            onClick={check}
            disabled={selected === null}
            style={{
              width: isMobile ? '100%' : 'auto',
              background: selected === null ? 'rgba(58,54,86,.12)' : 'var(--blue)',
              color: selected === null ? 'rgba(58,54,86,.4)' : '#fff',
              border: 'none', borderRadius: 999, padding: '14px 30px', fontSize: 14.5, fontWeight: 800,
              cursor: selected === null ? 'not-allowed' : 'pointer',
              boxShadow: selected === null ? 'none' : '0 6px 16px rgba(97,137,180,.28)',
            }}
          >
            Check answer
          </button>
        ) : (
          <button
            onClick={next}
            style={{
              width: isMobile ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 999, padding: '14px 28px',
              fontSize: 14.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(70,65,123,.24)',
            }}
          >
            {qIdx + 1 >= total ? 'See results' : 'Next question'} <ArrowR size={17} color="#fff" />
          </button>
        )}
      </div>
    </div>
  )
}

function Option({ idx, text, q, selected, answered, onSelect, isMobile }) {
  const optCorrect = idx === q.correct
  const optSel = idx === selected
  let bg = '#fff', border = '1.5px solid rgba(58,54,86,.12)', col = 'var(--text)', keyBg = '#F8F6FC', keyCol = 'var(--navy)', badge = null
  if (!answered) {
    if (optSel) { border = '1.5px solid var(--navy)'; bg = '#F8F6FC'; keyBg = 'var(--navy)'; keyCol = '#fff' }
  } else if (optCorrect) {
    bg = 'var(--green-wash)'; border = '1.5px solid var(--green)'; keyBg = 'var(--green-deep)'; keyCol = '#fff'; badge = 'check'
  } else if (optSel) {
    bg = 'var(--red-wash)'; border = '1.5px solid var(--red)'; keyBg = 'var(--red)'; keyCol = '#fff'; badge = 'cross'
  } else {
    border = '1.5px solid rgba(58,54,86,.08)'; col = 'rgba(58,54,86,.42)'; keyCol = 'rgba(58,54,86,.4)'
  }
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 11,
        background: bg, border, color: col, cursor: answered ? 'default' : 'pointer',
        transition: 'all .15s', fontSize: isMobile ? 16 : 17, fontWeight: 500, textAlign: 'left', width: '100%',
      }}
    >
      <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, background: keyBg, color: keyCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
        {'ABCD'[idx]}
      </span>
      <span style={{ flex: 1 }}><MixedMath text={text} /></span>
      {badge === 'check' && <Check size={20} stroke="var(--green-deep)" />}
      {badge === 'cross' && <Cross size={20} stroke="var(--red)" />}
    </button>
  )
}

function Feedback({ isRight, explanation }) {
  return (
    <div
      className="ql-fade"
      style={{
        marginTop: 18, borderRadius: 14, padding: '18px 20px',
        background: isRight ? 'var(--green-wash)' : 'var(--red-wash)',
        border: '1px solid ' + (isRight ? 'rgba(108,190,150,.4)' : 'rgba(230,128,119,.35)'),
        display: 'flex', gap: 14,
      }}
    >
      <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 999, background: isRight ? 'var(--green)' : 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isRight ? <Check size={17} stroke="#fff" /> : <Cross size={16} stroke="#fff" />}
      </span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: isRight ? 'var(--green-deep)' : 'var(--red)', marginBottom: 3 }}>
          {isRight ? "Nice — that's right!" : "Not quite — here's why"}
        </div>
        <div style={{ fontSize: 14.5, color: 'rgba(58,54,86,.7)', lineHeight: 1.5 }}>{explanation}</div>
      </div>
    </div>
  )
}

/* ---------------- Results ---------------- */
function Results({ answers, total, reviewWrong, setReviewWrong, onRestart, isMobile }) {
  const correct = answers.filter((a) => a.isRight).length
  const pct = Math.round((correct / total) * 100)
  const breakdown = perTopicBreakdown(answers)
  const wrong = answers.filter((a) => !a.isRight)

  if (reviewWrong) {
    return (
      <div className="ql-fade" style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '20px 16px 28px' : '34px 40px 56px' }}>
        <button onClick={() => setReviewWrong(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
          <ArrowL size={17} /> Back to results
        </button>
        <h1 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 4px' }}>Review wrong answers</h1>
        <p style={{ fontSize: 14, color: 'rgba(58,54,86,.6)', margin: '0 0 22px' }}>{wrong.length} to revisit</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {wrong.map((a) => (
            <div key={a.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid rgba(58,54,86,.06)', boxShadow: 'var(--sh-card)' }}>
              <Eyebrow color={topicColor(a.topic)}>{a.topic}</Eyebrow>
              <div style={{ fontSize: 17, fontWeight: 700, margin: '8px 0 12px', lineHeight: 1.4 }}>
                {a.q.questionLatex ? <MixedMath text={a.q.questionLatex} /> : a.q.question}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', background: 'var(--red-wash)', borderRadius: 999, padding: '5px 12px' }}>
                  You: <MixedMath text={a.q.options[a.selected]} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-deep)', background: 'var(--green-wash)', borderRadius: 999, padding: '5px 12px' }}>
                  Correct: <MixedMath text={a.q.options[a.correct]} />
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'rgba(58,54,86,.7)', lineHeight: 1.5 }}>{a.q.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="ql-fade" style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '20px 16px 28px' : '34px 40px 56px' }}>
      {/* Scorecard */}
      <div style={{ background: '#fff', borderRadius: 24, padding: isMobile ? '28px 20px' : '40px', textAlign: 'center', boxShadow: 'var(--sh-card)', border: '1px solid rgba(58,54,86,.05)' }}>
        <Eyebrow color="var(--accent)" style={{ justifyContent: 'center' }}>Quiz complete</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 18px' }}>
          <ProgressRing
            size={150}
            pct={pct}
            color="var(--green)"
            track="rgba(58,54,86,.07)"
            innerScale={0.74}
            inner={
              <>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)' }}>{correct}/{total}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(58,54,86,.5)' }}>{pct}% correct</div>
              </>
            }
          />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>{headline(pct)}</h1>
        <p style={{ fontSize: 14.5, color: 'rgba(58,54,86,.6)', margin: 0 }}>{focusLine(breakdown)}</p>
      </div>

      {/* Per-topic breakdown */}
      <div style={{ background: '#fff', borderRadius: 20, padding: isMobile ? '20px' : '24px 28px', marginTop: 16, boxShadow: 'var(--sh-card)', border: '1px solid rgba(58,54,86,.05)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>By topic</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {breakdown.map((b) => {
            const p = Math.round((b.correct / b.total) * 100)
            const color = p >= 100 ? 'var(--green)' : p >= 50 ? 'var(--accent)' : 'var(--red)'
            return (
              <div key={b.topic} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: isMobile ? 110 : 150, flexShrink: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{b.topic}</span>
                <span style={{ flex: 1, height: 8, borderRadius: 999, background: 'rgba(58,54,86,.07)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${p}%`, background: color, borderRadius: 999, transition: 'width .5s var(--ease)' }} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color, width: 40, textAlign: 'right' }}>{b.correct}/{b.total}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 12, marginTop: 18, flexDirection: isMobile ? 'column' : 'row' }}>
        {wrong.length > 0 && (
          <button
            onClick={() => setReviewWrong(true)}
            style={{ flex: 1, background: 'var(--red-wash)', color: 'var(--red)', border: 'none', borderRadius: 999, padding: 15, fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}
          >
            Review my {wrong.length} wrong {wrong.length === 1 ? 'answer' : 'answers'}
          </button>
        )}
        <button
          onClick={onRestart}
          style={{ flex: 1, background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 999, padding: 15, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(70,65,123,.26)' }}
        >
          Try another set
        </button>
      </div>
    </div>
  )
}

function perTopicBreakdown(answers) {
  const agg = {}
  for (const a of answers) {
    if (!agg[a.topic]) agg[a.topic] = { topic: a.topic, correct: 0, total: 0 }
    agg[a.topic].total += 1
    if (a.isRight) agg[a.topic].correct += 1
  }
  return Object.values(agg)
}

function headline(pct) {
  if (pct >= 90) return 'Outstanding!'
  if (pct >= 70) return 'Great work!'
  if (pct >= 50) return 'Good progress'
  return 'Keep practising'
}
function focusLine(breakdown) {
  const weakest = [...breakdown].sort((a, b) => a.correct / a.total - b.correct / b.total)[0]
  if (!weakest) return 'Nice session.'
  if (weakest.correct === weakest.total) return 'Solid across every topic — keep the streak going.'
  return `Spend a little more time on ${weakest.topic}.`
}
function fmt(s) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}
