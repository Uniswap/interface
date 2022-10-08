import { BigNumber } from '@ethersproject/bignumber';
import axios from 'axios';
import { mocked } from 'ts-jest/utils';
import { ETHGasStationInfoProvider } from '../../../src/providers/eth-gas-station-info-gas-price-provider';

jest.mock('axios');

describe('gas price provider', () => {
  let ethGasStationInfo: ETHGasStationInfoProvider;
  beforeAll(() => {
    mocked(axios.get).mockResolvedValue({
      data: {
        fast: 10000000,
        fastest: 10000000,
        safeLow: 10000000,
        average: 10000000,
        block_time: 10000000,
        blockNum: 10000000,
        speed: 10000000,
        safeLowWait: 10000000,
        avgWait: 10000000,
        fastWait: 10000000,
        fastestWait: 10000000,
      },
      status: 200,
    });

    ethGasStationInfo = new ETHGasStationInfoProvider('dummyUrl');
  });

  test('succeeds to get gas price and converts it to wei', async () => {
    await expect(ethGasStationInfo.getGasPrice()).resolves.toMatchObject({
      gasPriceWei: BigNumber.from('1000000000000000'),
    });
  });
});
