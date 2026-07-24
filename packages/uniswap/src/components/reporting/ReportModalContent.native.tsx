import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { spacing } from 'ui/src/theme'
import type { ReportModalContentProps } from 'uniswap/src/components/reporting/ReportModalContent'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

export function ReportModalContent({ children, keyboardHeight }: ReportModalContentProps): JSX.Element {
  const insets = useAppInsets()

  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        padding: spacing.spacing12,
        paddingBottom: Math.max(keyboardHeight + spacing.spacing12, insets.bottom),
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </BottomSheetScrollView>
  )
}
