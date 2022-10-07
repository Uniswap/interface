import { Pair } from '@teleswap/v2-sdk';
import { encodeSqrtRatioX96, FeeAmount, Pool } from '@uniswap/v3-sdk';
import {
  CurrencyAmount,
  DAI_MAINNET as DAI,
  USDC_MAINNET as USDC,
  USDT_MAINNET as USDT,
  WBTC_MAINNET as WBTC,
} from '../../../../../src';
import {
  computeAllV2Routes,
  computeAllV3Routes,
} from '../../../../../src/routers/alpha-router/functions/compute-all-routes';
import {
  DAI_USDT,
  DAI_USDT_LOW,
  USDC_DAI,
  USDC_DAI_LOW,
  USDC_DAI_MEDIUM,
  USDC_WETH,
  USDC_WETH_LOW,
  WBTC_WETH,
  WETH9_USDT_LOW,
  WETH_USDT,
} from '../../../../test-util/mock-data';

describe('compute all v3 routes', () => {
  test('succeeds to compute all routes', async () => {
    const pools = [
      USDC_DAI_LOW,
      USDC_DAI_MEDIUM,
      USDC_WETH_LOW,
      WETH9_USDT_LOW,
      DAI_USDT_LOW,
    ];
    const routes = computeAllV3Routes(USDC, DAI, pools, 3);

    expect(routes).toHaveLength(3);
  });

  test('succeeds to compute all routes with 1 hop', async () => {
    const pools = [
      USDC_DAI_LOW,
      USDC_DAI_MEDIUM,
      USDC_WETH_LOW,
      WETH9_USDT_LOW,
      DAI_USDT_LOW,
    ];
    const routes = computeAllV3Routes(USDC, DAI, pools, 1);

    expect(routes).toHaveLength(2);
  });

  test('succeeds when no routes', async () => {
    const pools = [
      USDC_DAI_LOW,
      USDC_DAI_MEDIUM,
      USDC_WETH_LOW,
      WETH9_USDT_LOW,
      DAI_USDT_LOW,
      new Pool(USDT, WBTC, FeeAmount.LOW, encodeSqrtRatioX96(1, 1), 500, 0),
    ];

    // No way to get from USDC to WBTC in 2 hops
    const routes = computeAllV3Routes(USDC, WBTC, pools, 2);

    expect(routes).toHaveLength(0);
  });
});

describe('compute all v2 routes', () => {
  test('succeeds to compute all routes', async () => {
    const pools = [DAI_USDT, USDC_WETH, WETH_USDT, USDC_DAI, WBTC_WETH];
    const routes = computeAllV2Routes(USDC, DAI, pools, 3);

    expect(routes).toHaveLength(2);
  });

  test('succeeds to compute all routes with 1 hop', async () => {
    const pools = [DAI_USDT, USDC_WETH, WETH_USDT, USDC_DAI, WBTC_WETH];
    const routes = computeAllV2Routes(USDC, DAI, pools, 1);

    expect(routes).toHaveLength(1);
  });

  test('succeeds when no routes', async () => {
    const pools = [
      DAI_USDT,
      WETH_USDT,
      USDC_DAI,
      WBTC_WETH,
      new Pair(
        CurrencyAmount.fromRawAmount(USDT, 10),
        CurrencyAmount.fromRawAmount(WBTC, 10)
      ),
    ];

    // No way to get from USDC to WBTC in 2 hops
    const routes = computeAllV2Routes(USDC, WBTC, pools, 2);

    expect(routes).toHaveLength(0);
  });
});
