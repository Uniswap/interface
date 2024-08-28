import { useFocusEffect } from '@react-navigation/core'
import { useCallback, useRef, useState } from 'react'

const getNativeComponentKey = (): string => `native-component-${Math.random().toString()}`

export function useNativeComponentKey(autoUpdate = true): {
  key: string
  triggerUpdate: () => void
} {
  const isInitialRenderRef = useRef(true)

  const [key, setKey] = useState(getNativeComponentKey)

  useFocusEffect(
    useCallback(() => {
      if (isInitialRenderRef.current || !autoUpdate) {
        isInitialRenderRef.current = false
        return
      }
      setKey(getNativeComponentKey())
    }, [autoUpdate]),
  )

  const triggerUpdate = useCallback(() => {
    setKey(getNativeComponentKey())
  }, [])

  return {
    key,
    triggerUpdate,
  }
}
