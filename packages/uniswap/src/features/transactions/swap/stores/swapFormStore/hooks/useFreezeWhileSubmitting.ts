import { useEffect, useState } from 'react'
import { usePrevious } from 'utilities/src/react/hooks'

/** Saves value when submission starts. Returns that value while submitting, otherwise returns the latest value. */
export function useFreezeWhileSubmitting<T>(latestValue: T, isSubmitting: boolean): T {
  // Store a reference to the derived swap info that was displayed when the user submitted the trade
  const [submitted, setSubmitted] = useState<{ value: T }>()

  const wasSubmitting = usePrevious(isSubmitting)
  useEffect(() => {
    if (!wasSubmitting && isSubmitting) {
      // Store the latest value on first render where submitting becomes true
      setSubmitted({ value: latestValue })
    } else if (!isSubmitting) {
      // Clear any saved value if the form is not submitting
      setSubmitted(undefined)
    }
  }, [isSubmitting, latestValue, wasSubmitting])

  return submitted ? submitted.value : latestValue
}
