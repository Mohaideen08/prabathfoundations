import { requireSupabase } from './supabase.js'

export async function signIn(email, password) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await requireSupabase().auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback) {
  const { data } = requireSupabase().auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}