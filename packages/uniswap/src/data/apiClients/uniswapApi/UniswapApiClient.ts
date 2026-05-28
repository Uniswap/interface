import { TransactionRequest } from '@ethersproject/providers'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { GasEstimate, GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/hooks'
import {
  GasFeeResponse,
  GasFeeResult,
  TransactionEip1559FeeParams,
  TransactionLegacyFeeParams,
  areEqualGasStrategies,
} from 'uniswap/src/features/gas/types'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { isInterface } from 'utilities/src/platform'

const UniswapApiClient = createApiClient({
  baseUrl: uniswapUrls.apiBaseUrl,
  additionalHeaders: {
    'x-api-key': config.uniswapApiKey,
  },
  includeBaseUniswapHeaders: !isInterface,
})

type FetchGasFn = ({
  tx,
  fallbackGasLimit,
}: {
  tx: TransactionRequest
  fallbackGasLimit?: number
}) => Promise<GasFeeResultWithoutState>

// TODO(WALL-6421): Remove this type once GasFeeResult shape is decoupled from state fields
export type GasFeeResultWithoutState = Omit<GasFeeResult, 'isLoading' | 'error'>
export function createFetchGasFee({
  activeGasStrategy,
  shadowGasStrategies,
}: {
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
}): FetchGasFn {
  const injectGasStrategies = (tx: TransactionRequest): TransactionRequest & { gasStrategies: GasStrategy[] } => {
    return { ...tx, gasStrategies: [activeGasStrategy, ...shadowGasStrategies] }
  }

  const processGasFeeResponse = (gasFeeResponse: GasFeeResponse): GasFeeResultWithoutState => {
    const activeEstimate = gasFeeResponse.gasEstimates?.find((e) =>
      areEqualGasStrategies(e.strategy, activeGasStrategy),
    )

    if (!activeEstimate) {
      throw new Error('Could not get gas estimate')
    }

    return {
      value: activeEstimate.gasFee,
      displayValue: convertGasFeeToDisplayValue(activeEstimate.gasFee, activeGasStrategy),
      params: extractGasFeeParams(activeEstimate),
      gasEstimates: {
        activeEstimate,
        shadowEstimates: gasFeeResponse.gasEstimates?.filter((e) => e !== activeEstimate),
      },
    }
  }

  const tryClientSideFallback: FetchGasFn = async ({ tx, fallbackGasLimit }) => {
    try {
      if (!tx.chainId) {
        throw new Error('No chainId for clientside gas estimation')
      }
      const provider = createEthersProvider(tx.chainId)
      if (!provider) {
        throw new Error('No provider for clientside gas estimation')
      }
      const gasUseEstimate = (await provider.estimateGas(tx)).toNumber() * 10e9

      return {
        value: gasUseEstimate.toString(),
        displayValue: gasUseEstimate.toString(),
      }
    } catch (e) {
      // provider.estimateGas will error if the account doesn't have sufficient ETH balance, but we should show an estimated cost anyway
      return {
        value: fallbackGasLimit?.toString(),
        // These estimates don't inflate the gas limit, so we can use the same value for display
        displayValue: fallbackGasLimit?.toString(),
      }
    }
  }

  const fetchGasFee: FetchGasFn = async ({ tx, fallbackGasLimit }) => {
    const body = JSON.stringify(injectGasStrategies(tx))

    try {
      const gasFeeResponse = await UniswapApiClient.post<GasFeeResponse>(uniswapUrls.gasServicePath, { body })
      return processGasFeeResponse(gasFeeResponse)
    } catch (error) {
      if (isInterface) {
        // Gas Fee API currently errors on gas estimations on disconnected state & insufficient funds
        // Fallback to clientside estimate using provider.estimateGas
        return tryClientSideFallback({ tx, fallbackGasLimit })
      }
      throw error
    }
  }

  return fetchGasFee
}

function extractGasFeeParams(estimate: GasEstimate): TransactionLegacyFeeParams | TransactionEip1559FeeParams {
  if ('maxFeePerGas' in estimate) {
    return {
      maxFeePerGas: estimate.maxFeePerGas,
      maxPriorityFeePerGas: estimate.maxPriorityFeePerGas,
      gasLimit: estimate.gasLimit,
    }
  } else {
    return {
      gasPrice: estimate.gasPrice,
      gasLimit: estimate.gasLimit,
    }
  }
}

export type ScreenResponse = {
  block: boolean
}

export type ScreenRequest = {
  address: string
}

export async function fetchTrmScreen(params: ScreenRequest): Promise<ScreenResponse> {
  return await UniswapApiClient.post<ScreenResponse>(uniswapUrls.trmPath, {
    body: JSON.stringify(params),
  })
}
