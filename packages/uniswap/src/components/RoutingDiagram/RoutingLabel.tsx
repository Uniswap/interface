import { Flex, Text } from '@universe/mycelium'
import { AnimatedUniswapX } from '@universe/mycelium/icons/UniswapX'
import { useTranslation } from 'react-i18next'
import { UniswapXText } from 'ui/src'
import { BridgeProviderLogo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/BridgeProviderLogo'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getBridgeDappInfo, isBridge, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'

export function RoutingLabel({ trade }: { trade: Trade }): JSX.Element {
  const { t } = useTranslation()

  const routingProvider = useRoutingProvider({ routing: trade.routing })

  if (isBridge(trade)) {
    const provider = trade.quote.quote.provider
    return (
      <Flex row gap="$spacing6" alignItems="center">
        <BridgeProviderLogo provider={provider} />
        <Text adjustsFontSizeToFit color="$neutral1" variant="body3">
          {getBridgeDappInfo(provider).name}
        </Text>
      </Flex>
    )
  }

  if (isUniswapX(trade)) {
    return (
      <Flex row gap="$spacing2">
        <AnimatedUniswapX size="$icon.16" />
        <UniswapXText variant="body3">{t('uniswapx.label')}</UniswapXText>
      </Flex>
    )
  }

  return (
    <Flex row gap="$spacing6" alignItems="center">
      {routingProvider?.icon && <routingProvider.icon size="$icon.16" color={routingProvider.iconColor} />}
      <Text adjustsFontSizeToFit color="$neutral1" variant="body3">
        {routingProvider?.name ?? ''}
      </Text>
    </Flex>
  )
}
