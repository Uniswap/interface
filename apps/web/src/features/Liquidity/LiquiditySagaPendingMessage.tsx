import { Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useIsLiquiditySagaRunning } from '~/features/Liquidity/hooks/useIsLiquiditySagaRunning'

/** Explains a confirm disabled by `useIsLiquiditySagaRunning`; render it only where no step of the current flow is in progress. */
export function LiquiditySagaPendingMessage(): JSX.Element | null {
  const { t } = useTranslation()
  const isLiquiditySagaRunning = useIsLiquiditySagaRunning()

  if (!isLiquiditySagaRunning) {
    return null
  }

  return (
    <Text variant="body4" color="$statusCritical" textAlign="center">
      {t('position.pendingWalletAction')}
    </Text>
  )
}
