// eslint-disable-next-line no-restricted-imports
import { Position, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionFeeStats } from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { parseRestPosition, useV2PositionDerivedInfo, useV3PositionDerivedInfo } from 'components/Liquidity/utils'
import { useMemo } from 'react'
import { Flex, FlexProps } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function LiquidityPositionCard({ liquidityPosition, ...rest }: { liquidityPosition: Position } & FlexProps) {
  const positionInfo = useMemo(() => parseRestPosition(liquidityPosition), [liquidityPosition])
  const { formatCurrencyAmount } = useLocalizationContext()
  const {
    fiatFeeValue0,
    fiatFeeValue1,
    fiatValue0,
    fiatValue1,
    priceOrdering: { priceLower, priceUpper },
  } = useV3PositionDerivedInfo(positionInfo)
  const { token0USDValue, token1USDValue } = useV2PositionDerivedInfo(positionInfo)

  const v3FormattedUsdValue =
    fiatValue0 && fiatValue1
      ? formatCurrencyAmount({
          value: fiatValue0.add(fiatValue1),
          type: NumberType.FiatTokenPrice,
        })
      : '-'
  const v2FormattedUsdValue =
    token0USDValue && token1USDValue
      ? formatCurrencyAmount({ value: token0USDValue.add(token1USDValue), type: NumberType.FiatStandard })
      : '-'

  const v3FormattedFeesValue =
    fiatFeeValue0 && fiatFeeValue1
      ? formatCurrencyAmount({
          value: fiatFeeValue0.add(fiatFeeValue1),
          type: NumberType.FiatTokenPrice,
        })
      : '-'

  if (!liquidityPosition || !positionInfo) {
    return null
  }

  return (
    <Flex
      p="$spacing24"
      gap="$spacing24"
      borderWidth={1}
      borderRadius="$rounded20"
      borderColor="$surface3"
      width="100%"
      overflow="hidden"
      {...rest}
    >
      <Flex row alignItems="center" justifyContent="space-between">
        <LiquidityPositionInfo position={liquidityPosition} />
        {/* TODO (WEB-4920): add the range chart */}
      </Flex>
      <LiquidityPositionFeeStats
        formattedUsdValue={v3FormattedUsdValue ?? v2FormattedUsdValue}
        formattedUsdFees={positionInfo.version === ProtocolVersion.V3 ? v3FormattedFeesValue : undefined}
        lowPrice={priceLower}
        highPrice={priceUpper}
        // TODO (WEB-4920): add total APR and fee APR
      />
    </Flex>
  )
}
