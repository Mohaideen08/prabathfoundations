export function calculateSalaries(workers, attendance, advances, month) {
  return workers.map(worker => {
    const records = attendance.filter(record => record.worker_id === worker.id && record.work_date.startsWith(`${month}-`))
    const presentDays = records.filter(record => record.status === 'Present').length
    const halfDays = records.filter(record => record.status === 'Half day').length
    const paidDays = presentDays + halfDays * 0.5
    const earned = Math.round(paidDays * Number(worker.daily_rate) * 100) / 100
    const advanceAmount = Math.round(advances
      .filter(advance => advance.worker_id === worker.id && advance.advance_date.startsWith(`${month}-`))
      .reduce((sum, advance) => sum + Number(advance.amount), 0) * 100) / 100

    return {
      worker,
      presentDays,
      halfDays,
      paidDays,
      earned,
      advanceAmount,
      balance: Math.round((earned - advanceAmount) * 100) / 100,
    }
  })
}