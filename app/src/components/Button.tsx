import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

// Figma: Button 150:22
type Variant = 'primary' | 'secondary'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`button button--${variant} text-body-strong ${className}`} {...props} />
}
