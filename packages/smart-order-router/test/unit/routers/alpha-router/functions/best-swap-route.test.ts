import { BigNumber } from '@ethersproject/bignumber';
import { Fraction, TradeType } from '@uniswap/sdk-core';
import { Pair } from '@teleswap/v2-sdk';
import { Pool } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import _ from 'lodash';
import sinon from 'sinon';
import {
  ChainId,
  CurrencyAmount,
  DAI_MAINNET,
  IGasModel,
  RouteWithValidQuote,
  USDC_MAINNET as USDC,
  V2Route,
  V2RouteWithValidQuote,
  V3PoolProvider,
  V3Route,
  V3RouteWithValidQuote,
  WRAPPED_NATIVE_CURRENCY,
} from '../../../../../src';
import { V2PoolProvider } from '../../../../../src/providers/v2/pool-provider';
import { getBestSwapRoute } from '../../../../../src/routers/alpha-router/functions/best-swap-route';
import {
  buildMockV2PoolAccessor,
  buildMockV3PoolAccessor,
  DAI_USDT,
  DAI_USDT_LOW,
  DAI_USDT_MEDIUM,
  mockRoutingConfig,
  USDC_DAI,
  USDC_DAI_LOW,
  USDC_DAI_MEDIUM,
  USDC_WETH,
  USDC_WETH_LOW,
  USDC_WETH_MEDIUM,
  WBTC_USDT_MEDIUM,
  WBTC_WETH,
  WBTC_WETH_MEDIUM,
  WETH9_USDT_LOW,
  WETH_USDT,
} from '../../../../test-util/mock-data';

const v3Route1 = new V3Route(
  [USDC_DAI_LOW, DAI_USDT_LOW, WETH9_USDT_LOW],
  USDC,
  WRAPPED_NATIVE_CURRENCY[1]
);
const v3Route2 = new V3Route([USDC_WETH_LOW], USDC, WRAPPED_NATIVE_CURRENCY[1]);
const v3Route3 = new V3Route(
  [USDC_DAI_MEDIUM, DAI_USDT_MEDIUM, WBTC_USDT_MEDIUM, WBTC_WETH_MEDIUM],
  USDC,
  WRAPPED_NATIVE_CURRENCY[1]
);
const v3Route4 = new V3Route(
  [USDC_WETH_MEDIUM],
  USDC,
  WRAPPED_NATIVE_CURRENCY[1]
);

const v2Route1 = new V2Route(
  [USDC_DAI, DAI_USDT, WETH_USDT],
  USDC,
  WRAPPED_NATIVE_CURRENCY[1]
);
const v2Route2 = new V2Route([USDC_WETH], USDC, WRAPPED_NATIVE_CURRENCY[1]);
const v2Route3 = new V2Route(
  [USDC_DAI, DAI_USDT, WETH_USDT, WBTC_WETH],
  USDC,
  WRAPPED_NATIVE_CURRENCY[1]!
);

const mockPools = [
  USDC_DAI_LOW,
  DAI_USDT_LOW,
  WETH9_USDT_LOW,
  USDC_DAI_MEDIUM,
  DAI_USDT_MEDIUM,
  WBTC_USDT_MEDIUM,
  WBTC_WETH_MEDIUM,
  USDC_WETH_LOW,
  USDC_WETH_MEDIUM,
];

describe('get best swap route', () => {
  let mockPoolProvider: sinon.SinonStubbedInstance<V3PoolProvider>;
  let mockV3GasModel: sinon.SinonStubbedInstance<
    IGasModel<V3RouteWithValidQuote>
  >;
  let mockV3PoolProvider: sinon.SinonStubbedInstance<V3PoolProvider>;
  let mockV2PoolProvider: sinon.SinonStubbedInstance<V2PoolProvider>;
  let mockV2GasModel: sinon.SinonStubbedInstance<
    IGasModel<V2RouteWithValidQuote>
  >;

  beforeEach(() => {
    mockPoolProvider = sinon.createStubInstance(V3PoolProvider);
    mockPoolProvider.getPools.resolves(buildMockV3PoolAccessor(mockPools));
    mockPoolProvider.getPoolAddress.callsFake((tA, tB, fee) => ({
      poolAddress: Pool.getAddress(tA, tB, fee),
      token0: tA,
      token1: tB,
    }));

    mockV3GasModel = {
      estimateGasCost: sinon.stub(),
    };
    mockV3GasModel.estimateGasCost.callsFake((r) => {
      return {
        gasEstimate: BigNumber.from(10000),
        gasCostInToken: CurrencyAmount.fromRawAmount(r.quoteToken, 0),
        gasCostInUSD: CurrencyAmount.fromRawAmount(USDC, 0),
      };
    });

    mockV3PoolProvider = sinon.createStubInstance(V3PoolProvider);
    const v3MockPools = [
      USDC_DAI_LOW,
      USDC_DAI_MEDIUM,
      USDC_WETH_LOW,
      WETH9_USDT_LOW,
      DAI_USDT_LOW,
    ];
    mockV3PoolProvider.getPools.resolves(buildMockV3PoolAccessor(v3MockPools));
    mockV3PoolProvider.getPoolAddress.callsFake((tA, tB, fee) => ({
      poolAddress: Pool.getAddress(tA, tB, fee),
      token0: tA,
      token1: tB,
    }));

    const v2MockPools = [DAI_USDT, USDC_WETH, WETH_USDT, USDC_DAI, WBTC_WETH];
    mockV2PoolProvider = sinon.createStubInstance(V2PoolProvider);
    mockV2PoolProvider.getPools.resolves(buildMockV2PoolAccessor(v2MockPools));
    mockV2PoolProvider.getPoolAddress.callsFake((tA, tB) => ({
      poolAddress: Pair.getAddress(tA, tB),
      token0: tA,
      token1: tB,
    }));

    mockV2GasModel = {
      estimateGasCost: sinon.stub(),
    };
    mockV2GasModel.estimateGasCost.callsFake((r: V2RouteWithValidQuote) => {
      return {
        gasEstimate: BigNumber.from(10000),
        gasCostInToken: CurrencyAmount.fromRawAmount(r.quoteToken, 0),
        gasCostInUSD: CurrencyAmount.fromRawAmount(USDC, 0),
      };
    });
  });

  const buildV3RouteWithValidQuote = (
    route: V3Route,
    tradeType: TradeType,
    amount: CurrencyAmount,
    quote: number,
    percent: number
  ): V3RouteWithValidQuote => {
    const quoteToken =
      tradeType == TradeType.EXACT_OUTPUT ? route.output : route.input;
    return new V3RouteWithValidQuote({
      amount,
      rawQuote: BigNumber.from(quote),
      sqrtPriceX96AfterList: [BigNumber.from(1)],
      initializedTicksCrossedList: [1],
      quoterGasEstimate: BigNumber.from(100000),
      percent,
      route,
      gasModel: mockV3GasModel,
      quoteToken,
      tradeType,
      v3PoolProvider: mockV3PoolProvider,
    });
  };

  const buildV3RouteWithValidQuotes = (
    route: V3Route,
    tradeType: TradeType,
    inputAmount: CurrencyAmount,
    quotes: number[],
    percents: number[]
  ) => {
    return _.map(percents, (p, i) =>
      buildV3RouteWithValidQuote(
        route,
        tradeType,
        inputAmount.multiply(new Fraction(p, 100)),
        quotes[i]!,
        p
      )
    );
  };

  const buildV2RouteWithValidQuote = (
    route: V2Route,
    tradeType: TradeType,
    amount: CurrencyAmount,
    quote: number,
    percent: number
  ): V2RouteWithValidQuote => {
    const quoteToken =
      tradeType == TradeType.EXACT_OUTPUT ? route.output : route.input;
    return new V2RouteWithValidQuote({
      amount,
      rawQuote: BigNumber.from(quote),
      percent,
      route,
      gasModel: mockV2GasModel,
      quoteToken,
      tradeType,
      v2PoolProvider: mockV2PoolProvider,
    });
  };

  const buildV2RouteWithValidQuotes = (
    route: V2Route,
    tradeType: TradeType,
    inputAmount: CurrencyAmount,
    quotes: number[],
    percents: number[]
  ) => {
    return _.map(percents, (p, i) =>
      buildV2RouteWithValidQuote(
        route,
        tradeType,
        inputAmount.multiply(new Fraction(p, 100)),
        quotes[i]!,
        p
      )
    );
  };

  test('succeeds to find 1 split best route', async () => {
    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];
    const routesWithQuotes: RouteWithValidQuote[] = [
      ...buildV3RouteWithValidQuotes(
        v3Route1,
        TradeType.EXACT_INPUT,
        amount,
        [10, 20, 30, 40],
        percents
      ),
      ...buildV2RouteWithValidQuotes(
        v2Route2,
        TradeType.EXACT_INPUT,
        amount,
        [8, 19, 28, 38],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route3,
        TradeType.EXACT_INPUT,
        amount,
        [14, 19, 23, 60],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('60');
    expect(quote.equalTo(quoteGasAdjusted)).toBeTruthy();
    expect(estimatedGasUsed.eq(BigNumber.from(10000))).toBeTruthy();
    expect(
      estimatedGasUsedUSD.equalTo(CurrencyAmount.fromRawAmount(USDC, 0))
    ).toBeTruthy();
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 0)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(1);
  });

  test('succeeds to find 2 split best route', async () => {
    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];

    const routesWithQuotes: RouteWithValidQuote[] = [
      ...buildV3RouteWithValidQuotes(
        v3Route1,
        TradeType.EXACT_INPUT,
        amount,
        [10, 20, 30, 40],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route2,
        TradeType.EXACT_INPUT,
        amount,
        [8, 19, 28, 38],
        percents
      ),
      ...buildV2RouteWithValidQuotes(
        v2Route3,
        TradeType.EXACT_INPUT,
        amount,
        [14, 19, 23, 30],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('44');
    expect(quote.equalTo(quoteGasAdjusted)).toBeTruthy();
    expect(estimatedGasUsed.eq(BigNumber.from(20000))).toBeTruthy();
    expect(
      estimatedGasUsedUSD.equalTo(CurrencyAmount.fromRawAmount(USDC, 0))
    ).toBeTruthy();
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 0)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(2);
  });

  test('succeeds to find 3 split best route', async () => {
    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];

    const routesWithQuotes: RouteWithValidQuote[] = [
      ...buildV2RouteWithValidQuotes(
        v2Route1,
        TradeType.EXACT_INPUT,
        amount,
        [10, 50, 10, 10],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route2,
        TradeType.EXACT_INPUT,
        amount,
        [25, 10, 10, 10],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route3,
        TradeType.EXACT_INPUT,
        amount,
        [25, 10, 10, 10],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('100');
    expect(quote.equalTo(quoteGasAdjusted)).toBeTruthy();
    expect(estimatedGasUsed.eq(BigNumber.from(30000))).toBeTruthy();
    expect(
      estimatedGasUsedUSD.equalTo(CurrencyAmount.fromRawAmount(USDC, 0))
    ).toBeTruthy();
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 0)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(3);
  });

  test('succeeds to find 4 split best route', async () => {
    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];

    const routesWithQuotes: RouteWithValidQuote[] = [
      ...buildV2RouteWithValidQuotes(
        v2Route1,
        TradeType.EXACT_INPUT,
        amount,
        [30, 50, 52, 54],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route2,
        TradeType.EXACT_INPUT,
        amount,
        [35, 35, 34, 50],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route3,
        TradeType.EXACT_INPUT,
        amount,
        [35, 40, 42, 50],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route4,
        TradeType.EXACT_INPUT,
        amount,
        [40, 42, 44, 56],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('140');
    expect(quote.equalTo(quoteGasAdjusted)).toBeTruthy();
    expect(estimatedGasUsed.eq(BigNumber.from(40000))).toBeTruthy();
    expect(
      estimatedGasUsedUSD.equalTo(CurrencyAmount.fromRawAmount(USDC, 0))
    ).toBeTruthy();
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 0)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(4);
  });

  test('succeeds to find best route when routes on different protocols use same pool pairs', async () => {
    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];

    // Check that even though the pools in these routes use the same tokens,
    // since they are on different protocols we are fine to route in them.
    const v2Route = new V2Route([USDC_WETH], USDC, WRAPPED_NATIVE_CURRENCY[1]!);
    const v3Route = new V3Route(
      [USDC_WETH_LOW],
      USDC,
      WRAPPED_NATIVE_CURRENCY[1]!
    );

    const routesWithQuotes: RouteWithValidQuote[] = [
      ...buildV2RouteWithValidQuotes(
        v2Route,
        TradeType.EXACT_INPUT,
        amount,
        [10, 500, 10, 10],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route,
        TradeType.EXACT_INPUT,
        amount,
        [10, 500, 10, 10],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route3,
        TradeType.EXACT_INPUT,
        amount,
        [10, 10, 10, 900],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('1000');
    expect(quote.equalTo(quoteGasAdjusted)).toBeTruthy();
    expect(estimatedGasUsed.toString()).toEqual('20000');
    expect(
      estimatedGasUsedUSD.equalTo(CurrencyAmount.fromRawAmount(USDC, 0))
    ).toBeTruthy();
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 0)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(2);
  });

  test('succeeds to find best split route with min splits', async () => {
    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];

    // Should ignore the 50k 1 split route and find the 3 split route.
    const routesWithQuotes: V3RouteWithValidQuote[] = [
      ...buildV3RouteWithValidQuotes(
        v3Route1,
        TradeType.EXACT_INPUT,
        amount,
        [30, 1000, 52, 54],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route2,
        TradeType.EXACT_INPUT,
        amount,
        [1000, 42, 34, 50],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route3,
        TradeType.EXACT_INPUT,
        amount,
        [1000, 40, 42, 50],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route4,
        TradeType.EXACT_INPUT,
        amount,
        [40, 42, 44, 56],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('3000');
    expect(quote.equalTo(quoteGasAdjusted)).toBeTruthy();
    expect(estimatedGasUsed.toString()).toBe('30000');
    expect(
      estimatedGasUsedUSD.equalTo(CurrencyAmount.fromRawAmount(USDC, 0))
    ).toBeTruthy();
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 0)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(3);
  });

  test('succeeds to find best split route with max splits', async () => {
    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];

    // Should ignore the 4 split route that returns 200k
    const routesWithQuotes: V3RouteWithValidQuote[] = [
      ...buildV3RouteWithValidQuotes(
        v3Route1,
        TradeType.EXACT_INPUT,
        amount,
        [50000, 10000, 52, 54],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route2,
        TradeType.EXACT_INPUT,
        amount,
        [50000, 42, 34, 50],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route3,
        TradeType.EXACT_INPUT,
        amount,
        [50000, 40, 42, 50],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route4,
        TradeType.EXACT_INPUT,
        amount,
        [50000, 42, 44, 56],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      {
        ...mockRoutingConfig,
        distributionPercent: 25,
        minSplits: 2,
        maxSplits: 3,
      }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('110000');
    expect(quote.equalTo(quoteGasAdjusted)).toBeTruthy();
    expect(estimatedGasUsed.toString()).toBe('30000');
    expect(
      estimatedGasUsedUSD.equalTo(CurrencyAmount.fromRawAmount(USDC, 0))
    ).toBeTruthy();
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 0)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(3);
  });

  test('succeeds to find best route accounting for gas with gas model giving usd estimate in USDC', async () => {
    // Set gas model so that each hop in route costs 10 gas.
    mockV3GasModel.estimateGasCost.callsFake((r) => {
      const hops = r.route.pools.length;
      return {
        gasEstimate: BigNumber.from(10000).mul(hops),
        gasCostInToken: CurrencyAmount.fromRawAmount(
          r.quoteToken,
          JSBI.multiply(JSBI.BigInt(10), JSBI.BigInt(hops))
        ),
        gasCostInUSD: CurrencyAmount.fromRawAmount(
          USDC,
          JSBI.multiply(JSBI.BigInt(10), JSBI.BigInt(hops))
        ),
      };
    });

    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];
    // Route 1 has 3 hops. Cost 30 gas.
    // Route 2 has 1 hop. Cost 10 gas.
    // Ignoring gas, 50% Route 1, 50% Route 2 is best swap.
    // Expect algorithm to pick 100% Route 2 instead after considering gas.
    const routesWithQuotes: V3RouteWithValidQuote[] = [
      ...buildV3RouteWithValidQuotes(
        v3Route1,
        TradeType.EXACT_INPUT,
        amount,
        [10, 50, 10, 10],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route2,
        TradeType.EXACT_INPUT,
        amount,
        [10, 50, 10, 85],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('85');
    expect(quoteGasAdjusted.quotient.toString()).toBe('75');
    expect(estimatedGasUsed.eq(BigNumber.from(10000))).toBeTruthy();
    // Code will actually convert USDC gas estimates to DAI, hence an extra 12 decimals on the quotient.
    expect(estimatedGasUsedUSD.quotient.toString()).toEqual('10000000000000');
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 10)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(1);
  });

  test('succeeds to find best route accounting for gas with gas model giving usd estimate in DAI', async () => {
    // Set gas model so that each hop in route costs 10 gas.
    mockV3GasModel.estimateGasCost.callsFake((r) => {
      const hops = r.route.pools.length;
      return {
        gasEstimate: BigNumber.from(10000).mul(hops),
        gasCostInToken: CurrencyAmount.fromRawAmount(
          r.quoteToken,
          JSBI.multiply(JSBI.BigInt(10), JSBI.BigInt(hops))
        ),
        gasCostInUSD: CurrencyAmount.fromRawAmount(
          DAI_MAINNET,
          JSBI.multiply(JSBI.BigInt(10), JSBI.BigInt(hops))
        ),
      };
    });

    const amount = CurrencyAmount.fromRawAmount(USDC, 100000);
    const percents = [25, 50, 75, 100];
    // Route 1 has 3 hops. Cost 30 gas.
    // Route 2 has 1 hop. Cost 10 gas.
    // Ignoring gas, 50% Route 1, 50% Route 2 is best swap.
    // Expect algorithm to pick 100% Route 2 instead after considering gas.
    const routesWithQuotes: V3RouteWithValidQuote[] = [
      ...buildV3RouteWithValidQuotes(
        v3Route1,
        TradeType.EXACT_INPUT,
        amount,
        [10, 50, 10, 10],
        percents
      ),
      ...buildV3RouteWithValidQuotes(
        v3Route2,
        TradeType.EXACT_INPUT,
        amount,
        [10, 50, 10, 85],
        percents
      ),
    ];

    const swapRouteType = await getBestSwapRoute(
      amount,
      percents,
      routesWithQuotes,
      TradeType.EXACT_INPUT,
      ChainId.MAINNET,
      { ...mockRoutingConfig, distributionPercent: 25 }
    )!;

    const {
      quote,
      routes,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedUSD,
      estimatedGasUsedQuoteToken,
    } = swapRouteType!;

    expect(quote.quotient.toString()).toBe('85');
    expect(quoteGasAdjusted.quotient.toString()).toBe('75');
    expect(estimatedGasUsed.eq(BigNumber.from(10000))).toBeTruthy();
    // Code will actually convert USDC gas estimates to DAI, hence an extra 12 decimals on the quotient.
    expect(estimatedGasUsedUSD.quotient.toString()).toEqual('10');
    expect(
      estimatedGasUsedQuoteToken.equalTo(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1]!, 10)
      )
    ).toBeTruthy();
    expect(routes).toHaveLength(1);
  });
});
