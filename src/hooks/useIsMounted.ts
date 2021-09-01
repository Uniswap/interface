import { useEffect, useRef } from 'react'

export default function useIsMounted(): () => boolean {
  const mountedRef = useRef<boolean>(false)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  return () => mountedRef.current
}
