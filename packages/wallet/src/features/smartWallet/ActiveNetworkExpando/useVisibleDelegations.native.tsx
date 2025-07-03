import { useEffect, useState } from 'react'
import { ROW_HEIGHT } from 'wallet/src/features/smartWallet/ActiveNetworkExpando/constants'
import {
  UseVisibleDelegationsParams,
  UseVisibleDelegationsResult,
} from 'wallet/src/features/smartWallet/ActiveNetworkExpando/useVisibleDelegations'

export const INITIAL_VISIBLE_ITEMS = 5 // Load these first for smooth initial expansion
export const MAX_VISIBLE_HEIGHT = ROW_HEIGHT * (INITIAL_VISIBLE_ITEMS - 0.5) // Clamp to 4.5 rows so it's clear there's more

export function useVisibleDelegations({ data, isOpen }: UseVisibleDelegationsParams): UseVisibleDelegationsResult {
  const [visibleItemCount, setVisibleItemCount] = useState(INITIAL_VISIBLE_ITEMS)
  const [targetHeight, setTargetHeight] = useState(0)

  // Two-stage loading: initial expansion, then load rest
  useEffect(() => {
    if (isOpen) {
      // Stage 1: Show initial items and set height
      setVisibleItemCount(INITIAL_VISIBLE_ITEMS)

      const initialHeight = Math.min(ROW_HEIGHT * INITIAL_VISIBLE_ITEMS, MAX_VISIBLE_HEIGHT)

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
          const maxHeight = Math.min(ROW_HEIGHT * data.length, MAX_VISIBLE_HEIGHT)

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
    } else {
      setVisibleItemCount(INITIAL_VISIBLE_ITEMS)
      setTargetHeight(0)

      return undefined
    }
  }, [isOpen, data.length])

  return { maxHeight: targetHeight, visibleItems: isOpen ? data.slice(0, visibleItemCount) : [] }
}
