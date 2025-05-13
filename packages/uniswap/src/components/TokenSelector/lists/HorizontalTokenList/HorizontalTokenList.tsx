import { memo } from 'react'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type HorizontalTokenListProps = {
  tokens: TokenOption[]
  onSelectCurrency: OnSelectCurrency
  index: number
  section: OnchainItemSection<TokenOption[]>
  expanded?: boolean
  onExpand?: () => void
}

export const HorizontalTokenList = memo(function HorizontalTokenList(_props: HorizontalTokenListProps): JSX.Element {
  throw new PlatformSplitStubError('HorizontalTokenList')
})
