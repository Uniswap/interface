import { Flex } from 'ui/src/'
import { HorizontalTokenListProps } from 'uniswap/src/components/TokenSelector/HorizontalTokenList/HorizontalTokenList'
import { SuggestedToken } from 'uniswap/src/components/TokenSelector/SuggestedToken'

export function HorizontalTokenList({
  tokens: suggestedTokens,
  onSelectCurrency,
  index,
  section,
}: HorizontalTokenListProps): JSX.Element {
  return (
    <Flex row flexWrap="wrap" gap="$spacing8" py="$spacing8" px="$spacing16">
      {suggestedTokens.map((token) => (
        <SuggestedToken
          key={token.currencyInfo.currencyId}
          index={index}
          section={section}
          token={token}
          onSelectCurrency={onSelectCurrency}
        />
      ))}
    </Flex>
  )
}
