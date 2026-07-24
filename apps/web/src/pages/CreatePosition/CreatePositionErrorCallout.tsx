import { useTranslation } from 'react-i18next'
import { ErrorCallout } from '~/components/ErrorCallout'
import { useCreatePositionTxContext } from '~/pages/CreatePosition/CreatePositionTxContext'

/**
 * ErrorCallout for the create-position flow. When the failure is attributable to the pool's hook
 * rejecting new liquidity, it replaces the generic transaction-data error with a specific message.
 */
export function CreatePositionErrorCallout({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation()
  const { transactionError, hookRejectsLiquidity } = useCreatePositionTxContext()

  return (
    <ErrorCallout
      errorMessage={transactionError}
      description={hookRejectsLiquidity ? t('position.hook.rejectsLiquidity') : undefined}
      onPress={onPress}
    />
  )
}
