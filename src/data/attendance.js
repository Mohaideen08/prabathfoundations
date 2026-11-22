import { createTableApi } from './tableApi.js'

const attendance = createTableApi('attendance')

export const listAttendance = options => attendance.list({ orderBy: 'work_date', ...options })
export const getAttendanceRecord = id => attendance.get(id)
export const createAttendanceRecord = values => attendance.create(values)
export const updateAttendanceRecord = (id, values) => attendance.update(id, values)
export const deleteAttendanceRecord = id => attendance.remove(id)
export const list = listAttendance
export const create = createAttendanceRecord
export const update = updateAttendanceRecord
export const remove = deleteAttendanceRecord