import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

// Figma: Button 150:22
// text = secondary action below a primary one (e.g. «Noch nicht» in a Bottom-Sheet)
type Variant = 'primary' | 'secondary' | 'text'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const textStyle = variant === 'text' ? 'text-label' : 'text-body-strong'
  return <button className={`button button--${variant} ${textStyle} ${className}`} {...props} />
}
