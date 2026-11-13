import { CircleCheck, Clock, ShieldQuestion, type LucideIcon } from 'lucide-react'
import './HinweisTag.css'

// Figma: Hinweis-Tag 149:30 · dashed on purpose so it never looks like an official seal.
// «Geprüft» = profiles.is_verified.
type Typ = 'geprueft' | 'nicht-geprueft' | 'bald-verfuegbar' | 'optional'

const variants: Record<Typ, { label: string; icon?: LucideIcon }> = {
  geprueft: { label: 'Geprüft', icon: CircleCheck },
  'nicht-geprueft': { label: 'Nicht geprüft', icon: ShieldQuestion },
  'bald-verfuegbar': { label: 'Bald verfügbar', icon: Clock },
  optional: { label: '(optional)' },
}

export function HinweisTag({ typ }: { typ: Typ }) {
  const { label, icon: Icon } = variants[typ]
  return (
    <span className={`hinweis-tag hinweis-tag--${typ} text-caption`}>
      {Icon && <Icon aria-hidden />}
      {label}
    </span>
  )
}

/** Shortcut for profiles: <VerifiedTag verified={profile.is_verified} /> */
export function VerifiedTag({ verified }: { verified: boolean }) {
  return <HinweisTag typ={verified ? 'geprueft' : 'nicht-geprueft'} />
}
