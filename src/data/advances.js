import { createTableApi } from './tableApi.js'

const advances = createTableApi('advances')

export const listAdvances = options => advances.list({ orderBy: 'advance_date', ...options })
export const getAdvance = id => advances.get(id)
export const createAdvance = values => advances.create(values)
export const updateAdvance = (id, values) => advances.update(id, values)
export const deleteAdvance = id => advances.remove(id)
export const list = listAdvances
export const create = createAdvance
export const update = updateAdvance
export const remove = deleteAdvance