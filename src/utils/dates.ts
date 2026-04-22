import { format, differenceInDays, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMMM yyyy', { locale: uk })
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMM', { locale: uk })
}

export function daysUntil(date: string): number {
  return differenceInDays(parseISO(date), new Date())
}

export function getCurrentQuarter(): 1 | 2 | 3 | 4 {
  const month = new Date().getMonth() + 1
  return Math.ceil(month / 3) as 1 | 2 | 3 | 4
}

export function getQuarterLabel(quarter: number, year: number): string {
  return `Q${quarter} ${year}`
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function getMonthName(monthIndex: number): string {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']
  return months[monthIndex] ?? ''
}
