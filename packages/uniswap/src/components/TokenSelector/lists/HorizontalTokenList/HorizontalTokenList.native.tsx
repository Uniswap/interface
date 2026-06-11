import { memo } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { TokenPill } from 'uniswap/src/components/TokenSelector/items/tokens/SuggestedToken'
import { HorizontalPillRow } from 'uniswap/src/components/TokenSelector/lists/HorizontalPillRow.native'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'

export const HorizontalTokenList = memo(function HorizontalTokenListInner({
  tokens,
  onSelectCurrency,
  index,
  section,
}: HorizontalTokenListProps): JSX.Element {
  return (
    <HorizontalPillRow
      data={tokens}
      keyExtractor={keyExtractor}
      renderPill={(token) => (
        <TokenPill index={index} section={section} token={token} onSelectCurrency={onSelectCurrency} />
      )}
    />
  )
})

function keyExtractor(token: TokenOption): string {
  return token.currencyInfo.currencyId
}
