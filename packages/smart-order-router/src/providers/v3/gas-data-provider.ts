import { BigNumber } from '@ethersproject/bignumber'
import { BaseProvider } from '@ethersproject/providers'
import { ChainId } from '@ubeswap/sdk-core'

import { GasDataArbitrum__factory } from '../../types/other/factories/GasDataArbitrum__factory'
import { GasPriceOracle__factory } from '../../types/other/factories/GasPriceOracle__factory'
import { ARB_GASINFO_ADDRESS, log, OVM_GASPRICE_ADDRESS } from '../../util'
import { IMulticallProvider } from '../multicall-provider'

/**
 * Provider for getting gas constants on L2s.
 *
 * @export
 * @interface IL2GasDataProvider
 */
export interface IL2GasDataProvider<T> {
  /**
   * Gets the data constants needed to calculate the l1 security fee on L2s like arbitrum and optimism.
   * @returns An object that includes the data necessary for the off chain estimations.
   */
  getGasData(): Promise<T>
}

export type OptimismGasData = {
  l1BaseFee: BigNumber
  scalar: BigNumber
  decimals: BigNumber
  overhead: BigNumber
}

export class OptimismGasDataProvider implements IL2GasDataProvider<OptimismGasData> {
  protected gasOracleAddress: string

  constructor(protected chainId: ChainId, protected multicall2Provider: IMulticallProvider, gasPriceAddress?: string) {
    if (chainId !== ChainId.OPTIMISM && chainId !== ChainId.BASE) {
      throw new Error('This data provider is used only on optimism networks.')
    }
    this.gasOracleAddress = gasPriceAddress ?? OVM_GASPRICE_ADDRESS
  }

  /**
   * Gets the data constants needed to calculate the l1 security fee on Optimism.
   * @returns An OptimismGasData object that includes the l1BaseFee,
   * scalar, decimals, and overhead values.
   */
  public async getGasData(): Promise<OptimismGasData> {
    const funcNames = ['l1BaseFee', 'scalar', 'decimals', 'overhead']
    const tx = await this.multicall2Provider.callMultipleFunctionsOnSameContract<undefined, [BigNumber]>({
      address: this.gasOracleAddress,
      contractInterface: GasPriceOracle__factory.createInterface(),
      functionNames: funcNames,
    })

    if (!tx.results[0]?.success || !tx.results[1]?.success || !tx.results[2]?.success || !tx.results[3]?.success) {
      log.info({ results: tx.results }, 'Failed to get gas constants data from the optimism gas oracle')
      throw new Error('Failed to get gas constants data from the optimism gas oracle')
    }

    const { result: l1BaseFee } = tx.results![0]
    const { result: scalar } = tx.results![1]
    const { result: decimals } = tx.results![2]
    const { result: overhead } = tx.results![3]

    return {
      l1BaseFee: l1BaseFee[0],
      scalar: scalar[0],
      decimals: decimals[0],
      overhead: overhead[0],
    }
  }
}

/**
 * perL2TxFee is the base fee in wei for an l2 transaction.
 * perL2CalldataFee is the fee in wei per byte of calldata the swap uses. Multiply by the total bytes of the calldata.
 * perArbGasTotal is the fee in wei per unit of arbgas. Multiply this by the estimate we calculate based on ticks/hops in the gasModel.
 */
export type ArbitrumGasData = {
  perL2TxFee: BigNumber
  perL1CalldataFee: BigNumber
  perArbGasTotal: BigNumber
}

export class ArbitrumGasDataProvider implements IL2GasDataProvider<ArbitrumGasData> {
  protected gasFeesAddress: string
  protected blockNumberOverride: number | Promise<number> | undefined

  constructor(protected chainId: ChainId, protected provider: BaseProvider, gasDataAddress?: string) {
    this.gasFeesAddress = gasDataAddress ? gasDataAddress : ARB_GASINFO_ADDRESS
  }

  public async getGasData() {
    const gasDataContract = GasDataArbitrum__factory.connect(this.gasFeesAddress, this.provider)
    const gasData = await gasDataContract.getPricesInWei()
    return {
      perL2TxFee: gasData[0],
      perL1CalldataFee: gasData[1],
      perArbGasTotal: gasData[5],
    }
  }
}
