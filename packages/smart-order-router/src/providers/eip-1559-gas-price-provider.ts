import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import _ from 'lodash';

import { log } from '../util/log';

import { GasPrice, IGasPriceProvider } from './gas-price-provider';

export type RawFeeHistoryResponse = {
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  oldestBlock: string;
  reward: string[];
};

export type FeeHistoryResponse = {
  baseFeePerGas: BigNumber[];
  gasUsedRatio: number[];
  oldestBlock: BigNumber;
  reward: BigNumber[];
};

// We get the Xth percentile of priority fees for transactions successfully included in previous blocks.
const DEFAULT_PRIORITY_FEE_PERCENTILE = 50;
// Infura docs say only past 4 blocks guaranteed to be available: https://infura.io/docs/ethereum#operation/eth_feeHistory
const DEFAULT_BLOCKS_TO_LOOK_BACK = 4;

/**
 * Computes a gas estimate using on-chain data from the eth_feeHistory RPC endpoint.
 *
 * Takes the average priority fee from the past `blocksToConsider` blocks, and adds it
 * to the current base fee.
 *
 * @export
 * @class EIP1559GasPriceProvider
 */
export class EIP1559GasPriceProvider extends IGasPriceProvider {
  constructor(
    protected provider: JsonRpcProvider,
    private priorityFeePercentile: number = DEFAULT_PRIORITY_FEE_PERCENTILE,
    private blocksToConsider: number = DEFAULT_BLOCKS_TO_LOOK_BACK
  ) {
    super();
  }

  public async getGasPrice(): Promise<GasPrice> {
    const feeHistoryRaw = (await this.provider.send('eth_feeHistory', [
      /**
       * @fix Use BigNumber.from(this.blocksToConsider).toHexString() after hardhat adds support
       * @see https://github.com/NomicFoundation/hardhat/issues/1585 .___.
       */
      BigNumber.from(this.blocksToConsider).toHexString().replace('0x0', '0x'),
      'latest',
      [this.priorityFeePercentile],
    ])) as RawFeeHistoryResponse;

    const feeHistory: FeeHistoryResponse = {
      baseFeePerGas: _.map(feeHistoryRaw.baseFeePerGas, (b) =>
        BigNumber.from(b)
      ),
      gasUsedRatio: feeHistoryRaw.gasUsedRatio,
      oldestBlock: BigNumber.from(feeHistoryRaw.oldestBlock),
      reward: _.map(feeHistoryRaw.reward, (b) => BigNumber.from(b[0])),
    };

    const nextBlockBaseFeePerGas =
      feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1]!;

    const averagePriorityFeePerGas = _.reduce(
      feeHistory.reward,
      (sum: BigNumber, cur: BigNumber) => sum.add(cur),
      BigNumber.from(0)
    ).div(feeHistory.reward.length);

    log.info(
      {
        feeHistory,
        feeHistoryReadable: {
          baseFeePerGas: _.map(feeHistory.baseFeePerGas, (f) => f.toString()),
          oldestBlock: feeHistory.oldestBlock.toString(),
          reward: _.map(feeHistory.reward, (r) => r.toString()),
        },
        nextBlockBaseFeePerGas: nextBlockBaseFeePerGas.toString(),
        averagePriorityFeePerGas: averagePriorityFeePerGas.toString(),
      },
      'Got fee history from provider and computed gas estimate'
    );

    const gasPriceWei = nextBlockBaseFeePerGas.add(averagePriorityFeePerGas);

    const blockNumber = feeHistory.oldestBlock.add(this.blocksToConsider);

    log.info(
      `Estimated gas price in wei: ${gasPriceWei} as of block ${blockNumber.toString()}`
    );

    return { gasPriceWei: gasPriceWei };
  }
}
