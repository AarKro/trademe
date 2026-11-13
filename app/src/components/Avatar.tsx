import { useState } from 'react'
import './Avatar.css'

// Figma: Avatar 149:58 · photo or initials fallback, sizes = size/avatar/*
type Size = 'sm' | 'md' | 'lg' | 'xl'

const initialsClass: Record<Size, string> = {
  sm: 'text-caption',
  md: 'text-label',
  lg: 'text-label',
  xl: 'text-h2',
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: Size }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = src && !failed

  return (
    <span className={`avatar avatar--${size}`} role="img" aria-label={name}>
      {showPhoto ? (
        <img className="avatar__img" src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        <span className={initialsClass[size]} aria-hidden>
          {initials(name)}
        </span>
      )}
    </span>
  )
}
