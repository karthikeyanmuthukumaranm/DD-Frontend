import { Capacitor } from '@capacitor/core'
import { isNativeApp } from '../storage/platform'

function normalizePhone(phone: string) {
  const s = phone.trim()
  return s.replace(/[^\d]/g, '')
}

export const CONSULTANT_SIGNATURE = `Regards,
Certified Consultant
Baskaran.M
Life / Health / Mutual Funds / Loans
M: 9176672044
E: baskaran.m@fincover.com
W: www.fincover.com`

export function buildWhatsAppUrl(phone: string, text: string) {
  const digits = normalizePhone(phone)
  const encoded = encodeURIComponent(text)
  return `https://wa.me/${digits}?text=${encoded}`
}

export function buildPolicyDueMessage(input: {
  customerName: string
  policyNumber: string
  dueDateISO: string
}) {
  return `Dear ${input.customerName},

Your policy (Policy No: ${input.policyNumber}) is due on ${input.dueDateISO}. Kindly renew on time.

`
}

export function buildPolicyDueMessageWithSignature(input: {
  customerName: string
  policyNumber: string
  dueDateISO: string
}) {
  return `${buildPolicyDueMessage(input)}${CONSULTANT_SIGNATURE}`
}

export type WhatsAppVariant = 'personal' | 'business'

/**
 * Opens WhatsApp with a pre-filled message.
 * On Android native, `business` tries to target WhatsApp Business via intent; falls back to default if needed.
 */
export function openWhatsApp(options: { phone: string; message: string; variant: WhatsAppVariant }) {
  const digits = normalizePhone(options.phone)
  const encoded = encodeURIComponent(options.message)

  if (Capacitor.getPlatform() === 'android' && isNativeApp() && options.variant === 'business') {
    const intent = `intent://send?phone=${digits}&text=${encoded}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`
    window.location.assign(intent)
    return
  }

  window.open(`https://wa.me/${digits}?text=${encoded}`, '_blank', 'noopener,noreferrer')
}
