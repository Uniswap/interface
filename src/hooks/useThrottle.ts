import _ from 'lodash'
import { useCallback } from 'react'

export default function useThrottle(cb: (...args: any) => any, delay: number) {
  return useCallback(_.throttle(cb, delay), [])
}
