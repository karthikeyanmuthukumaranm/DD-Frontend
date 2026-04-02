/** FinCover brand asset — file lives in `public/fincover-logo.png` (copied from client artwork). */
export const BRAND_LOGO_SRC = `${import.meta.env.BASE_URL}fincover-logo.png`

type BrandLogoProps = {
  className?: string
  /** Shorter alt for icon-sized uses */
  compact?: boolean
}

export function BrandLogo({ className = '', compact }: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={compact ? 'FinCover' : 'FinCover — Simplifying financial decisions'}
      className={className}
      decoding="async"
    />
  )
}
