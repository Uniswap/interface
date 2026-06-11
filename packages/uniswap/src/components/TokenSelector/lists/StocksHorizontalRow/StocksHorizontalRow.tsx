import { memo } from 'react'
import { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { OnSelectRwaToken } from 'uniswap/src/components/TokenSelector/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type StocksHorizontalRowProps = {
  tokens: RwaTokenOption[]
  onSelectRwaToken: OnSelectRwaToken
  expanded?: boolean
  onExpand?: (tokens: RwaTokenOption[]) => void
}

export const StocksHorizontalRow = memo(function StocksHorizontalRow(_props: StocksHorizontalRowProps): JSX.Element {
  throw new PlatformSplitStubError('StocksHorizontalRow')
})
