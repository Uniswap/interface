import { useRef } from 'react'
import type { View } from 'react-native'
import type {
  UseAnchoredPositionParams,
  UseAnchoredPositionResult,
} from 'ui/src/components/coachmark/hooks/useAnchoredPosition'

const noop = (): void => {}

export function useAnchoredPosition(_params: UseAnchoredPositionParams): UseAnchoredPositionResult {
  const triggerRef = useRef<View>(null)

  return {
    triggerRef,
    side: 'bottom',
    position: null,
    hasBubbleSize: false,
    measureTrigger: noop,
    onBubbleLayout: noop,
  }
}
