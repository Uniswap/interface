import { useEffect } from 'react'

export default function useNativeEvent(
  element: HTMLElement | null,
  ...eventListener: Parameters<HTMLElement['addEventListener']>
) {
  useEffect(() => {
    element?.addEventListener(...eventListener)
    return () => element?.removeEventListener(...eventListener)
  }, [element, eventListener])
}
