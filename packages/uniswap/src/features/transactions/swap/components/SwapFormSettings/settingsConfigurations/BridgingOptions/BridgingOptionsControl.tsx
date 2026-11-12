import { Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { isAllBridgeProviders } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/BridgingOptions/isAllBridgeProviders'

export function BridgingOptionsControl(): JSX.Element {
  const { t } = useTranslation()
  const selectedBridgeProviders = useTransactionSettingsStore((s) => s.selectedBridgeProviders)

  return (
    <Text
      color="$neutral2"
      flexWrap="wrap"
      variant="subheading2"
      $group-hover={{
        color: '$neutral2Hovered',
      }}
    >
      {isAllBridgeProviders(selectedBridgeProviders) ? t('common.all') : t('common.custom')}
    </Text>
  )
}
