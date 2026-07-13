import { memo } from 'react'
import { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { HorizontalPillRow } from 'uniswap/src/components/TokenSelector/lists/HorizontalPillRow.native'
import { StockPill } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StockPill'
import { StocksHorizontalRowProps } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow'

export const StocksHorizontalRow = memo(function StocksHorizontalRow({
  tokens,
  onSelectRwaToken,
}: StocksHorizontalRowProps): JSX.Element {
  return (
    <HorizontalPillRow
      data={tokens}
      keyExtractor={keyExtractor}
      renderPill={(token) => <StockPill option={token} onSelectRwaToken={onSelectRwaToken} />}
    />
  )
})

function keyExtractor(token: RwaTokenOption): string {
  return `${token.chainId}-${token.address}`
}
