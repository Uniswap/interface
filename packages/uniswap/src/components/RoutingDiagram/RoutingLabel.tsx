import { useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { AnimatedUniswapX } from 'ui/src/components/icons/UniswapX'
import { AcrossLogo } from 'ui/src/components/logos/AcrossLogo'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'

export function RoutingLabel({ trade }: { trade: Trade }): JSX.Element {
  const { t } = useTranslation()

  const routingProvider = useRoutingProvider({ routing: trade.routing })

  if (isBridge(trade)) {
    return (
      <Flex row gap="$spacing6" alignItems="center">
        <AcrossLogo size="$icon.16" />
        <Text adjustsFontSizeToFit color="$neutral1" variant="body3">
          Across API
        </Text>
      </Flex>
    )
  }

  if (isUniswapX(trade)) {
    return (
      <Flex row gap="$spacing1">
        <AnimatedUniswapX size="$icon.16" animation="simple" />
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
