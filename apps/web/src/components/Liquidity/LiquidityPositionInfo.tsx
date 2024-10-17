// eslint-disable-next-line no-restricted-imports
import { Position } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BadgeData, LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { LiquidityPositionStatusIndicator } from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { getProtocolVersionLabel, parseRestPosition } from 'components/Liquidity/utils'
import { DoubleCurrencyAndChainLogo } from 'components/Logo/DoubleLogo'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'

interface LiquidityPositionInfoProps {
  position: Position
}

export function LiquidityPositionInfo({ position }: LiquidityPositionInfoProps) {
  const positionInfo = useMemo(() => parseRestPosition(position), [position])
  if (!positionInfo) {
    return null
  }
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
          <Text variant="heading3">
            {currency0Amount?.currency.symbol} / {currency1Amount?.currency.symbol}
          </Text>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges
              size="small"
              badges={
                [
                  versionLabel ? { label: versionLabel } : undefined,
                  v4hook
                    ? { label: v4hook, copyable: true, icon: <DocumentList color="$neutral2" size={16} /> }
                    : undefined,
                  feeTier ? { label: `${Number(feeTier) / 10000}%` } : undefined,
                ].filter(Boolean) as BadgeData[]
              }
            />
          </Flex>
        </Flex>
        <LiquidityPositionStatusIndicator status={status} />
      </Flex>
    </Flex>
  )
}
