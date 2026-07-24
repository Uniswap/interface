import { BottomSheetView } from '@gorhom/bottom-sheet'
import { isAndroid } from '@universe/environment'
import { useCallback, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { Flex } from 'ui/src'
import { DEFAULT_BOTTOM_INSET } from 'ui/src/hooks/constants'
import { spacing } from 'ui/src/theme'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

interface EarnReviewSheetLayoutProps {
  content: JSX.Element
  action: JSX.Element
}

// First-paint estimate for the action row (large button). The sheet's mount snap is computed from
// the first content layout — on Reanimated 4, gorhom can miss layout updates that land during the
// mount animation (see the repo's @gorhom/bottom-sheet patch), so the footer space must be reserved
// up front rather than after the footer measures. The measured height corrects it afterwards.
const ESTIMATED_ACTION_HEIGHT = 56

/**
 * Bottom-sheet layout for the Earn review modals: content in the sheet body, action pinned in a
 * gorhom footer overlay so it stays anchored while the sheet resizes (mirrors the swap review sheet).
 *
 * The footer space is reserved with React-state-driven padding (measured action + the footer
 * container's own vertical padding) instead of gorhom's `enableFooterMarginAdjustment` — on
 * Reanimated 4 the reaction chain behind that prop misses the footer's initial measurement (see the
 * repo's @gorhom/bottom-sheet patch), leaving the sheet sized without the footer until the next
 * content change. A plain re-render reliably remeasures the sheet.
 */
function EarnReviewSheetLayout({ content, action }: EarnReviewSheetLayoutProps): JSX.Element {
  const insets = useAppInsets()
  const [actionHeight, setActionHeight] = useState(ESTIMATED_ACTION_HEIGHT)
  const onActionLayout = useCallback((event: LayoutChangeEvent): void => {
    setActionHeight(event.nativeEvent.layout.height)
  }, [])

  // Mirrors TransactionModalFooterContainer's insets: pt spacing24 above the action, bottom inset
  // below (Android gesture nav gets an extra spacing8).
  const footerBottomInset =
    isAndroid && insets.bottom !== DEFAULT_BOTTOM_INSET ? insets.bottom + spacing.spacing8 : insets.bottom
  const footerSpace = actionHeight + spacing.spacing24 + footerBottomInset

  return (
    <>
      <BottomSheetView>
        <Flex mt="$spacing8" px="$spacing16" width="100%" pb={footerSpace}>
          {content}
        </Flex>
      </BottomSheetView>
      <TransactionModalFooterContainer>
        <Flex onLayout={onActionLayout}>{action}</Flex>
      </TransactionModalFooterContainer>
    </>
  )
}

export function renderEarnReviewSheetLayout({ content, action }: EarnReviewSheetLayoutProps): JSX.Element {
  return <EarnReviewSheetLayout action={action} content={content} />
}
