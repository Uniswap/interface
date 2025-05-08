import { memo } from 'react'
import { OnSelectCurrency, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { TokenOption } from 'uniswap/src/components/lists/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type HorizontalTokenListProps = {
  tokens: TokenOption[]
  onSelectCurrency: OnSelectCurrency
  index: number
  section: TokenSection<TokenOption[]>
  expanded?: boolean
  onExpand?: () => void
}

export const HorizontalTokenList = memo(function HorizontalTokenList(_props: HorizontalTokenListProps): JSX.Element {
  throw new PlatformSplitStubError('TokenSectionBaseList')
})
