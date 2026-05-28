import { useCallback, useRef, useSyncExternalStore } from 'react'
import { getScrollY, subscribe } from '~/state/scroll/scrollStore'

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}

interface ScrollState {
  direction: ScrollDirection | undefined
  isScrolledDown: boolean
}

const SERVER_SNAPSHOT: ScrollState = { direction: undefined, isScrolledDown: false }

export function useScroll(): ScrollState {
  const stateRef = useRef<ScrollState>({
    direction: undefined,
    isScrolledDown: getScrollY() > 0,
  })

  const subscribeToStore = useCallback((onStoreChange: () => void) => {
    let prevY = getScrollY()

    stateRef.current = {
      direction: stateRef.current.direction,
      isScrolledDown: prevY > 0,
    }

    return subscribe(() => {
      const y = getScrollY()
      const isScrolledDown = y > 0

      let { direction } = stateRef.current
      if (prevY < y) {
        direction = ScrollDirection.DOWN
      } else if (prevY > y) {
        direction = ScrollDirection.UP
      }
      prevY = y

      if (isScrolledDown !== stateRef.current.isScrolledDown || direction !== stateRef.current.direction) {
        stateRef.current = { direction, isScrolledDown }
        onStoreChange()
      }
    })
  }, [])

  const getSnapshot = useCallback(() => stateRef.current, [])

  return useSyncExternalStore(subscribeToStore, getSnapshot, () => SERVER_SNAPSHOT)
}
