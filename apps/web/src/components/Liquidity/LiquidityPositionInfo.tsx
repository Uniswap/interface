import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { LiquidityPositionStatusIndicator } from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { PositionInfo } from 'components/Liquidity/types'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyAndChainLogo } from 'components/Logo/DoubleLogo'
import { Flex, Text } from 'ui/src'

interface LiquidityPositionInfoProps {
  positionInfo: PositionInfo
  currencyLogoSize?: number
  hideStatusIndicator?: boolean
}

export function LiquidityPositionInfo({
  positionInfo,
  currencyLogoSize = 44,
  hideStatusIndicator = false,
}: LiquidityPositionInfoProps) {
  const { currency0Amount, currency1Amount, status, feeTier, v4hook, version } = positionInfo
  const versionLabel = getProtocolVersionLabel(version)
  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }}>
      <DoubleCurrencyAndChainLogo
        chainId={currency0Amount?.currency.chainId}
        currencies={[currency0Amount?.currency, currency1Amount?.currency]}
        size={currencyLogoSize}
      />
      <Flex grow $md={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Flex row gap="$gap16" $md={{ flexDirection: 'column', gap: '$gap4' }}>
          <Text variant="subheading1">
            {currency0Amount?.currency.symbol} / {currency1Amount?.currency.symbol}
          </Text>

          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges size="small" versionLabel={versionLabel} v4hook={v4hook} feeTier={feeTier} />
          </Flex>
        </Flex>
        {!hideStatusIndicator && <LiquidityPositionStatusIndicator status={status} />}
      </Flex>
    </Flex>
  )
}
