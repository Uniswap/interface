import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { LiquidityPositionStatusIndicator } from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { PositionInfo } from 'components/Liquidity/types'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyAndChainLogo } from 'components/Logo/DoubleLogo'
import { Flex, Text } from 'ui/src'

interface LiquidityPositionInfoProps {
  positionInfo: PositionInfo
}

export function LiquidityPositionInfo({ positionInfo }: LiquidityPositionInfoProps) {
  const { currency0Amount, currency1Amount, status, feeTier, v4hook, version } = positionInfo
  const versionLabel = getProtocolVersionLabel(version)
  return (
    <Flex row gap="$gap16" py="$spacing4">
      <DoubleCurrencyAndChainLogo
        chainId={currency0Amount?.currency.chainId}
        currencies={[currency0Amount?.currency, currency1Amount?.currency]}
        size={44}
      />
      <Flex grow>
        <Flex row gap="$gap16">
          <Text variant="subheading1">
            {currency0Amount?.currency.symbol} / {currency1Amount?.currency.symbol}
          </Text>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges size="small" versionLabel={versionLabel} v4hook={v4hook} feeTier={feeTier} />
          </Flex>
        </Flex>
        <LiquidityPositionStatusIndicator status={status} />
      </Flex>
    </Flex>
  )
}
