export const categories = [
  'Working Tools',
  'Machine Accessories',
  'Fuel',
  'Labour Advances',
  'Consumable Materials',
  'Transport',
  'Loading & Unloading',
  'Others',
]

export const money = value => `INR ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
export const today = () => {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}