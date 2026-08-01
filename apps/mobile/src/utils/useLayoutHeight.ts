import { useCallback, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

export function useLayoutHeight(): [number, (event: LayoutChangeEvent) => void] {
  const [height, setHeight] = useState(0)
  const onLayout = useCallback((event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height), [])
  return [height, onLayout]
}
