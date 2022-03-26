import { useEffect } from 'react'

export default function useNativeEvent<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | null,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined
) {
  useEffect(() => {
    element?.addEventListener(type, listener, options)
    return () => element?.removeEventListener(type, listener, options)
  }, [element, type, listener, options])
}
