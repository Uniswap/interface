import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@ubeswap/sdk-core'

import { SwapOptions, SwapRoute, SwapType } from '../routers'
import { log } from '../util'
import { calculateGasUsed, initSwapRouteFromExisting } from '../util/gas-factory-helpers'

import { IPortionProvider } from './portion-provider'
import { ProviderConfig } from './provider'
import { SimulationStatus, Simulator } from './simulation-provider'
import { IV2PoolProvider } from './v2/pool-provider'
import { ArbitrumGasData, OptimismGasData } from './v3/gas-data-provider'
import { IV3PoolProvider } from './v3/pool-provider'

// We multiply eth estimate gas by this to add a buffer for gas limits
const DEFAULT_ESTIMATE_MULTIPLIER = 1.2

export class EthEstimateGasSimulator extends Simulator {
  v2PoolProvider: IV2PoolProvider
  v3PoolProvider: IV3PoolProvider
  private overrideEstimateMultiplier: { [chainId in ChainId]?: number }

  constructor(
    chainId: ChainId,
    provider: JsonRpcProvider,
    v2PoolProvider: IV2PoolProvider,
    v3PoolProvider: IV3PoolProvider,
    portionProvider: IPortionProvider,
    overrideEstimateMultiplier?: { [chainId in ChainId]?: number }
  ) {
    super(provider, portionProvider, chainId)
    this.v2PoolProvider = v2PoolProvider
    this.v3PoolProvider = v3PoolProvider
    this.overrideEstimateMultiplier = overrideEstimateMultiplier ?? {}
  }

  async ethEstimateGas(
    fromAddress: string,
    swapOptions: SwapOptions,
    route: SwapRoute,
    l2GasData?: ArbitrumGasData | OptimismGasData,
    providerConfig?: ProviderConfig
  ): Promise<SwapRoute> {
    const currencyIn = route.trade.inputAmount.currency
    let estimatedGasUsed: BigNumber
    if (swapOptions.type == SwapType.UNIVERSAL_ROUTER) {
      log.info({ methodParameters: route.methodParameters }, 'Simulating using eth_estimateGas on Universal Router')
      try {
        estimatedGasUsed = await this.provider.estimateGas({
          data: route.methodParameters!.calldata,
          to: route.methodParameters!.to,
          from: fromAddress,
          value: BigNumber.from(currencyIn.isNative ? route.methodParameters!.value : '0'),
        })
      } catch (e) {
        log.error({ e }, 'Error estimating gas')
        return {
          ...route,
          simulationStatus: SimulationStatus.Failed,
        }
      }
    } else if (swapOptions.type == SwapType.SWAP_ROUTER_02) {
      try {
        estimatedGasUsed = await this.provider.estimateGas({
          data: route.methodParameters!.calldata,
          to: route.methodParameters!.to,
          from: fromAddress,
          value: BigNumber.from(currencyIn.isNative ? route.methodParameters!.value : '0'),
        })
      } catch (e) {
        log.error({ e }, 'Error estimating gas')
        return {
          ...route,
          simulationStatus: SimulationStatus.Failed,
        }
      }
    } else {
      throw new Error(`Unsupported swap type ${swapOptions}`)
    }

    estimatedGasUsed = this.adjustGasEstimate(estimatedGasUsed)
    log.info(
      {
        methodParameters: route.methodParameters,
        estimatedGasUsed: estimatedGasUsed.toString(),
      },
      'Simulated using eth_estimateGas on SwapRouter02'
    )

    const { estimatedGasUsedUSD, estimatedGasUsedQuoteToken, quoteGasAdjusted } = await calculateGasUsed(
      route.quote.currency.chainId,
      route,
      estimatedGasUsed,
      this.v2PoolProvider,
      this.v3PoolProvider,
      l2GasData,
      providerConfig
    )
    return {
      ...initSwapRouteFromExisting(
        route,
        this.v2PoolProvider,
        this.v3PoolProvider,
        this.portionProvider,
        quoteGasAdjusted,
        estimatedGasUsed,
        estimatedGasUsedQuoteToken,
        estimatedGasUsedUSD,
        swapOptions
      ),
      simulationStatus: SimulationStatus.Succeeded,
    }
  }

  private adjustGasEstimate(gasLimit: BigNumber): BigNumber {
    const estimateMultiplier = this.overrideEstimateMultiplier[this.chainId] ?? DEFAULT_ESTIMATE_MULTIPLIER

    const adjustedGasEstimate = BigNumber.from(gasLimit)
      .mul(estimateMultiplier * 100)
      .div(100)

    return adjustedGasEstimate
  }

  protected async simulateTransaction(
    fromAddress: string,
    swapOptions: SwapOptions,
    swapRoute: SwapRoute,
    l2GasData?: OptimismGasData | ArbitrumGasData | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _providerConfig?: ProviderConfig | undefined
  ): Promise<SwapRoute> {
    const inputAmount = swapRoute.trade.inputAmount
    if (
      inputAmount.currency.isNative ||
      (await this.checkTokenApproved(fromAddress, inputAmount, swapOptions, this.provider))
    ) {
      return await this.ethEstimateGas(fromAddress, swapOptions, swapRoute, l2GasData)
    } else {
      log.info('Token not approved, skipping simulation')
      return {
        ...swapRoute,
        simulationStatus: SimulationStatus.NotApproved,
      }
    }
  }
}
