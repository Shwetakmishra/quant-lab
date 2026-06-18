import { useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // 'idle' | 'sending' | 'sent' | 'error'
  const [linkState, setLinkState] = useState('idle')
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    // Establish the session on load (handles the magic-link return: the URL
    // hash is parsed by detectSessionInUrl, then getSession reflects it).
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const sendMagicLink = useCallback(async (email) => {
    setError('')
    if (!supabase) {
      setError('Supabase is not configured. Add your anon key to .env.local and restart.')
      setLinkState('error')
      return
    }
    setLinkState('sending')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (err) {
      setError(err.message)
      setLinkState('error')
    } else {
      setSentTo(email)
      setLinkState('sent')
    }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
  }, [])

  const resetLink = useCallback(() => {
    setLinkState('idle')
    setError('')
  }, [])

  return {
    session,
    user: session?.user ?? null,
    loading,
    isConfigured,
    linkState,
    error,
    sentTo,
    sendMagicLink,
    signOut,
    resetLink,
  }
}
