import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import {
  LiquidityPositionStatusIndicator,
  LiquidityPositionStatusIndicatorLoader,
} from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { PositionInfo } from 'components/Liquidity/types'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { TextLoader } from 'pages/Pool/Positions/shared'
import { Circle, Flex, Text } from 'ui/src'

interface LiquidityPositionInfoProps {
  positionInfo: PositionInfo
  currencyLogoSize?: number
  hideStatusIndicator?: boolean
  isMiniVersion?: boolean
}

export function LiquidityPositionInfoLoader({ hideStatus }: { hideStatus?: boolean }) {
  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }}>
      <Circle size={44} backgroundColor="$surface3" />
      <Flex grow $md={{ row: true, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Flex my={hideStatus ? 'auto' : '$none'}>
          <TextLoader variant="subheading1" width={100} />
        </Flex>
        {!hideStatus && <LiquidityPositionStatusIndicatorLoader />}
      </Flex>
    </Flex>
  )
}

export function LiquidityPositionInfo({
  positionInfo,
  currencyLogoSize = 44,
  hideStatusIndicator = false,
  isMiniVersion = false,
}: LiquidityPositionInfoProps) {
  const { currency0Amount, currency1Amount, status, feeTier, v4hook, version } = positionInfo
  const versionLabel = getProtocolVersionLabel(version)
  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }} alignItems={isMiniVersion ? 'center' : 'flex-start'}>
      <DoubleCurrencyLogo currencies={[currency0Amount?.currency, currency1Amount?.currency]} size={currencyLogoSize} />
      <Flex
        flexDirection={isMiniVersion ? 'column' : 'row'}
        gap={isMiniVersion ? '$gap0' : '$gap16'}
        $md={{ row: false, gap: isMiniVersion ? '$gap0' : '$gap4' }}
        alignItems="flex-start"
      >
        <Flex $md={{ row: true, gap: '$gap16' }}>
          <Text variant="subheading1">
            {currency0Amount?.currency.symbol} / {currency1Amount?.currency.symbol}
          </Text>
          {!hideStatusIndicator && <LiquidityPositionStatusIndicator status={status} />}
        </Flex>

        <Flex row gap={2} alignItems="center" mt="$spacing4">
          <LiquidityPositionInfoBadges size="small" versionLabel={versionLabel} v4hook={v4hook} feeTier={feeTier} />
        </Flex>
      </Flex>
    </Flex>
  )
}
