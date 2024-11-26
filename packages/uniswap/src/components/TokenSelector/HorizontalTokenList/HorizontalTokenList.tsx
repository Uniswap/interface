import { memo } from 'react'
import { OnSelectCurrency, TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type HorizontalTokenListProps = {
  tokens: TokenOption[]
  onSelectCurrency: OnSelectCurrency
  index: number
  section: TokenSection
  expanded?: boolean
  onExpand?: () => void
}

export const HorizontalTokenList = memo(function HorizontalTokenList(_props: HorizontalTokenListProps): JSX.Element {
  throw new PlatformSplitStubError('TokenSectionBaseList')
})
