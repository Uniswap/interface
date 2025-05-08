import { memo } from 'react'
import { DecimalPadProps } from 'uniswap/src/features/transactions/components/DecimalPadInput/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const DecimalPad = memo(function DecimalPad(_props: DecimalPadProps): JSX.Element {
  throw new PlatformSplitStubError('DecimalPad')
})
