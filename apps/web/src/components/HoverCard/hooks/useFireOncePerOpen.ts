import { useEffect, useState } from 'react'

/**
 * Fires an analytics event once per open, optionally gated on `ready` (data resolved). Effect-based
 * rather than fired from onOpenChange because with deferred fetches, the data a gated event reports
 * may resolve after the open itself.
 */
export function useFireOncePerOpen({
  isOpen,
  ready = true,
  fire,
}: {
  isOpen: boolean
  ready?: boolean
  fire: () => void
}): void {
  const [hasFired, setHasFired] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setHasFired(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !ready || hasFired) {
      return
    }
    setHasFired(true)
    fire()
  }, [isOpen, ready, hasFired, fire])
}
