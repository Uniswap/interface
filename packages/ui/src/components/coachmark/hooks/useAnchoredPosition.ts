import type { LayoutChangeEvent, View } from 'react-native'
import type { CoachmarkProps } from 'ui/src/components/coachmark/Coachmark'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type Side = 'top' | 'bottom'

export type Placement = NonNullable<CoachmarkProps['placement']>

export interface AnchoredPosition {
  top: number
  left: number
  arrowLeft: number
}

export interface UseAnchoredPositionParams {
  open: boolean
  placement: Placement
  offset: CoachmarkProps['offset']
  beakWidth: number
}

export interface UseAnchoredPositionResult {
  triggerRef: React.RefObject<View | null>
  side: Side
  position: AnchoredPosition | null
  hasBubbleSize: boolean
  measureTrigger: () => void
  onBubbleLayout: (event: LayoutChangeEvent) => void
}

export function useAnchoredPosition(_params: UseAnchoredPositionParams): UseAnchoredPositionResult {
  throw new PlatformSplitStubError('useAnchoredPosition')
}
