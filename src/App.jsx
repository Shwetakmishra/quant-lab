import { useState, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProgress, weakTopics } from './hooks/useProgress'
import { useIsMobile } from './hooks/useMediaQuery'
import SignIn from './screens/SignIn'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { MobileTopBar, MobileTabBar } from './components/MobileChrome'
import Home from './screens/Home'
import Flashcards from './screens/Flashcards'
import Quiz from './screens/Quiz'
import Formulas from './screens/Formulas'
import logo from './assets/quant-logo.png'

const DAILY_GOAL = 25

export default function App() {
  const auth = useAuth()

  if (auth.loading) return <Splash />
  if (!auth.session) return <SignIn auth={auth} />
  return <AppShell auth={auth} />
}

function AppShell({ auth }) {
  const user = auth.user
  const isMobile = useIsMobile()
  const { cardStatus, attempts, syncError, markCard, saveQuiz } = useProgress(user.id)

  const [screen, setScreen] = useState('home')
  const [topic, setTopic] = useState('all')
  const [formulaQuery, setFormulaQuery] = useState('')
  const [formulaSeed, setFormulaSeed] = useState(0)

  const goalDone = useMemo(() => Object.values(cardStatus).filter((s) => s === 'known').length, [cardStatus])
  const weak = useMemo(() => weakTopics(attempts), [attempts])
  const streak = useMemo(() => computeStreak(attempts), [attempts])
  const initials = useMemo(() => initialsFrom(user.email), [user.email])

  const nav = (s) => { setScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const onSearchPick = (r) => {
    if (r.screen === 'formulas') {
      setFormulaQuery(r.label)
      setFormulaSeed((n) => n + 1)
      nav('formulas')
    } else if (r.screen === 'cards') {
      setTopic(r.topic)
      nav('cards')
    }
  }

  const content = (() => {
    switch (screen) {
      case 'cards':
        return <Flashcards activeTopic={topic} cardStatus={cardStatus} markCard={markCard} isMobile={isMobile} />
      case 'quiz':
        return <Quiz activeTopic={topic} saveQuiz={saveQuiz} isMobile={isMobile} />
      case 'formulas':
        return <Formulas key={formulaSeed} initialQuery={formulaQuery} isMobile={isMobile} />
      default:
        return (
          <Home
            name={initials === 'SK' ? 'Shweta' : namePart(user.email)}
            goalDone={goalDone}
            goalTotal={DAILY_GOAL}
            onNav={nav}
            topic={topic}
            setTopic={setTopic}
            weak={weak}
            isMobile={isMobile}
          />
        )
    }
  })()

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)' }}>
        <MobileTopBar onPick={onSearchPick} streak={streak} onSignOut={auth.signOut} syncError={syncError} />
        <main style={{ flex: 1 }}>{content}</main>
        <MobileTabBar screen={screen} onNav={nav} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--canvas)' }}>
      <Sidebar screen={screen} onNav={nav} streak={streak} goalDone={goalDone} goalTotal={DAILY_GOAL} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header onPick={onSearchPick} streak={streak} initials={initials} onSignOut={auth.signOut} syncError={syncError} />
        <main style={{ flex: 1 }}>{content}</main>
      </div>
    </div>
  )
}

function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 15, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(70,65,123,.28)' }}>
          <img src={logo} alt="" width={40} height={40} style={{ objectFit: 'contain' }} />
        </div>
        <span style={{ width: 22, height: 22, borderRadius: 999, border: '3px solid rgba(70,65,123,.18)', borderTopColor: 'var(--navy)', animation: 'qlSpin .7s linear infinite' }} />
      </div>
    </div>
  )
}

function initialsFrom(email = '') {
  const local = email.split('@')[0] || ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  const a = parts[0]?.[0] || local[0] || '?'
  const b = parts[1]?.[0] || ''
  return (a + b).toUpperCase() || '?'
}
function namePart(email = '') {
  const local = email.split('@')[0] || 'there'
  const first = local.split(/[._-]+/)[0] || local
  return first.charAt(0).toUpperCase() + first.slice(1)
}

// Consecutive-day streak ending today (or yesterday) from quiz_attempts.
function computeStreak(attempts) {
  const days = new Set(
    attempts
      .filter((a) => a.taken_at)
      .map((a) => new Date(a.taken_at).toDateString())
  )
  if (days.size === 0) return 0
  let streak = 0
  const cursor = new Date()
  // Allow the streak to count if the most recent activity was today or yesterday.
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
  while (days.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
