import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { parseISO, startOfDay, subDays } from 'date-fns'
import type { InsuranceDb } from '../types/insurance'
import { getNextOccurrenceDate, isMonthDayWithinNextNDaysISO } from './reminders'

/** Android notification ids must fit in a 32-bit signed int */
function stableNotificationId(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  const positive = Math.abs(h) % 2_000_000_000
  return positive === 0 ? 1 : positive
}

export async function initLocalNotifications() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const current = await LocalNotifications.checkPermissions()
    if (current.display !== 'granted') {
      await LocalNotifications.requestPermissions()
    }
  } catch {
    /* user denied or unsupported */
  }
}

export async function rescheduleFromDb(db: InsuranceDb) {
  if (!Capacitor.isNativePlatform()) return
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      // Android 13+: user may have denied earlier; try again when data loads (e.g. after login).
      const requested = await LocalNotifications.requestPermissions()
      if (requested.display !== 'granted') return
    }

    const pending = await LocalNotifications.getPending()
    if (pending.notifications?.length) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      })
    }

    const now = new Date()
    const horizon = new Date(now.getTime() + 90 * 86_400_000)
    type Entry = { id: number; title: string; body: string; at: Date }
    const entries: Entry[] = []

    for (const p of db.policies) {
      const dueDay = startOfDay(parseISO(p.dueDateISO))
      if (dueDay < startOfDay(now)) continue
      const remindDay = startOfDay(subDays(dueDay, 15))
      const at = new Date(remindDay)
      at.setHours(9, 0, 0, 0)
      if (at <= now) continue
      if (remindDay > startOfDay(horizon)) continue
      entries.push({
        id: stableNotificationId(`pol-${p.id}-${p.dueDateISO}-15d`),
        title: 'Policy renewal reminder',
        body: `${p.policyNumber} — due in 15 days (${p.dueDateISO})`,
        at,
      })
    }

    for (const c of db.customers) {
      if (c.dateOfBirthISO && isMonthDayWithinNextNDaysISO(c.dateOfBirthISO, 60)) {
        const next = getNextOccurrenceDate(c.dateOfBirthISO)
        if (!next) continue
        const day = startOfDay(next)
        if (day < startOfDay(now) || day > startOfDay(horizon)) continue
        const at = new Date(day)
        at.setHours(10, 0, 0, 0)
        if (at <= now) continue
        entries.push({
          id: stableNotificationId(`dob-${c.id}-${day.toISOString()}`),
          title: 'Birthday reminder',
          body: `${c.fullName} — birthday reminder`,
          at,
        })
      }

      if (c.anniversaryDateISO && isMonthDayWithinNextNDaysISO(c.anniversaryDateISO, 60)) {
        const nextAnn = getNextOccurrenceDate(c.anniversaryDateISO)
        if (!nextAnn) continue
        const day = startOfDay(nextAnn)
        if (day < startOfDay(now) || day > startOfDay(horizon)) continue
        const at = new Date(day)
        at.setHours(10, 30, 0, 0)
        if (at <= now) continue
        entries.push({
          id: stableNotificationId(`ann-${c.id}-${day.toISOString()}`),
          title: 'Anniversary reminder',
          body: `${c.fullName} — anniversary reminder`,
          at,
        })
      }
    }

    for (const l of db.leads) {
      if (l.status !== 'open') continue
      const day = startOfDay(parseISO(l.followUpDateISO))
      if (day < startOfDay(now) || day > startOfDay(horizon)) continue
      const at = new Date(day)
      at.setHours(9, 30, 0, 0)
      if (at <= now) continue
      entries.push({
        id: stableNotificationId(`lead-${l.id}-${l.followUpDateISO}`),
        title: 'Lead follow-up',
        body: `${l.name} — ${l.interestedProduct}`,
        at,
      })
    }

    const seen = new Set<number>()
    const unique = entries.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })

    const slice = unique.slice(0, 50)
    if (slice.length === 0) return

    await LocalNotifications.schedule({
      notifications: slice.map((e) => ({
        id: e.id,
        title: e.title,
        body: e.body,
        schedule: { at: e.at, allowWhileIdle: true },
      })),
    })
  } catch {
    /* scheduling not available */
  }
}
