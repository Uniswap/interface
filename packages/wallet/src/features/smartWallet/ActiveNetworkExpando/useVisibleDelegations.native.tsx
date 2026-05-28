import { useEffect, useState } from 'react'
import {
  INITIAL_VISIBLE_ITEMS_MOBILE,
  MAX_VISIBLE_HEIGHT_MOBILE,
  ROW_HEIGHT,
} from 'wallet/src/features/smartWallet/ActiveNetworkExpando/constants'
import {
  UseVisibleDelegationsParams,
  UseVisibleDelegationsResult,
} from 'wallet/src/features/smartWallet/ActiveNetworkExpando/useVisibleDelegations'

export function useVisibleDelegations({ data }: UseVisibleDelegationsParams): UseVisibleDelegationsResult {
  const [visibleItemCount, setVisibleItemCount] = useState(INITIAL_VISIBLE_ITEMS_MOBILE)
  const [targetHeight, setTargetHeight] = useState(0)

  // Two-stage loading: initial expansion, then load rest
  useEffect(() => {
    // Stage 1: Show initial items and set height
    setVisibleItemCount(INITIAL_VISIBLE_ITEMS_MOBILE)

    const initialHeight = Math.min(ROW_HEIGHT * INITIAL_VISIBLE_ITEMS_MOBILE, MAX_VISIBLE_HEIGHT_MOBILE)

    setTargetHeight(initialHeight)

    // Stage 2: After modal expands, load the rest
    let frameCount = 0
    let animationId: number

    const loadNextBatch = (): void => {
      frameCount++

      // Wait for modal to settle, then start loading
      if (frameCount >= 60) {
        // About 1 second at 60fps

        setVisibleItemCount(data.length)
        const maxHeight = Math.min(ROW_HEIGHT * data.length, MAX_VISIBLE_HEIGHT_MOBILE)

        setTargetHeight(maxHeight)
      } else {
        // Keep counting frames
        animationId = requestAnimationFrame(loadNextBatch)
      }
    }

    // Start frame counting
    animationId = requestAnimationFrame(loadNextBatch)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [data.length])

  return { maxHeight: targetHeight, visibleItems: data.slice(0, visibleItemCount) }
}
