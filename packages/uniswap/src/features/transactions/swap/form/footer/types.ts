import { UniverseChainId } from 'uniswap/src/features/chains/types'

import { FormattedUniswapXGasFeeInfo, GasFeeResult } from 'uniswap/src/features/gas/types'

export type GasInfo = {
  gasFee: GasFeeResult
  fiatPriceFormatted?: string
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
  isHighRelativeToValue: boolean
  isLoading: boolean
  chainId: UniverseChainId
}
