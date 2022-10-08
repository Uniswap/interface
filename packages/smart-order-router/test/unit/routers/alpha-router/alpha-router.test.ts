import { BigNumber } from '@ethersproject/bignumber';
import { BaseProvider } from '@ethersproject/providers';
import { Protocol, SwapRouter } from '@uniswap/router-sdk';
import { Fraction, Percent, TradeType } from '@uniswap/sdk-core';
import { Pair } from '@teleswap/v2-sdk';
import { encodeSqrtRatioX96, Pool, Position } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import _ from 'lodash';
import sinon from 'sinon';
import {
  AlphaRouter,
  AlphaRouterConfig,
  AmountQuote,
  CachingTokenListProvider,
  CurrencyAmount,
  DAI_MAINNET as DAI,
  ETHGasStationInfoProvider,
  FallbackTenderlySimulator,
  MixedRoute,
  MixedRouteWithValidQuote,
  OnChainQuoteProvider,
  parseAmount,
  RouteWithQuotes,
  SwapAndAddConfig,
  SwapAndAddOptions,
  SwapRouterProvider,
  SwapToRatioStatus,
  TokenProvider,
  UniswapMulticallProvider,
  USDC_MAINNET as USDC,
  USDT_MAINNET as USDT,
  V2AmountQuote,
  V2QuoteProvider,
  V2Route,
  V2RouteWithQuotes,
  V2RouteWithValidQuote,
  V2SubgraphPool,
  V2SubgraphProvider,
  V3HeuristicGasModelFactory,
  V3PoolProvider,
  V3Route,
  V3RouteWithValidQuote,
  V3SubgraphPool,
  V3SubgraphProvider,
  WRAPPED_NATIVE_CURRENCY,
} from '../../../../src';
import { ProviderConfig } from '../../../../src/providers/provider';
import {
  TokenValidationResult,
  TokenValidatorProvider,
} from '../../../../src/providers/token-validator-provider';
import { V2PoolProvider } from '../../../../src/providers/v2/pool-provider';
import { MixedRouteHeuristicGasModelFactory } from '../../../../src/routers/alpha-router/gas-models/mixedRoute/mixed-route-heuristic-gas-model';
import { V2HeuristicGasModelFactory } from '../../../../src/routers/alpha-router/gas-models/v2/v2-heuristic-gas-model';
import {
  buildMockTokenAccessor,
  buildMockV2PoolAccessor,
  buildMockV3PoolAccessor,
  DAI_USDT,
  DAI_USDT_LOW,
  DAI_USDT_MEDIUM,
  mockBlock,
  mockBlockBN,
  mockGasPriceWeiBN,
  MOCK_ZERO_DEC_TOKEN,
  pairToV2SubgraphPool,
  poolToV3SubgraphPool,
  USDC_DAI,
  USDC_DAI_LOW,
  USDC_DAI_MEDIUM,
  USDC_MOCK_LOW,
  USDC_USDT_MEDIUM,
  USDC_WETH,
  USDC_WETH_LOW,
  WBTC_WETH,
  WETH9_USDT_LOW,
  WETH_USDT,
} from '../../../test-util/mock-data';

const helper = require('../../../../src/routers/alpha-router/functions/calculate-ratio-amount-in');

describe.only('alpha router', () => {
  let mockProvider: sinon.SinonStubbedInstance<BaseProvider>;
  let mockMulticallProvider: sinon.SinonStubbedInstance<UniswapMulticallProvider>;
  let mockTokenProvider: sinon.SinonStubbedInstance<TokenProvider>;

  let mockV3PoolProvider: sinon.SinonStubbedInstance<V3PoolProvider>;
  let mockV3SubgraphProvider: sinon.SinonStubbedInstance<V3SubgraphProvider>;
  let mockOnChainQuoteProvider: sinon.SinonStubbedInstance<OnChainQuoteProvider>;
  let mockV3GasModelFactory: sinon.SinonStubbedInstance<V3HeuristicGasModelFactory>;
  let mockMixedRouteGasModelFactory: sinon.SinonStubbedInstance<MixedRouteHeuristicGasModelFactory>;

  let mockV2PoolProvider: sinon.SinonStubbedInstance<V2PoolProvider>;
  let mockV2SubgraphProvider: sinon.SinonStubbedInstance<V2SubgraphProvider>;
  let mockV2QuoteProvider: sinon.SinonStubbedInstance<V2QuoteProvider>;
  let mockV2GasModelFactory: sinon.SinonStubbedInstance<V2HeuristicGasModelFactory>;

  let mockGasPriceProvider: sinon.SinonStubbedInstance<ETHGasStationInfoProvider>;

  let mockBlockTokenListProvider: sinon.SinonStubbedInstance<CachingTokenListProvider>;
  let mockTokenValidatorProvider: sinon.SinonStubbedInstance<TokenValidatorProvider>;

  let mockFallbackTenderlySimulator: sinon.SinonStubbedInstance<FallbackTenderlySimulator>;

  let alphaRouter: AlphaRouter;

  const ROUTING_CONFIG: AlphaRouterConfig = {
    v3PoolSelection: {
      topN: 0,
      topNDirectSwaps: 0,
      topNTokenInOut: 0,
      topNSecondHop: 0,
      topNWithEachBaseToken: 0,
      topNWithBaseToken: 0,
    },
    v2PoolSelection: {
      topN: 0,
      topNDirectSwaps: 0,
      topNTokenInOut: 0,
      topNSecondHop: 0,
      topNWithEachBaseToken: 0,
      topNWithBaseToken: 0,
    },
    maxSwapsPerPath: 3,
    minSplits: 1,
    maxSplits: 3,
    distributionPercent: 25,
    forceCrossProtocol: false,
  };

  const SWAP_AND_ADD_CONFIG: SwapAndAddConfig = {
    ratioErrorTolerance: new Fraction(1, 100),
    maxIterations: 6,
  };

  const SWAP_AND_ADD_OPTIONS: SwapAndAddOptions = {
    addLiquidityOptions: {
      recipient: `0x${'00'.repeat(19)}01`,
    },
    swapOptions: {
      deadline: 100,
      recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      slippageTolerance: new Percent(5, 10_000),
    },
  };

  const sumFn = (currencyAmounts: CurrencyAmount[]): CurrencyAmount => {
    let sum = currencyAmounts[0]!;
    for (let i = 1; i < currencyAmounts.length; i++) {
      sum = sum.add(currencyAmounts[i]!);
    }
    return sum;
  };

  beforeEach(() => {
    mockProvider = sinon.createStubInstance(BaseProvider);
    mockProvider.getBlockNumber.resolves(mockBlock);

    mockMulticallProvider = sinon.createStubInstance(UniswapMulticallProvider);

    mockTokenProvider = sinon.createStubInstance(TokenProvider);
    const mockTokens = [
      USDC,
      DAI,
      WRAPPED_NATIVE_CURRENCY[1],
      USDT,
      MOCK_ZERO_DEC_TOKEN,
    ];
    mockTokenProvider.getTokens.resolves(buildMockTokenAccessor(mockTokens));

    mockV3PoolProvider = sinon.createStubInstance(V3PoolProvider);
    const v3MockPools = [
      USDC_DAI_LOW,
      USDC_DAI_MEDIUM,
      USDC_WETH_LOW,
      WETH9_USDT_LOW,
      DAI_USDT_LOW,
      USDC_USDT_MEDIUM,
      USDC_MOCK_LOW,
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

    mockV3SubgraphProvider = sinon.createStubInstance(V3SubgraphProvider);
    const v3MockSubgraphPools: V3SubgraphPool[] = _.map(
      v3MockPools,
      poolToV3SubgraphPool
    );
    mockV3SubgraphProvider.getPools.resolves(v3MockSubgraphPools);

    mockV2SubgraphProvider = sinon.createStubInstance(V2SubgraphProvider);
    const v2MockSubgraphPools: V2SubgraphPool[] = _.map(
      v2MockPools,
      pairToV2SubgraphPool
    );
    mockV2SubgraphProvider.getPools.resolves(v2MockSubgraphPools);

    mockOnChainQuoteProvider = sinon.createStubInstance(OnChainQuoteProvider);
    mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
      getQuotesManyExactInFn<V3Route | V2Route | MixedRoute>()
    );
    mockOnChainQuoteProvider.getQuotesManyExactOut.callsFake(
      async (
        amountOuts: CurrencyAmount[],
        routes: V3Route[],
        _providerConfig?: ProviderConfig
      ) => {
        const routesWithQuotes = _.map(routes, (r) => {
          const amountQuotes = _.map(amountOuts, (amountOut) => {
            return {
              amount: amountOut,
              quote: BigNumber.from(amountOut.quotient.toString()),
              sqrtPriceX96AfterList: [
                BigNumber.from(1),
                BigNumber.from(1),
                BigNumber.from(1),
              ],
              initializedTicksCrossedList: [1],
              gasEstimate: BigNumber.from(10000),
            } as AmountQuote;
          });
          return [r, amountQuotes];
        });

        return {
          routesWithQuotes: routesWithQuotes,
          blockNumber: mockBlockBN,
        } as {
          routesWithQuotes: RouteWithQuotes<V3Route>[];
          blockNumber: BigNumber;
        };
      }
    );

    mockV2QuoteProvider = sinon.createStubInstance(V2QuoteProvider);
    mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
      async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
        const routesWithQuotes = _.map(routes, (r) => {
          const amountQuotes = _.map(amountIns, (amountIn) => {
            return {
              amount: amountIn,
              quote: BigNumber.from(amountIn.quotient.toString()),
            } as V2AmountQuote;
          });
          return [r, amountQuotes];
        });

        return {
          routesWithQuotes: routesWithQuotes,
        } as { routesWithQuotes: V2RouteWithQuotes[] };
      }
    );

    mockV2QuoteProvider.getQuotesManyExactOut.callsFake(
      async (amountOuts: CurrencyAmount[], routes: V2Route[]) => {
        const routesWithQuotes = _.map(routes, (r) => {
          const amountQuotes = _.map(amountOuts, (amountOut) => {
            return {
              amount: amountOut,
              quote: BigNumber.from(amountOut.quotient.toString()),
            } as V2AmountQuote;
          });
          return [r, amountQuotes];
        });

        return {
          routesWithQuotes: routesWithQuotes,
        } as { routesWithQuotes: V2RouteWithQuotes[] };
      }
    );

    mockGasPriceProvider = sinon.createStubInstance(ETHGasStationInfoProvider);
    mockGasPriceProvider.getGasPrice.resolves({
      gasPriceWei: mockGasPriceWeiBN,
    });

    mockV3GasModelFactory = sinon.createStubInstance(
      V3HeuristicGasModelFactory
    );
    const v3MockGasModel = {
      estimateGasCost: sinon.stub(),
    };
    v3MockGasModel.estimateGasCost.callsFake((r: V3RouteWithValidQuote) => {
      return {
        gasEstimate: BigNumber.from(10000),
        gasCostInToken: CurrencyAmount.fromRawAmount(
          r.quoteToken,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
        gasCostInUSD: CurrencyAmount.fromRawAmount(
          USDC,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
      };
    });
    mockV3GasModelFactory.buildGasModel.resolves(v3MockGasModel);

    mockMixedRouteGasModelFactory = sinon.createStubInstance(
      MixedRouteHeuristicGasModelFactory
    );
    const mixedRouteMockGasModel = {
      estimateGasCost: sinon.stub(),
    };
    mixedRouteMockGasModel.estimateGasCost.callsFake(
      (r: MixedRouteWithValidQuote) => {
        return {
          gasEstimate: BigNumber.from(10000),
          gasCostInToken: CurrencyAmount.fromRawAmount(
            r.quoteToken,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
          gasCostInUSD: CurrencyAmount.fromRawAmount(
            USDC,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
        };
      }
    );
    mockMixedRouteGasModelFactory.buildGasModel.resolves(
      mixedRouteMockGasModel
    );

    mockV2GasModelFactory = sinon.createStubInstance(
      V2HeuristicGasModelFactory
    );
    const v2MockGasModel = {
      estimateGasCost: sinon.stub(),
    };
    v2MockGasModel.estimateGasCost.callsFake((r: V2RouteWithValidQuote) => {
      return {
        gasEstimate: BigNumber.from(10000),
        gasCostInToken: CurrencyAmount.fromRawAmount(
          r.quoteToken,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
        gasCostInUSD: CurrencyAmount.fromRawAmount(
          USDC,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
      };
    });
    mockV2GasModelFactory.buildGasModel.resolves(v2MockGasModel);

    mockBlockTokenListProvider = sinon.createStubInstance(
      CachingTokenListProvider
    );
    const mockSwapRouterProvider = sinon.createStubInstance(SwapRouterProvider);
    mockSwapRouterProvider.getApprovalType.resolves({
      approvalTokenIn: 1,
      approvalTokenOut: 1,
    });

    mockTokenValidatorProvider = sinon.createStubInstance(
      TokenValidatorProvider
    );
    mockTokenValidatorProvider.validateTokens.resolves({
      getValidationByToken: () => TokenValidationResult.UNKN,
    });

    mockFallbackTenderlySimulator = sinon.createStubInstance(FallbackTenderlySimulator)
    mockFallbackTenderlySimulator.simulateTransaction.callsFake(async (_fromAddress, route)=>route)

    alphaRouter = new AlphaRouter({
      chainId: 1,
      provider: mockProvider,
      multicall2Provider: mockMulticallProvider as any,
      v3SubgraphProvider: mockV3SubgraphProvider,
      v3PoolProvider: mockV3PoolProvider,
      onChainQuoteProvider: mockOnChainQuoteProvider,
      tokenProvider: mockTokenProvider,
      gasPriceProvider: mockGasPriceProvider,
      v3GasModelFactory: mockV3GasModelFactory,
      blockedTokenListProvider: mockBlockTokenListProvider,
      v2GasModelFactory: mockV2GasModelFactory,
      v2PoolProvider: mockV2PoolProvider,
      v2QuoteProvider: mockV2QuoteProvider,
      mixedRouteGasModelFactory: mockMixedRouteGasModelFactory,
      v2SubgraphProvider: mockV2SubgraphProvider,
      swapRouterProvider: mockSwapRouterProvider,
      tokenValidatorProvider: mockTokenValidatorProvider,
      simulator: mockFallbackTenderlySimulator
    });
  });

  describe('exact in', () => {
    test('succeeds to route across all protocols when no protocols specified', async () => {
      // Mock the quote providers so that for each protocol, one route and one
      // amount less than 100% of the input gives a huge quote.
      // Ensures a split route.
      mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
        async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
              } as V2AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
          } as { routesWithQuotes: V2RouteWithQuotes[] };
        }
      );

      mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
        async (
          amountIns: CurrencyAmount[],
          routes: (V3Route | V2Route | MixedRoute)[],
          _providerConfig?: ProviderConfig
        ) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
                sqrtPriceX96AfterList: [
                  BigNumber.from(1),
                  BigNumber.from(1),
                  BigNumber.from(1),
                ],
                initializedTicksCrossedList: [1],
                gasEstimate: BigNumber.from(10000),
              } as AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
            blockNumber: mockBlockBN,
          } as {
            routesWithQuotes: RouteWithQuotes<V3Route>[];
            blockNumber: BigNumber;
          };
        }
      );

      const amount = CurrencyAmount.fromRawAmount(USDC, 10000);

      const swap = await alphaRouter.route(
        amount,
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        { ...ROUTING_CONFIG }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();
      expect(
        mockMixedRouteGasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any, /// v3 pool provider
          v2poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockOnChainQuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array,
        sinon.match({ blockNumber: sinon.match.defined })
      );
      /// V3, then mixedRoutes
      sinon.assert.callCount(mockOnChainQuoteProvider.getQuotesManyExactIn, 2);
      sinon.assert.calledWith(
        mockV2QuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array
      );
      sinon.assert.notCalled(mockOnChainQuoteProvider.getQuotesManyExactOut);

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('20000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(2);

      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.V3)
      ).toHaveLength(1);
      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.V2)
      ).toHaveLength(1);

      expect(
        _(swap!.route)
          .map((r) => r.percent)
          .sum()
      ).toEqual(100);

      expect(sumFn(_.map(swap!.route, (r) => r.amount)).equalTo(amount));

      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.toString()).toEqual(mockBlockBN.toString());
    });

    test('find a favorable mixedRoute while routing across V2,V3,Mixed protocols', async () => {
      mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
        async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
              } as V2AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
          } as { routesWithQuotes: V2RouteWithQuotes[] };
        }
      );

      mockOnChainQuoteProvider.getQuotesManyExactIn
        .onFirstCall()
        .callsFake(
          async (
            amountIns: CurrencyAmount[],
            routes: (V3Route | V2Route | MixedRoute)[],
            _providerConfig?: ProviderConfig
          ) => {
            const routesWithQuotes = _.map(routes, (r, routeIdx) => {
              const amountQuotes = _.map(amountIns, (amountIn, idx) => {
                const quote =
                  idx == 1 && routeIdx == 1
                    ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                    : BigNumber.from(amountIn.quotient.toString());
                return {
                  amount: amountIn,
                  quote,
                  sqrtPriceX96AfterList: [
                    BigNumber.from(1),
                    BigNumber.from(1),
                    BigNumber.from(1),
                  ],
                  initializedTicksCrossedList: [1],
                  gasEstimate: BigNumber.from(10000),
                } as AmountQuote;
              });
              return [r, amountQuotes];
            });

            return {
              routesWithQuotes: routesWithQuotes,
              blockNumber: mockBlockBN,
            } as {
              routesWithQuotes: RouteWithQuotes<V3Route>[];
              blockNumber: BigNumber;
            };
          }
        )
        /// @dev hacky way to mock the call to getMixedQuotes, since it is called after the V3 quotes
        /// we can use onSecondCall() to make it slightly more favorable, giving us a split between v3 + mixed
        .onSecondCall()
        .callsFake(
          async (
            amountIns: CurrencyAmount[],
            routes: (V3Route | V2Route | MixedRoute)[],
            _providerConfig?: ProviderConfig
          ) => {
            const routesWithQuotes = _.map(routes, (r, routeIdx) => {
              const amountQuotes = _.map(amountIns, (amountIn, idx) => {
                const quote =
                  idx == 1 && routeIdx == 1
                    ? BigNumber.from(amountIn.quotient.toString()).mul(11)
                    : BigNumber.from(amountIn.quotient.toString()).mul(1);
                return {
                  amount: amountIn,
                  quote,
                  sqrtPriceX96AfterList: [
                    BigNumber.from(1),
                    BigNumber.from(1),
                    BigNumber.from(1),
                  ],
                  initializedTicksCrossedList: [1],
                  gasEstimate: BigNumber.from(10000),
                } as AmountQuote;
              });
              return [r, amountQuotes];
            });

            return {
              routesWithQuotes: routesWithQuotes,
              blockNumber: mockBlockBN,
            } as {
              routesWithQuotes: RouteWithQuotes<V3Route>[];
              blockNumber: BigNumber;
            };
          }
        );

      const amount = CurrencyAmount.fromRawAmount(USDC, 10000);

      const swap = await alphaRouter.route(
        amount,
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
          minSplits: 3, // ensure we get all 3 protocols
          protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
        }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();
      expect(
        mockMixedRouteGasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any, /// v3 pool provider
          v2poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockV2QuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array
      );

      sinon.assert.calledWith(
        mockOnChainQuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array,
        sinon.match({ blockNumber: sinon.match.defined })
      );
      /// Called getV3Quotes, getMixedQuotes
      sinon.assert.callCount(mockOnChainQuoteProvider.getQuotesManyExactIn, 2);

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('30000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(3);

      /// @dev so it's hard to actually force all 3 protocols since there's no concept of liquidity in these mocks
      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.V3)
      ).toHaveLength(2);
      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.MIXED)
      ).toHaveLength(1);

      expect(
        _(swap!.route)
          .map((r) => r.percent)
          .sum()
      ).toEqual(100);

      expect(sumFn(_.map(swap!.route, (r) => r.amount)).equalTo(amount));

      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.toString()).toEqual(mockBlockBN.toString());
    });

    test('succeeds to route across V2,V3 when V2,V3 are specified', async () => {
      // Mock the quote providers so that for each protocol, one route and one
      // amount less than 100% of the input gives a huge quote.
      // Ensures a split route.
      mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
        async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
              } as V2AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
          } as { routesWithQuotes: V2RouteWithQuotes[] };
        }
      );

      mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
        async (
          amountIns: CurrencyAmount[],
          routes: (V3Route | V2Route | MixedRoute)[],
          _providerConfig?: ProviderConfig
        ) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
                sqrtPriceX96AfterList: [
                  BigNumber.from(1),
                  BigNumber.from(1),
                  BigNumber.from(1),
                ],
                initializedTicksCrossedList: [1],
                gasEstimate: BigNumber.from(10000),
              } as AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
            blockNumber: mockBlockBN,
          } as {
            routesWithQuotes: RouteWithQuotes<V3Route>[];
            blockNumber: BigNumber;
          };
        }
      );

      const amount = CurrencyAmount.fromRawAmount(USDC, 10000);

      const swap = await alphaRouter.route(
        amount,
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
          protocols: [Protocol.V2, Protocol.V3],
        }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockOnChainQuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array,
        sinon.match({ blockNumber: sinon.match.defined })
      );
      /// Should not be calling onChainQuoteProvider for mixedRoutes
      sinon.assert.callCount(mockOnChainQuoteProvider.getQuotesManyExactIn, 1);
      sinon.assert.calledWith(
        mockV2QuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array
      );

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('20000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(2);

      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.V3)
      ).toHaveLength(1);
      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.V2)
      ).toHaveLength(1);

      expect(
        _(swap!.route)
          .map((r) => r.percent)
          .sum()
      ).toEqual(100);

      expect(sumFn(_.map(swap!.route, (r) => r.amount)).equalTo(amount));

      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.toString()).toEqual(mockBlockBN.toString());
    });

    test('succeeds to route to and from token with 0 decimals', async () => {
      const swapFrom = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        MOCK_ZERO_DEC_TOKEN,
        TradeType.EXACT_INPUT,
        undefined,
        { ...ROUTING_CONFIG }
      );
      expect(swapFrom).toBeDefined();

      const swapTo = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(MOCK_ZERO_DEC_TOKEN, 10000),
        USDC,
        TradeType.EXACT_INPUT,
        undefined,
        { ...ROUTING_CONFIG }
      );
      expect(swapTo).toBeDefined();
    });

    test('succeeds to route on v3 only', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        { ...ROUTING_CONFIG, protocols: [Protocol.V3] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockOnChainQuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array,
        sinon.match({ blockNumber: sinon.match.defined })
      );
      /// Should not be calling onChainQuoteProvider for mixedRoutes
      sinon.assert.callCount(mockOnChainQuoteProvider.getQuotesManyExactIn, 1);

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.toString()).toEqual(mockBlockBN.toString());
    });

    test('succeeds to route on v2 only', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        { ...ROUTING_CONFIG, protocols: [Protocol.V2] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockV2QuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array
      );

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.toString()).toEqual(mockBlockBN.toString());
    });

    test('succeeds to route on mixed only', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        { ...ROUTING_CONFIG, protocols: [Protocol.MIXED] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockMixedRouteGasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          v2poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockOnChainQuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array,
        sinon.match({ blockNumber: sinon.match.defined })
      );
      /// Should not be calling onChainQuoteProvider for v3Routes
      sinon.assert.callCount(mockOnChainQuoteProvider.getQuotesManyExactIn, 1);
      sinon.assert.notCalled(mockOnChainQuoteProvider.getQuotesManyExactOut);

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.protocol).toEqual(Protocol.MIXED);
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.toString()).toEqual(mockBlockBN.toString());
    });

    test('finds a route with no protocols specified and forceMixedRoutes is true', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
          forceMixedRoutes: true,
        }
      );
      expect(swap).toBeDefined();
      expect(
        swap!.route.every((route) => route.protocol === Protocol.MIXED)
      ).toBeTruthy();
    });

    test('finds a route with V2,V3,Mixed protocols specified and forceMixedRoutes is true', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
          protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
          forceMixedRoutes: true,
        }
      );
      expect(swap).toBeDefined();
      expect(
        swap!.route.every((route) => route.protocol === Protocol.MIXED)
      ).toBeTruthy();
    });

    test('finds no route with v2,v3 protocols specified and forceMixedRoutes is true', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
          protocols: [Protocol.V2, Protocol.V3],
          forceMixedRoutes: true,
        }
      );
      expect(swap).toBeNull();
    });

    test('finds no route with v2 protocol specified and forceMixedRoutes is true', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
          protocols: [Protocol.V2],
          forceMixedRoutes: true,
        }
      );
      expect(swap).toBeNull();
    });

    test('finds no route with v3 protocol specified and forceMixedRoutes is true', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
          protocols: [Protocol.V2],
          forceMixedRoutes: true,
        }
      );
      expect(swap).toBeNull();
    });

    test('finds a non mixed that is favorable with no protocols specified', async () => {
      mockOnChainQuoteProvider.getQuotesManyExactIn
        .onFirstCall()
        .callsFake(
          async (
            amountIns: CurrencyAmount[],
            routes: (V3Route | V2Route | MixedRoute)[],
            _providerConfig?: ProviderConfig
          ) => {
            const routesWithQuotes = _.map(routes, (r, routeIdx) => {
              const amountQuotes = _.map(amountIns, (amountIn, idx) => {
                const quote =
                  idx == 1 && routeIdx == 1
                    ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                    : BigNumber.from(amountIn.quotient.toString());
                return {
                  amount: amountIn,
                  quote,
                  sqrtPriceX96AfterList: [
                    BigNumber.from(1),
                    BigNumber.from(1),
                    BigNumber.from(1),
                  ],
                  initializedTicksCrossedList: [1],
                  gasEstimate: BigNumber.from(10000),
                } as AmountQuote;
              });
              return [r, amountQuotes];
            });

            return {
              routesWithQuotes: routesWithQuotes,
              blockNumber: mockBlockBN,
            } as {
              routesWithQuotes: RouteWithQuotes<V3Route>[];
              blockNumber: BigNumber;
            };
          }
        )
        /// call to onChainQuoter for mixedRoutes
        .onSecondCall()
        .callsFake(
          async (
            amountIns: CurrencyAmount[],
            routes: (V3Route | V2Route | MixedRoute)[],
            _providerConfig?: ProviderConfig
          ) => {
            const routesWithQuotes = _.map(routes, (r, routeIdx) => {
              const amountQuotes = _.map(amountIns, (amountIn, idx) => {
                const quote =
                  idx == 1 && routeIdx == 1
                    ? BigNumber.from(amountIn.quotient.toString()).mul(9)
                    : BigNumber.from(amountIn.quotient.toString());
                return {
                  amount: amountIn,
                  quote,
                  sqrtPriceX96AfterList: [
                    BigNumber.from(1),
                    BigNumber.from(1),
                    BigNumber.from(1),
                  ],
                  initializedTicksCrossedList: [1],
                  gasEstimate: BigNumber.from(10000),
                } as AmountQuote;
              });
              return [r, amountQuotes];
            });

            return {
              routesWithQuotes: routesWithQuotes,
              blockNumber: mockBlockBN,
            } as {
              routesWithQuotes: RouteWithQuotes<V3Route>[];
              blockNumber: BigNumber;
            };
          }
        );

      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
        }
      );
      expect(swap).toBeDefined();

      expect(
        swap!.route.every((route) => route.protocol === Protocol.V3)
      ).toBeTruthy();
    });

    test('succeeds to route and generates calldata on v3 only', async () => {
      const swapParams = {
        deadline: Math.floor(Date.now() / 1000) + 1000000,
        recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        slippageTolerance: new Percent(500, 10_000),
      };

      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        swapParams,
        { ...ROUTING_CONFIG, protocols: [Protocol.V3] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockOnChainQuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array,
        sinon.match({ blockNumber: sinon.match.defined })
      );

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).toBeDefined();
      expect(swap!.blockNumber.eq(mockBlockBN)).toBeTruthy();
    });

    test('succeeds to route and generates calldata on v2 only', async () => {
      const swapParams = {
        deadline: Math.floor(Date.now() / 1000) + 1000000,
        recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        slippageTolerance: new Percent(500, 10_000),
      };

      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        swapParams,
        { ...ROUTING_CONFIG, protocols: [Protocol.V2] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockV2QuoteProvider.getQuotesManyExactIn,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array
      );

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).toBeDefined();
      expect(swap!.blockNumber.eq(mockBlockBN)).toBeTruthy();
    });

    test('succeeds to route and generates calldata on mixed only', async () => {
      const swapParams = {
        deadline: Math.floor(Date.now() / 1000) + 1000000,
        recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        slippageTolerance: new Percent(500, 10_000),
      };

      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(USDC, 10000),
        WRAPPED_NATIVE_CURRENCY[1],
        TradeType.EXACT_INPUT,
        swapParams,
        { ...ROUTING_CONFIG, protocols: [Protocol.MIXED] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockMixedRouteGasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          v2poolProvider: sinon.match.any,
          token: WRAPPED_NATIVE_CURRENCY[1],
        })
      ).toBeTruthy();

      expect(
        mockOnChainQuoteProvider.getQuotesManyExactOut.notCalled
      ).toBeTruthy();

      expect(
        swap!.quote.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();
      expect(
        swap!.quoteGasAdjusted.currency.equals(WRAPPED_NATIVE_CURRENCY[1])
      ).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.protocol).toEqual(Protocol.MIXED);
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.greaterThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(
          WRAPPED_NATIVE_CURRENCY[1]
        )
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).toBeDefined();
      expect(swap!.blockNumber.eq(mockBlockBN)).toBeTruthy();
    });
  });

  describe('exact out', () => {
    test('succeeds to route across all protocols', async () => {
      // Mock the quote providers so that for each protocol, one route and one
      // amount less than 100% of the input gives a huge quote.
      // Ensures a split route.
      mockV2QuoteProvider.getQuotesManyExactOut.callsFake(
        async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).div(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
              } as V2AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
          } as { routesWithQuotes: V2RouteWithQuotes[] };
        }
      );

      mockOnChainQuoteProvider.getQuotesManyExactOut.callsFake(
        async (
          amountIns: CurrencyAmount[],
          routes: V3Route[],
          _providerConfig?: ProviderConfig
        ) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).div(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
                sqrtPriceX96AfterList: [
                  BigNumber.from(1),
                  BigNumber.from(1),
                  BigNumber.from(1),
                ],
                initializedTicksCrossedList: [1],
                gasEstimate: BigNumber.from(10000),
              } as AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
            blockNumber: mockBlockBN,
          } as {
            routesWithQuotes: RouteWithQuotes<V3Route>[];
            blockNumber: BigNumber;
          };
        }
      );

      const amount = CurrencyAmount.fromRawAmount(USDC, 10000);

      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1], 10000),
        USDC,
        TradeType.EXACT_OUTPUT,
        undefined,
        { ...ROUTING_CONFIG }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: USDC,
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: USDC,
        })
      ).toBeTruthy();
      expect(
        mockMixedRouteGasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          v2poolProvider: sinon.match.any,
          token: USDC,
        })
      ).toBeTruthy();

      sinon.assert.calledWith(
        mockOnChainQuoteProvider.getQuotesManyExactOut,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array,
        sinon.match({ blockNumber: sinon.match.defined })
      );
      sinon.assert.calledWith(
        mockV2QuoteProvider.getQuotesManyExactOut,
        sinon.match((value) => {
          return value instanceof Array && value.length == 4;
        }),
        sinon.match.array
      );

      expect(swap!.quote.currency.equals(USDC)).toBeTruthy();
      expect(swap!.quoteGasAdjusted.currency.equals(USDC)).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.lessThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('20000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(USDC)
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(2);

      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.V3)
      ).toHaveLength(1);
      expect(
        _.filter(swap!.route, (r) => r.protocol == Protocol.V2)
      ).toHaveLength(1);

      expect(
        _(swap!.route)
          .map((r) => r.percent)
          .sum()
      ).toEqual(100);

      expect(sumFn(_.map(swap!.route, (r) => r.amount)).equalTo(amount));

      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.toString()).toEqual(mockBlockBN.toString());
    });

    test('succeeds to route on v3 only', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1], 10000),
        USDC,
        TradeType.EXACT_OUTPUT,
        undefined,
        { ...ROUTING_CONFIG, protocols: [Protocol.V3] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: USDC,
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();
      expect(
        mockOnChainQuoteProvider.getQuotesManyExactOut.calledWith(
          sinon.match((value) => {
            return value instanceof Array && value.length == 4;
          }),
          sinon.match.array,
          sinon.match({ blockNumber: sinon.match.defined })
        )
      ).toBeTruthy();

      expect(swap!.quote.currency.equals(USDC)).toBeTruthy();
      expect(swap!.quoteGasAdjusted.currency.equals(USDC)).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.lessThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(USDC!)
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.eq(mockBlockBN)).toBeTruthy();
    });

    test('succeeds to route on v2 only', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1], 10000),
        USDC,
        TradeType.EXACT_OUTPUT,
        undefined,
        { ...ROUTING_CONFIG, protocols: [Protocol.V2] }
      );
      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: USDC,
        })
      ).toBeTruthy();
      expect(
        mockV2QuoteProvider.getQuotesManyExactOut.calledWith(
          sinon.match((value) => {
            return value instanceof Array && value.length == 4;
          }),
          sinon.match.array
        )
      ).toBeTruthy();

      expect(swap!.quote.currency.equals(USDC)).toBeTruthy();
      expect(swap!.quoteGasAdjusted.currency.equals(USDC)).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.lessThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(USDC!)
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).not.toBeDefined();
      expect(swap!.blockNumber.eq(mockBlockBN)).toBeTruthy();
    });

    test('is null with mixed only', async () => {
      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1], 10000),
        USDC,
        TradeType.EXACT_OUTPUT,
        undefined,
        { ...ROUTING_CONFIG, protocols: [Protocol.MIXED] }
      );
      expect(swap).toBeNull();

      sinon.assert.notCalled(mockOnChainQuoteProvider.getQuotesManyExactOut);
    });

    test('succeeds to route and generates calldata on v3 only and simulates', async () => {
      const swapParams = {
        deadline: Math.floor(Date.now() / 1000) + 1000000,
        recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        slippageTolerance: new Percent(500, 10_000),
        simulate: {fromAddress: '0x63946551716781C32f0269F87DC08521818b6292'}
      };

      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1], 10000),
        USDC,
        TradeType.EXACT_OUTPUT,
        swapParams,
        { ...ROUTING_CONFIG, protocols: [Protocol.V3] },
      );

      expect(swap).toBeDefined();
      expect(mockFallbackTenderlySimulator.simulateTransaction.called).toBeTruthy()

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          v3poolProvider: sinon.match.any,
          token: USDC,
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: undefined,
        })
      ).toBeTruthy();
      expect(
        mockOnChainQuoteProvider.getQuotesManyExactOut.calledWith(
          sinon.match((value) => {
            return value instanceof Array && value.length == 4;
          }),
          sinon.match.array,
          sinon.match({ blockNumber: sinon.match.defined })
        )
      ).toBeTruthy();

      expect(swap!.quote.currency.equals(USDC)).toBeTruthy();
      expect(swap!.quoteGasAdjusted.currency.equals(USDC)).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.lessThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(USDC!)
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).toBeDefined();
      expect(swap!.blockNumber.eq(mockBlockBN)).toBeTruthy();
    });

    test('succeeds to route and generates calldata on v2 only', async () => {
      const swapParams = {
        deadline: Math.floor(Date.now() / 1000) + 1000000,
        recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        slippageTolerance: new Percent(500, 10_000),
      };

      const swap = await alphaRouter.route(
        CurrencyAmount.fromRawAmount(WRAPPED_NATIVE_CURRENCY[1], 10000),
        USDC,
        TradeType.EXACT_OUTPUT,
        swapParams,
        { ...ROUTING_CONFIG, protocols: [Protocol.V2] }
      );

      expect(swap).toBeDefined();

      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId: 1,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: USDC,
        })
      ).toBeTruthy();
      expect(
        mockV2QuoteProvider.getQuotesManyExactOut.calledWith(
          sinon.match((value) => {
            return value instanceof Array && value.length == 4;
          }),
          sinon.match.array
        )
      ).toBeTruthy();

      expect(swap!.quote.currency.equals(USDC)).toBeTruthy();
      expect(swap!.quoteGasAdjusted.currency.equals(USDC)).toBeTruthy();

      for (const r of swap!.route) {
        expect(r.route.input.equals(USDC)).toBeTruthy();
        expect(
          r.route.output.equals(WRAPPED_NATIVE_CURRENCY[1].wrapped)
        ).toBeTruthy();
      }

      expect(swap!.quote.lessThan(swap!.quoteGasAdjusted)).toBeTruthy();
      expect(swap!.estimatedGasUsed.toString()).toEqual('10000');
      expect(
        swap!.estimatedGasUsedQuoteToken.currency.equals(USDC!)
      ).toBeTruthy();
      expect(
        swap!.estimatedGasUsedUSD.currency.equals(USDC) ||
          swap!.estimatedGasUsedUSD.currency.equals(USDT) ||
          swap!.estimatedGasUsedUSD.currency.equals(DAI)
      ).toBeTruthy();
      expect(swap!.gasPriceWei.toString()).toEqual(
        mockGasPriceWeiBN.toString()
      );
      expect(swap!.route).toHaveLength(1);
      expect(swap!.trade).toBeDefined();
      expect(swap!.methodParameters).toBeDefined();
      expect(swap!.blockNumber.eq(mockBlockBN)).toBeTruthy();
    });
  });

  describe('to ratio', () => {
    describe('simple 1 swap scenario', () => {
      describe('when token0Balance has excess tokens', () => {
        test('with in range position calls routeExactIn with correct parameters', async () => {
          const token0Balance = parseAmount('20', USDC);
          const token1Balance = parseAmount('5', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickUpper: 120,
            tickLower: -120,
            liquidity: 1,
          });

          const spy = sinon.spy(alphaRouter, 'route');

          const route = await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          if (route.status === SwapToRatioStatus.SUCCESS) {
            expect(route.result.optimalRatio).toBeDefined();
            expect(route.result.postSwapTargetPool).toBeDefined();

            const exactAmountInBalance = parseAmount('7.5', USDC);

            const exactInputParameters = spy.firstCall.args;
            expect(exactInputParameters[0]).toEqual(exactAmountInBalance);
            expect(exactInputParameters[1]).toEqual(token1Balance.currency);
          } else {
            throw 'routeToRatio unsuccessful';
          }
        });

        test('with out of range position calls routeExactIn with correct parameters', async () => {
          const token0Balance = parseAmount('20', USDC);
          const token1Balance = parseAmount('0', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickLower: -120,
            tickUpper: -60,
            liquidity: 1,
          });

          const spy = sinon.spy(alphaRouter, 'route');

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          const exactAmountInBalance = parseAmount('20', USDC);

          const exactInputParameters = spy.firstCall.args;
          expect(exactInputParameters[0]).toEqual(exactAmountInBalance);
          expect(exactInputParameters[1]).toEqual(token1Balance.currency);
        });
      });

      describe('when token1Balance has excess tokens', () => {
        test('with in range position calls routeExactIn with correct parameters', async () => {
          const token0Balance = parseAmount('5', USDC);
          const token1Balance = parseAmount('20', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickUpper: 120,
            tickLower: -120,
            liquidity: 1,
          });

          const spy = sinon.spy(alphaRouter, 'route');

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          const exactAmountInBalance = parseAmount('7.5', USDT);

          const exactInputParameters = spy.firstCall.args;
          expect(exactInputParameters[0]).toEqual(exactAmountInBalance);
          expect(exactInputParameters[1]).toEqual(token0Balance.currency);
        });

        test('with out of range position calls routeExactIn with correct parameters', async () => {
          const token0Balance = parseAmount('5', USDC);
          const token1Balance = parseAmount('20', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickUpper: 120,
            tickLower: 60,
            liquidity: 1,
          });

          const spy = sinon.spy(alphaRouter, 'route');

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          const exactAmountInBalance = parseAmount('20', USDT);

          const exactInputParameters = spy.firstCall.args;
          expect(exactInputParameters[0]).toEqual(exactAmountInBalance);
          expect(exactInputParameters[1]).toEqual(token0Balance.currency);
        });
      });

      describe('when token0 has more decimal places than token1', () => {
        test('calls routeExactIn with correct parameters', async () => {
          const token0Balance = parseAmount('20', DAI);
          const token1Balance = parseAmount('5' + '0'.repeat(12), USDT);

          const position = new Position({
            pool: DAI_USDT_MEDIUM,
            tickUpper: 120,
            tickLower: -120,
            liquidity: 1,
          });

          const spy = sinon.spy(alphaRouter, 'route');

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          const exactAmountInBalance = parseAmount('7.5', DAI);

          const exactInputParameters = spy.firstCall.args;
          expect(exactInputParameters[0]).toEqual(exactAmountInBalance);
          expect(exactInputParameters[1]).toEqual(token1Balance.currency);
        });
      });

      describe('when token1 has more decimal places than token0', () => {
        test('calls routeExactIn with correct parameters', async () => {
          const token0Balance = parseAmount('20' + '0'.repeat(12), USDC);
          const token1Balance = parseAmount('5', WRAPPED_NATIVE_CURRENCY[1]);

          const position = new Position({
            pool: USDC_WETH_LOW,
            tickUpper: 120,
            tickLower: -120,
            liquidity: 1,
          });

          const spy = sinon.spy(alphaRouter, 'route');

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          const exactAmountInBalance = parseAmount('7500000000000', USDC);

          const exactInputParameters = spy.firstCall.args;
          expect(exactInputParameters[0].currency).toEqual(
            token0Balance.currency
          );
          expect(exactInputParameters[1]).toEqual(token1Balance.currency);
          expect(exactInputParameters[0]).toEqual(exactAmountInBalance);
        });
      });

      test('returns null for range order already fulfilled with token0', async () => {
        const token0Balance = parseAmount('50', USDC);
        const token1Balance = parseAmount('0', USDT);

        const position = new Position({
          pool: USDC_USDT_MEDIUM,
          tickLower: 60,
          tickUpper: 120,
          liquidity: 1,
        });

        const spy = sinon.spy(alphaRouter, 'route');

        const result = await alphaRouter.routeToRatio(
          token0Balance,
          token1Balance,
          position,
          SWAP_AND_ADD_CONFIG,
          undefined,
          ROUTING_CONFIG
        );

        expect(spy.firstCall).toEqual(null);
        expect(result.status).toEqual(SwapToRatioStatus.NO_SWAP_NEEDED);
      });

      test('returns null for range order already fulfilled with token1', async () => {
        const token0Balance = parseAmount('0', USDC);
        const token1Balance = parseAmount('50', USDT);

        const position = new Position({
          pool: USDC_USDT_MEDIUM,
          tickLower: -120,
          tickUpper: -60,
          liquidity: 1,
        });

        const spy = sinon.spy(alphaRouter, 'route');

        const result = await alphaRouter.routeToRatio(
          token0Balance,
          token1Balance,
          position,
          SWAP_AND_ADD_CONFIG,
          undefined,
          ROUTING_CONFIG
        );

        expect(spy.firstCall).toEqual(null);
        expect(result.status).toEqual(SwapToRatioStatus.NO_SWAP_NEEDED);
      });
    });

    describe('iterative scenario', () => {
      let spy: sinon.SinonSpy<any[], any>;

      beforeEach(() => {
        spy = sinon.spy(helper, 'calculateRatioAmountIn');
      });

      afterEach(() => {
        spy.restore();
      });

      test('it returns null when maxIterations has been exceeded', async () => {
        // prompt bad quotes from V2
        mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
          async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
            const routesWithQuotes = _.map(routes, (r) => {
              const amountQuotes = _.map(amountIns, (amountIn) => {
                const quote = BigNumber.from(1).div(BigNumber.from(10));
                return {
                  amount: amountIn,
                  quote,
                } as V2AmountQuote;
              });
              return [r, amountQuotes];
            });

            return {
              routesWithQuotes: routesWithQuotes,
            } as { routesWithQuotes: V2RouteWithQuotes[] };
          }
        );
        // prompt many loops
        mockOnChainQuoteProvider.getQuotesManyExactIn.onCall(0).callsFake(
          getQuotesManyExactInFn({
            quoteMultiplier: new Fraction(1, 2),
          })
        );
        mockOnChainQuoteProvider.getQuotesManyExactIn.onCall(2).callsFake(
          getQuotesManyExactInFn({
            quoteMultiplier: new Fraction(1, 2),
          })
        );
        mockOnChainQuoteProvider.getQuotesManyExactIn.onCall(4).callsFake(
          getQuotesManyExactInFn({
            quoteMultiplier: new Fraction(1, 2),
          })
        );

        const token0Balance = parseAmount('20', USDC);
        const token1Balance = parseAmount('5', USDT);

        const position = new Position({
          pool: USDC_USDT_MEDIUM,
          tickUpper: 120,
          tickLower: -120,
          liquidity: 1,
        });

        const swap = await alphaRouter.routeToRatio(
          token0Balance,
          token1Balance,
          position,
          SWAP_AND_ADD_CONFIG,
          undefined,
          ROUTING_CONFIG
        );

        if (swap.status === SwapToRatioStatus.NO_ROUTE_FOUND) {
          expect(swap.status).toEqual(SwapToRatioStatus.NO_ROUTE_FOUND);
          expect(swap.error).toEqual('max iterations exceeded');
        } else {
          throw 'routeToRatio: unexpected response';
        }
      });

      describe('when there is excess of token0', () => {
        test('when amountOut is less than expected it calls again with new exchangeRate', async () => {
          // prompt bad quotes from V2
          mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
            async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
              const routesWithQuotes = _.map(routes, (r) => {
                const amountQuotes = _.map(amountIns, (amountIn) => {
                  const quote = BigNumber.from(1).div(BigNumber.from(10));
                  return {
                    amount: amountIn,
                    quote,
                  } as V2AmountQuote;
                });
                return [r, amountQuotes];
              });

              return {
                routesWithQuotes: routesWithQuotes,
              } as { routesWithQuotes: V2RouteWithQuotes[] };
            }
          );
          mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
            getQuotesManyExactInFn({
              quoteMultiplier: new Fraction(1, 2),
            })
          );
          const token0Balance = parseAmount('20', USDC);
          const token1Balance = parseAmount('5', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickUpper: 120,
            tickLower: -120,
            liquidity: 1,
          });

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          expect(spy.calledTwice).toEqual(true);

          const [
            optimalRatioFirst,
            exchangeRateFirst,
            inputBalanceFirst,
            outputBalanceFirst,
          ] = spy.firstCall.args;
          expect(exchangeRateFirst.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(optimalRatioFirst.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceFirst).toEqual(token0Balance);
          expect(outputBalanceFirst).toEqual(token1Balance);

          const [
            optimalRatioSecond,
            exchangeRateSecond,
            inputBalanceSecond,
            outputBalanceSecond,
          ] = spy.secondCall.args;
          expect(exchangeRateSecond.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 2).toFixed(6)
          );
          // all other args remain equal
          expect(optimalRatioSecond.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceSecond).toEqual(token0Balance);
          expect(outputBalanceSecond).toEqual(token1Balance);
        });

        test('when trade moves sqrtPrice in target pool within range it calls again with new optimalRatio', async () => {
          const sqrtTwoX96 = BigNumber.from(
            encodeSqrtRatioX96(2, 1).toString()
          );
          mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
            getQuotesManyExactInFn({
              sqrtPriceX96AfterList: [sqrtTwoX96, sqrtTwoX96, sqrtTwoX96],
            })
          );

          const token0Balance = parseAmount('20', USDC);
          const token1Balance = parseAmount('5', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickLower: -10020,
            tickUpper: 10020,
            liquidity: 1,
          });

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          expect(spy.calledTwice).toEqual(true);

          const [
            optimalRatioFirst,
            exchangeRateFirst,
            inputBalanceFirst,
            outputBalanceFirst,
          ] = spy.firstCall.args;
          expect(optimalRatioFirst.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(exchangeRateFirst.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceFirst).toEqual(token0Balance);
          expect(outputBalanceFirst).toEqual(token1Balance);

          const [
            optimalRatioSecond,
            exchangeRateSecond,
            inputBalanceSecond,
            outputBalanceSecond,
          ] = spy.secondCall.args;
          expect(optimalRatioSecond.toFixed(2)).toEqual(
            new Fraction(1, 8).toFixed(2)
          );
          // all other params remain the same
          expect(exchangeRateSecond.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceSecond).toEqual(token0Balance);
          expect(outputBalanceSecond).toEqual(token1Balance);
        });

        test('when trade moves sqrtPrice in target pool out of range it calls again with new optimalRatio', async () => {
          const sqrtFourX96 = BigNumber.from(
            encodeSqrtRatioX96(4, 1).toString()
          );
          mockOnChainQuoteProvider.getQuotesManyExactIn.onCall(0).callsFake(
            getQuotesManyExactInFn({
              sqrtPriceX96AfterList: [sqrtFourX96, sqrtFourX96, sqrtFourX96],
            })
          );
          mockOnChainQuoteProvider.getQuotesManyExactIn.onCall(1).callsFake(
            getQuotesManyExactInFn({
              sqrtPriceX96AfterList: [sqrtFourX96, sqrtFourX96, sqrtFourX96],
            })
          );
          const token0Balance = parseAmount('20', USDC);
          const token1Balance = parseAmount('5', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickLower: -10020,
            tickUpper: 10020,
            liquidity: 1,
          });

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          expect(spy.calledTwice).toEqual(true);

          const [
            optimalRatioFirst,
            exchangeRateFirst,
            inputBalanceFirst,
            outputBalanceFirst,
          ] = spy.firstCall.args;
          expect(optimalRatioFirst.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(exchangeRateFirst.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceFirst).toEqual(token0Balance);
          expect(outputBalanceFirst).toEqual(token1Balance);

          const [
            optimalRatioSecond,
            exchangeRateSecond,
            inputBalanceSecond,
            outputBalanceSecond,
          ] = spy.secondCall.args;
          expect(optimalRatioSecond).toEqual(new Fraction(0, 1));
          // all other params remain the same
          expect(exchangeRateSecond.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceSecond).toEqual(token0Balance);
          expect(outputBalanceSecond).toEqual(token1Balance);
        });
      });

      describe('when there is excess of token1', () => {
        test('when amountOut is less than expected it calls again with new exchangeRate', async () => {
          // prompt bad quotes from V2
          mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
            async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
              const routesWithQuotes = _.map(routes, (r) => {
                const amountQuotes = _.map(amountIns, (amountIn) => {
                  const quote = BigNumber.from(1).div(BigNumber.from(10));
                  return {
                    amount: amountIn,
                    quote,
                  } as V2AmountQuote;
                });
                return [r, amountQuotes];
              });

              return {
                routesWithQuotes: routesWithQuotes,
              } as { routesWithQuotes: V2RouteWithQuotes[] };
            }
          );
          mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
            getQuotesManyExactInFn({
              quoteMultiplier: new Fraction(1, 2),
            })
          );
          const token0Balance = parseAmount('5', USDC);
          const token1Balance = parseAmount('20', USDT);

          const position = new Position({
            pool: USDC_USDT_MEDIUM,
            tickUpper: 120,
            tickLower: -120,
            liquidity: 1,
          });

          await alphaRouter.routeToRatio(
            token0Balance,
            token1Balance,
            position,
            SWAP_AND_ADD_CONFIG,
            undefined,
            ROUTING_CONFIG
          );

          expect(spy.calledTwice).toEqual(true);

          const [
            optimalRatioFirst,
            exchangeRateFirst,
            inputBalanceFirst,
            outputBalanceFirst,
          ] = spy.firstCall.args;
          expect(exchangeRateFirst.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(optimalRatioFirst.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceFirst).toEqual(token1Balance);
          expect(outputBalanceFirst).toEqual(token0Balance);

          const [
            optimalRatioSecond,
            exchangeRateSecond,
            inputBalanceSecond,
            outputBalanceSecond,
          ] = spy.secondCall.args;
          expect(exchangeRateSecond.asFraction.toFixed(6)).toEqual(
            new Fraction(1, 2).toFixed(6)
          );
          // all other args remain equal
          expect(optimalRatioSecond.toFixed(6)).toEqual(
            new Fraction(1, 1).toFixed(6)
          );
          expect(inputBalanceSecond).toEqual(token1Balance);
          expect(outputBalanceSecond).toEqual(token0Balance);
        });

        describe('when trade moves sqrtPrice in target pool', () => {
          test('when price is still within range it calls again with new optimalRatio', async () => {
            const oneHalfX96 = BigNumber.from(
              encodeSqrtRatioX96(1, 2).toString()
            );
            mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
              getQuotesManyExactInFn({
                sqrtPriceX96AfterList: [oneHalfX96, oneHalfX96, oneHalfX96],
              })
            );

            const token1Balance = parseAmount('20' + '0'.repeat(12), USDC);
            const token0Balance = parseAmount('5', DAI);

            const position = new Position({
              pool: USDC_DAI_LOW,
              tickLower: -100_000,
              tickUpper: 100_000,
              liquidity: 1,
            });

            await alphaRouter.routeToRatio(
              token0Balance,
              token1Balance,
              position,
              SWAP_AND_ADD_CONFIG,
              undefined,
              ROUTING_CONFIG
            );

            expect(spy.calledTwice).toEqual(true);

            const [
              optimalRatioFirst,
              exchangeRateFirst,
              inputBalanceFirst,
              outputBalanceFirst,
            ] = spy.firstCall.args;
            expect(optimalRatioFirst.toFixed(6)).toEqual(
              new Fraction(1, 1).toFixed(6)
            );
            expect(exchangeRateFirst.asFraction.toFixed(6)).toEqual(
              new Fraction(1, 1).toFixed(6)
            );
            expect(inputBalanceFirst).toEqual(token1Balance);
            expect(outputBalanceFirst).toEqual(token0Balance);

            const [
              optimalRatioSecond,
              exchangeRateSecond,
              inputBalanceSecond,
              outputBalanceSecond,
            ] = spy.secondCall.args;
            expect(optimalRatioSecond.toFixed(1)).toEqual(
              new Fraction(1, 2).toFixed(1)
            );
            // all other params remain the same
            expect(exchangeRateSecond.asFraction.toFixed(6)).toEqual(
              new Fraction(1, 1).toFixed(6)
            );
            expect(inputBalanceSecond).toEqual(token1Balance);
            expect(outputBalanceSecond).toEqual(token0Balance);
          });

          test('it returns the the target pool with the updated price and the updated optimalRatio', async () => {
            const oneHalfX96 = BigNumber.from(
              encodeSqrtRatioX96(1, 2).toString()
            );
            mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
              getQuotesManyExactInFn({
                sqrtPriceX96AfterList: [oneHalfX96, oneHalfX96, oneHalfX96],
              })
            );

            const token1Balance = parseAmount('20' + '0'.repeat(12), USDC);
            const token0Balance = parseAmount('5', DAI);

            const position = new Position({
              pool: USDC_DAI_LOW,
              tickLower: -100_000,
              tickUpper: 100_000,
              liquidity: 1,
            });

            const swap = await alphaRouter.routeToRatio(
              token0Balance,
              token1Balance,
              position,
              SWAP_AND_ADD_CONFIG,
              undefined,
              ROUTING_CONFIG
            );

            if (swap.status == SwapToRatioStatus.SUCCESS) {
              expect(swap.result.optimalRatio.toFixed(1)).toEqual(
                new Fraction(1, 2).toFixed(1)
              );
              expect(swap.result.postSwapTargetPool.sqrtRatioX96).toEqual(
                JSBI.BigInt(oneHalfX96.toString())
              );
            } else {
              throw 'swap was not successful';
            }
          });

          test('when trade moves sqrtPrice in target pool out of range it calls again with new optimalRatio of 0', async () => {
            const oneQuarterX96 = BigNumber.from(
              encodeSqrtRatioX96(1, 2).toString()
            );
            mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
              getQuotesManyExactInFn({
                sqrtPriceX96AfterList: [
                  oneQuarterX96,
                  oneQuarterX96,
                  oneQuarterX96,
                ],
              })
            );

            const token1Balance = parseAmount('20' + '0'.repeat(12), USDC);
            const token0Balance = parseAmount('5', DAI);

            const position = new Position({
              pool: USDC_DAI_LOW,
              tickLower: -120,
              tickUpper: 120,
              liquidity: 1,
            });

            await alphaRouter.routeToRatio(
              token0Balance,
              token1Balance,
              position,
              SWAP_AND_ADD_CONFIG,
              undefined,
              ROUTING_CONFIG
            );

            expect(spy.calledTwice).toEqual(true);

            const [
              optimalRatioFirst,
              exchangeRateFirst,
              inputBalanceFirst,
              outputBalanceFirst,
            ] = spy.firstCall.args;
            expect(optimalRatioFirst.toFixed(6)).toEqual(
              new Fraction(1, 1).toFixed(6)
            );
            expect(exchangeRateFirst.asFraction.toFixed(6)).toEqual(
              new Fraction(1, 1).toFixed(6)
            );
            expect(inputBalanceFirst).toEqual(token1Balance);
            expect(outputBalanceFirst).toEqual(token0Balance);

            const [
              optimalRatioSecond,
              exchangeRateSecond,
              inputBalanceSecond,
              outputBalanceSecond,
            ] = spy.secondCall.args;
            expect(optimalRatioSecond).toEqual(new Fraction(0, 1));
            // all other params remain the same
            expect(exchangeRateSecond.asFraction.toFixed(6)).toEqual(
              new Fraction(1, 1).toFixed(6)
            );
            expect(inputBalanceSecond).toEqual(token1Balance);
            expect(outputBalanceSecond).toEqual(token0Balance);
          });
        });
      });
    });

    describe('with methodParameters.swapAndAddCallParameters with the correct parameters', () => {
      let spy: sinon.SinonSpy<any[], any>;

      beforeEach(() => {
        spy = sinon.spy(SwapRouter, 'swapAndAddCallParameters');
      });

      afterEach(() => {
        spy.restore();
      });

      it('calls SwapRouter ', async () => {
        const token0Balance = parseAmount('15', USDC);
        const token1Balance = parseAmount('5', USDT);

        const positionPreLiquidity = new Position({
          pool: USDC_USDT_MEDIUM,
          tickUpper: 120,
          tickLower: -120,
          liquidity: 1,
        });

        const positionPostLiquidity = Position.fromAmounts({
          pool: positionPreLiquidity.pool,
          tickLower: positionPreLiquidity.tickLower,
          tickUpper: positionPreLiquidity.tickUpper,
          amount0: parseAmount('10', USDC).quotient.toString(),
          amount1: parseAmount('10', USDT).quotient.toString(),
          useFullPrecision: false,
        });

        const swap = await alphaRouter.routeToRatio(
          token0Balance,
          token1Balance,
          positionPreLiquidity,
          SWAP_AND_ADD_CONFIG,
          SWAP_AND_ADD_OPTIONS,
          ROUTING_CONFIG
        );

        if (swap.status == SwapToRatioStatus.SUCCESS) {
          const [
            trade,
            _,
            positionArg,
            addLiquidityOptions,
            approvalTypeIn,
            approvalTypeOut,
          ] = spy.firstCall.args;
          expect(swap.result.methodParameters).toBeTruthy();
          expect(trade).toEqual(swap.result.trade);
          expect(positionArg.pool).toEqual(positionPostLiquidity.pool);
          expect(positionArg.liquidity).toEqual(
            positionPostLiquidity.liquidity
          );
          expect(addLiquidityOptions).toEqual(
            SWAP_AND_ADD_OPTIONS.addLiquidityOptions
          );
          expect(approvalTypeIn).toEqual(1);
          expect(approvalTypeOut).toEqual(1);
        } else {
          throw 'swap was not successful';
        }
      });

      it('does not generate calldata if swap and add config is not provided', async () => {
        const token0Balance = parseAmount('15', USDC);
        const token1Balance = parseAmount('5', USDT);

        const positionPreLiquidity = new Position({
          pool: USDC_USDT_MEDIUM,
          tickUpper: 120,
          tickLower: -120,
          liquidity: 1,
        });

        const swap = await alphaRouter.routeToRatio(
          token0Balance,
          token1Balance,
          positionPreLiquidity,
          SWAP_AND_ADD_CONFIG,
          undefined,
          ROUTING_CONFIG
        );

        if (swap.status == SwapToRatioStatus.SUCCESS) {
          expect(swap.result.methodParameters).toBeFalsy();
        } else {
          throw 'swap was not successful';
        }
      });
    });
  });
});

type GetQuotesManyExactInFnParams = {
  quoteMultiplier?: Fraction;
  sqrtPriceX96AfterList?: BigNumber[];
};

function getQuotesManyExactInFn<TRoute extends V3Route | V2Route | MixedRoute>(
  options: GetQuotesManyExactInFnParams = {}
): (
  amountIns: CurrencyAmount[],
  routes: TRoute[],
  _providerConfig?: ProviderConfig | undefined
) => Promise<{
  routesWithQuotes: RouteWithQuotes<TRoute>[];
  blockNumber: BigNumber;
}> {
  return async (
    amountIns: CurrencyAmount[],
    routes: TRoute[],
    _providerConfig?: ProviderConfig
  ) => {
    const oneX96 = BigNumber.from(encodeSqrtRatioX96(1, 1).toString());
    const multiplier = options.quoteMultiplier || new Fraction(1, 1);
    const routesWithQuotes = _.map(routes, (r) => {
      const amountQuotes = _.map(amountIns, (amountIn) => {
        return {
          amount: amountIn,
          quote: BigNumber.from(
            amountIn.multiply(multiplier).quotient.toString()
          ),
          sqrtPriceX96AfterList: options.sqrtPriceX96AfterList || [
            oneX96,
            oneX96,
            oneX96,
          ],
          initializedTicksCrossedList: [1],
          gasEstimate: BigNumber.from(10000),
        } as AmountQuote;
      });
      return [r, amountQuotes];
    });

    return {
      routesWithQuotes: routesWithQuotes,
      blockNumber: mockBlockBN,
    } as {
      routesWithQuotes: RouteWithQuotes<TRoute>[];
      blockNumber: BigNumber;
    };
  };
}
