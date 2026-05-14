export function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function addDays(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  date.setDate(date.getDate() + amount)

  return getTodayKey(date)
}

export function getWeekKey(date = new Date()) {
  const targetDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
  const dayNumber = targetDate.getUTCDay() || 7

  targetDate.setUTCDate(targetDate.getUTCDate() + 4 - dayNumber)

  const yearStart = new Date(Date.UTC(targetDate.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7)

  return `${targetDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

export function getIndonesianDayName(date = new Date()) {
  return getDayName(date)
}

export function getDayName(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export function formatIndonesianDate(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export function getGregorianDate(date = new Date()) {
  return formatIndonesianDate(date)
}

export function formatFullIndonesianDate(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export function formatWIBTime(date = new Date()) {
  return `${new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
    .format(date)
    .replace('.', ':')} WIB`
}

export function formatHijriDate(date = new Date()) {
  const hijriDate = getHijriDateParts(date)

  return hijriDate.detail
}

export function getHijriDateParts(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    })
    const parts = formatter.formatToParts(date)
    const value = (type) => parts.find((part) => part.type === type)?.value || ''
    const weekday = value('weekday')
    const day = value('day')
    const month = normalizeHijriMonth(value('month'))
    const year = value('year').replace(/\s*H$/i, '')

    return {
      weekday,
      detail: `${day} ${month} ${year} H`.replace(/\s+/g, ' ').trim(),
    }
  } catch {
    return {
      weekday: 'Hijriah',
      detail: 'Tanggal Hijriah tidak tersedia',
    }
  }
}

function normalizeHijriMonth(month) {
  const monthMap = {
    Muharam: 'Muharram',
    Safar: 'Safar',
    Rabiulawal: 'Rabiul Awal',
    Rabiulakhir: 'Rabiul Akhir',
    Jumadilawal: 'Jumadil Awal',
    Jumadilakhir: 'Jumadil Akhir',
    Rajab: 'Rajab',
    Syakban: 'Syaban',
    Ramadan: 'Ramadan',
    Syawal: 'Syawal',
    Zulkaidah: 'Dzulqaidah',
    Zulhijah: 'Dzulhijjah',
  }

  return monthMap[month] || month
}

export function getDailyResetStatus(date = new Date()) {
  const nextReset = new Date(date)

  nextReset.setHours(24, 0, 0, 0)

  const minutesUntilReset = Math.max(
    0,
    Math.ceil((nextReset.getTime() - date.getTime()) / 60000),
  )
  const hours = Math.floor(minutesUntilReset / 60)
  const minutes = minutesUntilReset % 60

  return `Reset harian dalam ${hours}j ${minutes}m`
}

export function getWeekDateKeys(date = new Date()) {
  const start = new Date(date)
  const dayNumber = start.getDay() || 7

  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - dayNumber + 1)

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)

    return getTodayKey(current)
  })
}
