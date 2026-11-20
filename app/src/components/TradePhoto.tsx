import pip from '../assets/mascots/pip.svg'
import './TradePhoto.css'

export function TradePhoto({ src, className = '', loading }: {
  src?: string | null
  className?: string
  loading?: 'eager' | 'lazy'
}) {
  const style = src ? 'trade-photo' : 'trade-photo trade-photo--mascot'
  return <img className={`${style} ${className}`} src={src || pip} alt="" loading={loading} />
}
