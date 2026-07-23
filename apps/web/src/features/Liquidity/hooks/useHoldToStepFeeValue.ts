import ms from 'ms'
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'

interface HoldToStepControls {
  onDecrementPressIn: () => void
  onIncrementPressIn: () => void
  /** Wire to both buttons' onPressOut to stop stepping. */
  onStepPressOut: () => void
}

/**
 * Drives the +/- fee stepper: holding a button repeatedly applies `computeNext`, accelerating the
 * longer it's held. Stepping always stops on pointer release — including a release outside the button
 * or a window blur — so it can never get "stuck" auto-stepping if onPressOut is missed.
 */
export function useHoldToStepFeeValue({
  computeNext,
  setValue,
}: {
  computeNext: (current: string, direction: 'up' | 'down') => string
  setValue: Dispatch<SetStateAction<string>>
}): HoldToStepControls {
  const [autoDecrementing, setAutoDecrementing] = useState(false)
  const [autoIncrementing, setAutoIncrementing] = useState(false)
  const [holdDuration, setHoldDuration] = useState(0)

  const onStepPressOut = useEvent(() => {
    setAutoDecrementing(false)
    setAutoIncrementing(false)
  })

  // Safety net: a re-render mid-press (or releasing the pointer off the button) can swallow
  // onPressOut, which would leave the stepper running. A global release/blur listener guarantees it stops.
  useEffect(() => {
    if (!autoDecrementing && !autoIncrementing) {
      return undefined
    }
    window.addEventListener('pointerup', onStepPressOut)
    window.addEventListener('pointercancel', onStepPressOut)
    window.addEventListener('blur', onStepPressOut)
    return () => {
      window.removeEventListener('pointerup', onStepPressOut)
      window.removeEventListener('pointercancel', onStepPressOut)
      window.removeEventListener('blur', onStepPressOut)
    }
  }, [autoDecrementing, autoIncrementing, onStepPressOut])

  useEffect(() => {
    let interval: NodeJS.Timeout
    let holdTimeout: NodeJS.Timeout
    const baseInterval = 100
    let currentInterval = baseInterval

    if (autoDecrementing || autoIncrementing) {
      holdTimeout = setTimeout(() => {
        setHoldDuration((prev) => prev + 1)
      }, ms('1s'))

      if (holdDuration >= 2) {
        currentInterval = baseInterval / 2
      }
      if (holdDuration >= 4) {
        currentInterval = baseInterval / 4
      }
      if (holdDuration >= 6) {
        currentInterval = baseInterval / 8
      }

      const direction = autoIncrementing ? 'up' : 'down'
      interval = setInterval(() => {
        setValue((prev) => computeNext(prev, direction))
      }, currentInterval)

      return () => {
        clearInterval(interval)
        clearTimeout(holdTimeout)
      }
    }

    return () => {
      clearInterval(interval)
      clearTimeout(holdTimeout)
      setHoldDuration(0) // Reset hold duration on release
    }
  }, [autoDecrementing, autoIncrementing, holdDuration, computeNext, setValue])

  const onDecrementPressIn = useEvent(() => setAutoDecrementing(true))
  const onIncrementPressIn = useEvent(() => setAutoIncrementing(true))

  return { onDecrementPressIn, onIncrementPressIn, onStepPressOut }
}
