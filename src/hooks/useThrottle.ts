import { useCallback } from 'react'
import _ from 'lodash'

export default function useThrottle(cb: (...args: any) => any, delay: number) {
  return useCallback(_.throttle(cb, delay), [])
}
