import { BigNumber } from '@ethersproject/bignumber';
import retry from 'async-retry';
import axios from 'axios';

import { log } from '../util/log';

import { GasPrice, IGasPriceProvider } from './gas-price-provider';

// Gas prices from ethgasstation are in x10 Gwei. Must divide by 10 to use.
export type ETHGasStationResponse = {
  fast: number;
  fastest: number;
  safeLow: number;
  average: number;
  block_time: number;
  blockNum: number;
  speed: number;
  safeLowWait: number;
  avgWait: number;
  fastWait: number;
  fastestWait: number;
};

export class ETHGasStationInfoProvider extends IGasPriceProvider {
  private url: string;
  constructor(url: string) {
    super();
    this.url = url;
  }

  public async getGasPrice(): Promise<GasPrice> {
    log.info(`About to get gas prices from gas station ${this.url}`);
    const response = await retry(
      async () => {
        return axios.get<ETHGasStationResponse>(this.url);
      },
      { retries: 1 }
    );

    const { data: gasPriceResponse, status } = response;

    if (status != 200) {
      log.error({ response }, `Unabled to get gas price from ${this.url}.`);

      throw new Error(`Unable to get gas price from ${this.url}`);
    }

    log.info(
      { gasPriceResponse },
      'Gas price response from API. About to parse "fast" to big number'
    );

    // Gas prices from ethgasstation are in GweiX10.
    const gasPriceWei = BigNumber.from(gasPriceResponse.fast)
      .div(BigNumber.from(10))
      .mul(BigNumber.from(10).pow(9));

    log.info(
      `Gas price in wei: ${gasPriceWei} as of block ${gasPriceResponse.blockNum}`
    );

    return { gasPriceWei: gasPriceWei };
  }
}
