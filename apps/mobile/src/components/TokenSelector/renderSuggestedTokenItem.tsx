import React from 'react'
import { SuggestedToken } from 'src/components/TokenSelector/SuggestedToken'
import {
  OnSelectCurrency,
  SuggestedTokenSection,
  TokenOption,
} from 'src/components/TokenSelector/types'
import { Flex } from 'ui/src'

export function renderSuggestedTokenItem({
  item: suggestedTokens,
  index,
  section,
  onSelectCurrency,
}: {
  item: TokenOption[]
  section: SuggestedTokenSection
  index: number
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  return (
    <Flex row flexWrap="wrap" pb="$spacing4" pt="$spacing12">
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
