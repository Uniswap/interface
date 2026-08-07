import { useTranslation } from 'react-i18next'
import { ErrorCallout } from '~/components/ErrorCallout'
import { useCreatePositionTxContext } from '~/pages/CreatePosition/CreatePositionTxContext'

/**
 * ErrorCallout for the create-position flow. When the failure is attributable to the pool's hook
 * rejecting new liquidity, it replaces the generic transaction-data error with a specific message.
 * `suppressed` hides the callout while the verify-identity gate carries the message (the backend's
 * calldata rejection is expected noise then), matching the increase-liquidity form (ECO-609).
 */
export function CreatePositionErrorCallout({
  onPress,
  suppressed = false,
}: {
  onPress?: () => void
  suppressed?: boolean
}) {
  const { t } = useTranslation()
  const { transactionError, hookRejectsLiquidity } = useCreatePositionTxContext()

  return (
    <ErrorCallout
      errorMessage={suppressed ? false : transactionError}
      description={hookRejectsLiquidity ? t('position.hook.rejectsLiquidity') : undefined}
      onPress={onPress}
    />
  )
}
