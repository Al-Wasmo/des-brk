import { CheckIcon } from './icons'

type ToastProps = {
  message: string
  visible: boolean
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div className={`toast ${visible ? 'show' : ''}`}>
      <CheckIcon />
      <span>{message}</span>
    </div>
  )
}
