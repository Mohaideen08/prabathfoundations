import { createTableApi } from './tableApi.js'

const sites = createTableApi('sites')

export const listSites = options => sites.list({ orderBy: 'name', ascending: true, ...options })
export const getSite = id => sites.get(id)
export const createSite = values => sites.create(values)
export const updateSite = (id, values) => sites.update(id, values)
export const deleteSite = id => sites.remove(id)
export const list = listSites
export const create = createSite
export const update = updateSite
export const remove = deleteSite