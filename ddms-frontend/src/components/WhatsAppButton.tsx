import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '../utils/whatsapp'
import { Button } from './ui/Button'

export function WhatsAppButton({
  phoneNumber,
  message,
  className,
}: {
  phoneNumber: string
  message: string
  className?: string
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      leftIcon={<MessageCircle className="h-4 w-4" />}
      onClick={() => {
        const url = buildWhatsAppUrl(phoneNumber, message)
        window.open(url, '_blank', 'noopener,noreferrer')
      }}
    >
      WhatsApp
    </Button>
  )
}

