import type { TokenOptionItemProps } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/TokenOptions/TokenOptionItem/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const TokenOptionItem = (_props: TokenOptionItemProps): JSX.Element => {
  throw new PlatformSplitStubError('TokenOptionItem')
}
