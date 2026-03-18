import type { TransactionRequest } from '@ethersproject/providers'
import type { FetchClient } from '@universe/api/src/clients/base/types'
import {
  type GasFeeResponse,
  type GasFeeResultWithoutState,
  type GasStrategy,
} from '@universe/api/src/clients/trading/types'
import { isWebApp } from 'utilities/src/platform'

// TODO(app-infra), de-duplicate with uniswapUrls when other consumers are migrated to use this client
const UNISWAP_API_PATHS = {
  gasFee: '/v1/gas-fee',
  trmScreen: '/v1/screen',
}

type FetchGasFn = ({
  tx,
  fallbackGasLimit,
}: {
  tx: TransactionRequest
  gasStrategy: GasStrategy
  fallbackGasLimit?: number
  smartContractDelegationAddress?: Address
}) => Promise<GasFeeResultWithoutState>

export type ScreenResponse = {
  block: boolean
}

export type ScreenRequest = {
  address: string
}

export interface UniswapApiClientContext {
  fetchClient: FetchClient
  processGasFeeResponse: (gasFeeResponse: GasFeeResponse, gasStrategy: GasStrategy) => GasFeeResultWithoutState
  estimateGasWithClientSideProvider: (params: {
    tx: TransactionRequest
    fallbackGasLimit?: number
  }) => Promise<GasFeeResultWithoutState>
}

export interface UniswapApiClient {
  fetchGasFee: FetchGasFn
  fetchTrmScreen: (params: ScreenRequest) => Promise<ScreenResponse>
}

export function createUniswapApiClient(ctx: UniswapApiClientContext): UniswapApiClient {
  const { fetchClient: client, processGasFeeResponse, estimateGasWithClientSideProvider } = ctx

  const injectGasStrategies = (
    tx: TransactionRequest,
    gasStrategy: GasStrategy,
  ): TransactionRequest & { gasStrategies: GasStrategy[] } => {
    return { ...tx, gasStrategies: [gasStrategy] }
  }

  const injectSmartContractDelegationAddress = (
    tx: TransactionRequest,
    smartContractDelegationAddress?: Address,
  ): TransactionRequest => ({
    ...tx,
    ...(smartContractDelegationAddress ? { smartContractDelegationAddress } : {}),
  })

  const fetchGasFee: FetchGasFn = async ({ tx, fallbackGasLimit, smartContractDelegationAddress, gasStrategy }) => {
    const txWithScDelegationAddress = injectSmartContractDelegationAddress(tx, smartContractDelegationAddress)
    const body = JSON.stringify(injectGasStrategies(txWithScDelegationAddress, gasStrategy))

    try {
      const gasFeeResponse = await client.post<GasFeeResponse>(UNISWAP_API_PATHS.gasFee, {
        body,
        headers: smartContractDelegationAddress
          ? {
              'x-viem-provider-enabled': 'true',
            }
          : {},
      })
      return processGasFeeResponse(gasFeeResponse, gasStrategy)
    } catch (error) {
      if (isWebApp) {
        // Gas Fee API currently errors on gas estimations on disconnected state & insufficient funds
        // Fallback to clientside estimate using provider.estimateGas
        return estimateGasWithClientSideProvider({ tx, fallbackGasLimit })
      }
      throw error
    }
  }

  const fetchTrmScreen = async (params: ScreenRequest): Promise<ScreenResponse> => {
    return await client.post<ScreenResponse>(UNISWAP_API_PATHS.trmScreen, {
      body: JSON.stringify(params),
    })
  }

  return {
    fetchGasFee,
    fetchTrmScreen,
  }
}
