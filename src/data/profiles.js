import { requireSupabase } from './supabase.js'

export async function getProfile(userId) {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(userId, values) {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .update(values)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}