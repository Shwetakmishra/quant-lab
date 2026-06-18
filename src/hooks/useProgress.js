import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Loads + syncs the signed-in user's progress.
 *  - card_reviews(user_id, card_id, status, updated_at): one row per flagged card.
 *  - quiz_attempts(id, user_id, topic, score, total, taken_at): one row per topic per quiz.
 *
 * RLS is assumed ON, so every query is implicitly scoped to auth.uid(); we still
 * pass user_id on writes. All network writes are best-effort and optimistic:
 * local state updates immediately, and a failed sync is surfaced via `syncError`
 * without losing the user's progress for the session.
 */
export function useProgress(userId) {
  // cardStatus: { [cardId]: 'known' | 'review' }
  const [cardStatus, setCardStatus] = useState({})
  const [attempts, setAttempts] = useState([]) // [{ topic, score, total }]
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState(false)
  const mounted = useRef(true)

  useEffect(() => () => { mounted.current = false }, [])

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [cr, qa] = await Promise.all([
          supabase.from('card_reviews').select('card_id, status'),
          supabase.from('quiz_attempts').select('topic, score, total, taken_at'),
        ])
        if (cancelled) return
        if (cr.error) throw cr.error
        if (qa.error) throw qa.error
        const map = {}
        for (const row of cr.data || []) map[row.card_id] = row.status
        setCardStatus(map)
        setAttempts(qa.data || [])
        setSyncError(false)
      } catch (e) {
        if (!cancelled) setSyncError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId])

  // Mark a card known / review (or clear). Optimistic + best-effort upsert.
  const markCard = useCallback(
    async (cardId, status) => {
      setCardStatus((prev) => {
        const next = { ...prev }
        if (status === null) delete next[cardId]
        else next[cardId] = status
        return next
      })
      if (!supabase || !userId) return
      try {
        if (status === null) {
          const { error } = await supabase
            .from('card_reviews')
            .delete()
            .eq('card_id', cardId)
          if (error) throw error
        } else {
          const { error } = await supabase.from('card_reviews').upsert(
            { user_id: userId, card_id: cardId, status, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,card_id' }
          )
          if (error) throw error
        }
        setSyncError(false)
      } catch {
        setSyncError(true)
      }
    },
    [userId]
  )

  // Save one completed quiz: one row per topic that appeared.
  const saveQuiz = useCallback(
    async (perTopic) => {
      // perTopic: [{ topic, correct, total }]
      const rows = perTopic.map((t) => ({
        user_id: userId,
        topic: t.topic,
        score: t.correct,
        total: t.total,
        taken_at: new Date().toISOString(),
      }))
      setAttempts((prev) => [...prev, ...rows.map((r) => ({ topic: r.topic, score: r.score, total: r.total, taken_at: r.taken_at }))])
      if (!supabase || !userId) return
      try {
        const { error } = await supabase.from('quiz_attempts').insert(rows)
        if (error) throw error
        setSyncError(false)
      } catch {
        setSyncError(true)
      }
    },
    [userId]
  )

  return { cardStatus, attempts, loading, syncError, markCard, saveQuiz }
}

// Derive weakest topics (lowest average score) from quiz_attempts rows.
export function weakTopics(attempts, limit = 3) {
  const agg = {}
  for (const a of attempts) {
    if (!agg[a.topic]) agg[a.topic] = { correct: 0, total: 0 }
    agg[a.topic].correct += a.score
    agg[a.topic].total += a.total
  }
  return Object.entries(agg)
    .filter(([, v]) => v.total > 0)
    .map(([topic, v]) => ({ topic, pct: Math.round((v.correct / v.total) * 100), correct: v.correct, total: v.total }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit)
}
