import { CircleCheck } from 'lucide-react'
import { useEffect } from 'react'
import './Toast.css'

// Figma: Toast 420:754 · short confirmation after an action (instead of a success screen).
// Place it at the top of the content, right below the App-Bar:
//   {toast && <Toast message={toast} onDone={() => setToast(null)} />}
export function Toast({ message, onDone, duration = 3000 }: { message: string; onDone?: () => void; duration?: number }) {
  useEffect(() => {
    if (!onDone) return
    const timer = setTimeout(onDone, duration)
    return () => clearTimeout(timer)
  }, [onDone, duration])

  return (
    <div className="toast" role="status">
      <CircleCheck aria-hidden />
      <p className="text-label">{message}</p>
    </div>
  )
}
