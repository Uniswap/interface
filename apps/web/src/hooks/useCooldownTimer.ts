import { useEffect, useState } from 'react'

export function useCooldownTimer(expiresAt: number | null): {
  isActive: boolean
  remainingSeconds: number
  formattedTime: string
} {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!expiresAt || expiresAt <= Date.now()) {
      return undefined
    }

    const interval = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (expiresAt <= current) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (!expiresAt || expiresAt <= now) {
    return { isActive: false, remainingSeconds: 0, formattedTime: '0:00' }
  }

  const remainingMs = Math.max(0, expiresAt - now)
  const remainingSeconds = Math.ceil(remainingMs / 1000)

  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60

  const formattedTime =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${minutes}:${String(seconds).padStart(2, '0')}`

  return { isActive: true, remainingSeconds, formattedTime }
}
