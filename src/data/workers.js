import { createTableApi } from './tableApi.js'
import { requireSupabase } from './supabase.js'

const workers = createTableApi('workers')

export const listWorkers = options => workers.list({ orderBy: 'full_name', ascending: true, ...options })

export async function getWorkerForUser(userId) {
	const { data, error } = await requireSupabase()
		.from('workers')
		.select('id, site_id, status')
		.eq('user_id', userId)
		.maybeSingle()

	if (error) throw error
	return data
}

export const getWorker = id => workers.get(id)
export const createWorker = values => workers.create(values)
export const updateWorker = (id, values) => workers.update(id, values)
export const deleteWorker = id => workers.remove(id)
export const list = listWorkers
export const create = createWorker
export const update = updateWorker
export const remove = deleteWorker