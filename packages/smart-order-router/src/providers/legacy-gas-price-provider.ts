import { JsonRpcProvider } from '@ethersproject/providers';

import { log } from '../util';

import { GasPrice, IGasPriceProvider } from './gas-price-provider';

export class LegacyGasPriceProvider extends IGasPriceProvider {
  constructor(protected provider: JsonRpcProvider) {
    super();
  }

  public async getGasPrice(): Promise<GasPrice> {
    const gasPriceWei = await this.provider.getGasPrice();
    log.info(
      { gasPriceWei },
      `Got gas price ${gasPriceWei} using eth_gasPrice RPC`
    );

    return {
      gasPriceWei,
    };
  }
}
