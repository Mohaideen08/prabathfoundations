import { requireSupabase } from './supabase.js'

export function createTableApi(table) {
  return {
    async list({ filters = {}, orderBy = 'created_at', ascending = false } = {}) {
      let request = requireSupabase().from(table).select('*').order(orderBy, { ascending })

      for (const [column, value] of Object.entries(filters)) {
        if (value !== undefined) request = request.eq(column, value)
      }

      const { data, error } = await request
      if (error) throw error
      return data
    },

    async get(id) {
      const { data, error } = await requireSupabase()
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    async create(values) {
      const { data, error } = await requireSupabase()
        .from(table)
        .insert(values)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(id, values) {
      const { data, error } = await requireSupabase()
        .from(table)
        .update(values)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async remove(id) {
      const { error } = await requireSupabase().from(table).delete().eq('id', id)
      if (error) throw error
    },
  }
}