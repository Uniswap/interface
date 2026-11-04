import { Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

// Footer status line shared by the margin action modals: in-flight warning takes priority, then
// insufficient-balance, then over-max — at most one shown at a time.
export function MarginActionFooterMessage({
  isPlanInFlight,
  insufficientBalance,
  overMax,
  paymentSymbol,
}: {
  isPlanInFlight: boolean
  insufficientBalance: boolean
  overMax: boolean
  // Optional: Change leverage has no payment token.
  paymentSymbol?: string
}): JSX.Element | null {
  const { t } = useTranslation()
  if (isPlanInFlight) {
    return (
      <Text variant="body4" color="$statusWarning" textAlign="center">
        {t('margin.error.planInFlight')}
      </Text>
    )
  }
  if (insufficientBalance) {
    return (
      <Text variant="body4" color="$statusCritical" textAlign="center">
        {/* Only reachable with a funding delta, which always has a payment token. */}
        {t('margin.error.insufficientBalance', { symbol: paymentSymbol ?? '' })}
      </Text>
    )
  }
  if (overMax) {
    return (
      <Text variant="body4" color="$statusCritical" textAlign="center">
        {t('margin.withdraw.overMax')}
      </Text>
    )
  }
  return null
}
