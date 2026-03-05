import { useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { useTimeout } from 'utilities/src/time/timing'

export function useDelayedRender(delay: number): { isContentHidden: boolean } {
  const [isContentHidden, setIsContentHidden] = useState(true)
  const setVisible = useEvent(() => setIsContentHidden(false))
  useTimeout(setVisible, delay)

  return { isContentHidden }
}
