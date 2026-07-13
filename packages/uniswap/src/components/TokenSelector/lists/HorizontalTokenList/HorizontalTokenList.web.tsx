import { memo } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { TokenCard } from 'uniswap/src/components/TokenSelector/items/tokens/TokenCard'
import { ExpandableTokenTileRow } from 'uniswap/src/components/TokenSelector/lists/ExpandableTokenTileRow.web'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'

export const HorizontalTokenList = memo(function HorizontalTokenListInner({
  tokens,
  onSelectCurrency,
  index,
  section,
  expanded,
  onExpand,
}: HorizontalTokenListProps): JSX.Element {
  return (
    <ExpandableTokenTileRow
      tokens={tokens}
      expanded={expanded}
      keyExtractor={keyExtractor}
      renderTile={(token) => (
        <TokenCard index={index} section={section} token={token} onSelectCurrency={onSelectCurrency} />
      )}
      onExpand={onExpand}
    />
  )
})

function keyExtractor(token: TokenOption): string {
  return token.currencyInfo.currencyId
}
