import { FormattedUniswapXGasFeeInfo, GasFeeResult } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type GasInfo = {
  gasFee: GasFeeResult
  fiatPriceFormatted?: string
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
  isHighRelativeToValue: boolean
  isLoading: boolean
  chainId: UniverseChainId
}
