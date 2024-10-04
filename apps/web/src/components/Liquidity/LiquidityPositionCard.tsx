// eslint-disable-next-line no-restricted-imports
import { Position } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Price } from '@uniswap/sdk-core'
import { LiquidityPositionFeeStats } from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { usePositionInfo } from 'components/Liquidity/utils'
import { Flex, FlexProps } from 'ui/src'

export function LiquidityPositionCard({ liquidityPosition, ...rest }: { liquidityPosition: Position } & FlexProps) {
  const positionInfo = usePositionInfo(liquidityPosition)
  if (!liquidityPosition || !positionInfo) {
    return null
  }

  const { currency0Amount, currency1Amount } = positionInfo
  return (
    <Flex
      p="$spacing24"
      gap="$spacing24"
      borderWidth={1}
      borderRadius="$rounded20"
      borderColor="$surface3"
      width="100%"
      {...rest}
    >
      <Flex row alignItems="center" justifyContent="space-between">
        <LiquidityPositionInfo position={liquidityPosition} />
        {/* TODO: add the range chart */}
      </Flex>
      {/* TODO: calculate the real fee stats here: */}
      <LiquidityPositionFeeStats
        formattedUsdValue="$1,245.14"
        formattedUsdFees="$11.41"
        totalApr="122.41%"
        feeApr="134.78%"
        lowPrice={new Price(currency0Amount.currency, currency1Amount.currency, '1', '2')}
        highPrice={new Price(currency0Amount.currency, currency1Amount.currency, '1', '3')}
      />
    </Flex>
  )
}
