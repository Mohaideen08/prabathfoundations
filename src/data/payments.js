import { createTableApi } from './tableApi.js'

const payments = createTableApi('payments')

export const listPayments = options => payments.list({ orderBy: 'payment_date', ...options })
export const getPayment = id => payments.get(id)
export const createPayment = values => payments.create(values)
export const updatePayment = (id, values) => payments.update(id, values)
export const deletePayment = id => payments.remove(id)
export const list = listPayments
export const create = createPayment
export const update = updatePayment
export const remove = deletePayment