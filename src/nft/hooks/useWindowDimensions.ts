import { useEffect, useState } from 'react'

type Value = number | undefined

export function useWindowDimensions(): [Value, Value] {
  const [height, setHeight] = useState<Value>(undefined)
  const [width, setWidth] = useState<Value>(undefined)

  useEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight)
      setWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return [height, width]
}

export function useWindowWidth(): Value {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, width] = useWindowDimensions()

  return width
}
