import { TradingApi } from '@universe/api'
import { isMobileApp, isMobileWeb } from '@universe/environment'
import { Flex } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { isAllBridgeProviders } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/BridgingOptions/isAllBridgeProviders'
import { OptionRow } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/OptionRow'
import { SUPPORTED_BRIDGE_PROVIDERS } from 'uniswap/src/features/transactions/swap/utils/bridgeProviders'
import { getBridgeDappInfo } from 'uniswap/src/features/transactions/swap/utils/routing'

const BRIDGE_PROVIDER_ELEMENT_NAMES: Record<TradingApi.BridgeProvider, ElementName> = {
  [TradingApi.BridgeProvider.ACROSS]: ElementName.SwapBridgingOptionsAcross,
  [TradingApi.BridgeProvider.RELAY]: ElementName.SwapBridgingOptionsRelay,
}

export function BridgingOptionsScreen(): JSX.Element {
  const { t } = useTranslation()
  const selectedBridgeProviders = useTransactionSettingsStore((s) => s.selectedBridgeProviders)
  const { setSelectedBridgeProviders, toggleBridgeProvider } = useTransactionSettingsActions()

  const [isAll, setIsAll] = useState(isAllBridgeProviders(selectedBridgeProviders))

  // We prevent the user from deselecting every bridge
  const onlyOneBridgeSelected = selectedBridgeProviders.length === 1

  const toggleAll = useCallback(() => {
    setIsAll(!isAll)
    if (!isAll) {
      setSelectedBridgeProviders(SUPPORTED_BRIDGE_PROVIDERS)
    }
  }, [isAll, setSelectedBridgeProviders])

  return (
    <Flex gap="$spacing16" my="$spacing16">
      <OptionRow
        alignItems="flex-start"
        active={isAll}
        title={t('common.all')}
        description={t('swap.settings.bridgingOptions.option.all.description')}
        elementName={ElementName.SwapBridgingOptionsAll}
        cantDisable={false}
        onSelect={toggleAll}
      />
      <HeightAnimator open={!isAll} animationDisabled={isMobileApp || isMobileWeb}>
        {SUPPORTED_BRIDGE_PROVIDERS.map((provider) => (
          <OptionRow
            key={provider}
            active={selectedBridgeProviders.includes(provider)}
            title={getBridgeDappInfo(provider).name}
            elementName={BRIDGE_PROVIDER_ELEMENT_NAMES[provider]}
            cantDisable={onlyOneBridgeSelected}
            onSelect={() => toggleBridgeProvider(provider)}
          />
        ))}
      </HeightAnimator>
    </Flex>
  )
}
