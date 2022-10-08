import { Percent, Price, sqrt, Token, CurrencyAmount, TradeType, WETH9, Ether, Currency } from '@uniswap/sdk-core'
import { Pair } from '@teleswap/v2-sdk'
import { encodeSqrtRatioX96, FeeAmount, nearestUsableTick, Pool, TickMath, TICK_SPACINGS } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { MixedRouteSDK } from './route'
import { MixedRouteTrade } from './trade'

describe('MixedRouteTrade', () => {
  const ETHER = Ether.onChain(1)
  const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const token2 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 't2', 'token2')
  const token3 = new Token(1, '0x0000000000000000000000000000000000000004', 18, 't3', 'token3')

  function v2StylePool(
    reserve0: CurrencyAmount<Token>,
    reserve1: CurrencyAmount<Token>,
    feeAmount: FeeAmount = FeeAmount.MEDIUM
  ) {
    const sqrtRatioX96 = encodeSqrtRatioX96(reserve1.quotient, reserve0.quotient)
    const liquidity = sqrt(JSBI.multiply(reserve0.quotient, reserve1.quotient))
    return new Pool(
      reserve0.currency,
      reserve1.currency,
      feeAmount,
      sqrtRatioX96,
      liquidity,
      TickMath.getTickAtSqrtRatio(sqrtRatioX96),
      [
        {
          index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
          liquidityNet: liquidity,
          liquidityGross: liquidity,
        },
        {
          index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
          liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt(-1)),
          liquidityGross: liquidity,
        },
      ]
    )
  }

  const pool_0_1 = v2StylePool(
    CurrencyAmount.fromRawAmount(token0, 100000),
    CurrencyAmount.fromRawAmount(token1, 100000)
  )
  const pool_0_2 = v2StylePool(
    CurrencyAmount.fromRawAmount(token0, 100000),
    CurrencyAmount.fromRawAmount(token2, 110000)
  )
  const pool_0_3 = v2StylePool(
    CurrencyAmount.fromRawAmount(token0, 100000),
    CurrencyAmount.fromRawAmount(token3, 90000)
  )
  const pool_1_2 = v2StylePool(
    CurrencyAmount.fromRawAmount(token1, 120000),
    CurrencyAmount.fromRawAmount(token2, 100000)
  )
  const pool_1_3 = v2StylePool(
    CurrencyAmount.fromRawAmount(token1, 120000),
    CurrencyAmount.fromRawAmount(token3, 130000)
  )

  const pool_weth_0 = v2StylePool(
    CurrencyAmount.fromRawAmount(WETH9[1], JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100000))
  )

  const pool_weth_1 = v2StylePool(
    CurrencyAmount.fromRawAmount(WETH9[1], JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100000))
  )

  const pool_weth_2 = v2StylePool(
    CurrencyAmount.fromRawAmount(WETH9[1], JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100000))
  )

  const pair_0_1 = new Pair(
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000)),
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000))
  )
  const pair_0_2 = new Pair(
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1100))
  )
  const pair_0_3 = new Pair(
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000)),
    CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(900))
  )
  const pair_1_2 = new Pair(
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1200)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1000))
  )
  const pair_1_3 = new Pair(
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1200)),
    CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(1300))
  )

  const pair_weth_0 = new Pair(
    CurrencyAmount.fromRawAmount(WETH9[1], JSBI.BigInt(1000)),
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))
  )

  const empty_pair_0_1 = new Pair(
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(0)),
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(0))
  )

  /// @dev copied over from v3-sdk trade.test.ts
  describe('is backwards compatible with pure v3 routes', () => {
    describe('#fromRoute', () => {
      it('can be constructed with ETHER as input', async () => {
        const trade = await MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_weth_0], ETHER, token0),
          CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(10000)),
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(ETHER)
        expect(trade.outputAmount.currency).toEqual(token0)
      })
      it('can be constructed with ETHER as output for exact input', async () => {
        const trade = await MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_weth_0], token0, ETHER),
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(token0)
        expect(trade.outputAmount.currency).toEqual(ETHER)
      })

      it('throws regardless for exact output', async () => {
        await expect(
          MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pool_weth_0], ETHER, token0),
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
            TradeType.EXACT_OUTPUT
          )
        ).rejects.toThrow('TRADE_TYPE')
      })
    })

    describe('#fromRoutes', () => {
      it('can be constructed with ETHER as input with multiple routes', async () => {
        const trade = await MixedRouteTrade.fromRoutes<Ether, Token, TradeType>(
          [
            {
              amount: CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(10000)),
              route: new MixedRouteSDK([pool_weth_0], ETHER, token0),
            },
          ],
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(ETHER)
        expect(trade.outputAmount.currency).toEqual(token0)
      })

      it('can be constructed with ETHER as output for exact input with multiple routes', async () => {
        const trade = await MixedRouteTrade.fromRoutes<Token, Ether, TradeType>(
          [
            {
              amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(3000)),
              route: new MixedRouteSDK([pool_weth_0], token0, ETHER),
            },
            {
              amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(7000)),
              route: new MixedRouteSDK([pool_0_1, pool_weth_1], token0, ETHER),
            },
          ],
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(token0)
        expect(trade.outputAmount.currency).toEqual(ETHER)
      })

      it('throws if pools are re-used between routes', async () => {
        await expect(
          MixedRouteTrade.fromRoutes<Token, Ether, TradeType.EXACT_INPUT>(
            [
              {
                amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(4500)),
                route: new MixedRouteSDK([pool_0_1, pool_weth_1], token0, ETHER),
              },
              {
                amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(5500)),
                route: new MixedRouteSDK([pool_0_1, pool_1_2, pool_weth_2], token0, ETHER),
              },
            ],
            TradeType.EXACT_INPUT
          )
        ).rejects.toThrow('POOLS_DUPLICATED')
      })

      it('throws if created with exact output', async () => {
        await expect(
          MixedRouteTrade.fromRoutes<Ether, Token, TradeType>(
            [
              {
                amount: CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(10000)),
                route: new MixedRouteSDK([pool_weth_0], ETHER, token0),
              },
            ],
            TradeType.EXACT_OUTPUT
          )
        ).rejects.toThrow('TRADE_TYPE')
      })
    })

    describe('#createUncheckedTrade', () => {
      it('throws if input currency does not match route', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTrade({
            route: new MixedRouteSDK([pool_0_1], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
            outputAmount: CurrencyAmount.fromRawAmount(token1, 10000),
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('INPUT_CURRENCY_MATCH')
      })
      it('throws if output currency does not match route', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTrade({
            route: new MixedRouteSDK([pool_0_1], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('OUTPUT_CURRENCY_MATCH')
      })
      it('throws if tradeType is exactOutput', () => {
        try {
          MixedRouteTrade.createUncheckedTrade({
            route: new MixedRouteSDK([pool_0_1], token1, token0),
            inputAmount: CurrencyAmount.fromRawAmount(token1, 10000),
            outputAmount: CurrencyAmount.fromRawAmount(token0, 100000),
            tradeType: TradeType.EXACT_OUTPUT,
          })
        } catch (err) {
          // @ts-ignore
          expect(err.message).toEqual('Invariant failed: TRADE_TYPE')
        }
      })
      it('can create an exact input trade without simulating', () => {
        MixedRouteTrade.createUncheckedTrade({
          route: new MixedRouteSDK([pool_0_1], token0, token1),
          inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
          outputAmount: CurrencyAmount.fromRawAmount(token1, 100000),
          tradeType: TradeType.EXACT_INPUT,
        })
      })
    })
    describe('#createUncheckedTradeWithMultipleRoutes', () => {
      it('throws if input currency does not match route with multiple routes', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_1_2], token2, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token2, 2000),
                outputAmount: CurrencyAmount.fromRawAmount(token1, 2000),
              },
              {
                route: new MixedRouteSDK([pool_0_1], token0, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token2, 8000),
                outputAmount: CurrencyAmount.fromRawAmount(token1, 8000),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('INPUT_CURRENCY_MATCH')
      })
      it('throws if output currency does not match route with multiple routes', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_0_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
              },
              {
                route: new MixedRouteSDK([pool_0_1], token0, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('OUTPUT_CURRENCY_MATCH')
      })

      it('throws if tradeType is exact output', () => {
        try {
          MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_0_1], token0, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
                outputAmount: CurrencyAmount.fromRawAmount(token1, 50000),
              },
              {
                route: new MixedRouteSDK([pool_0_2, pool_1_2], token0, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
                outputAmount: CurrencyAmount.fromRawAmount(token1, 50000),
              },
            ],
            tradeType: TradeType.EXACT_OUTPUT,
          })
        } catch (err) {
          // @ts-ignore
          expect(err.message).toEqual('Invariant failed: TRADE_TYPE')
        }
      })

      it('can create an exact input trade without simulating with multiple routes', () => {
        MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
          routes: [
            {
              route: new MixedRouteSDK([pool_0_1], token0, token1),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
              outputAmount: CurrencyAmount.fromRawAmount(token1, 50000),
            },
            {
              route: new MixedRouteSDK([pool_0_2, pool_1_2], token0, token1),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
              outputAmount: CurrencyAmount.fromRawAmount(token1, 50000),
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        })
      })
    })

    describe('#route and #swaps', () => {
      const singleRoute = MixedRouteTrade.createUncheckedTrade({
        route: new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
        inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
        outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
        tradeType: TradeType.EXACT_INPUT,
      })
      const multiRoute = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
        routes: [
          {
            route: new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 35),
          },
          {
            route: new MixedRouteSDK([pool_0_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 34),
          },
        ],
        tradeType: TradeType.EXACT_INPUT,
      })
      it('can access route for single route trade if less than 0', () => {
        expect(singleRoute.swaps).toBeDefined()
      })
      it('can access routes for both single and multi route trades', () => {
        expect(singleRoute.swaps).toBeDefined()
        expect(singleRoute.swaps).toHaveLength(1)
        expect(multiRoute.swaps).toBeDefined()
        expect(multiRoute.swaps).toHaveLength(2)
      })
      it('throws if access route on multi route trade', () => {
        expect(() => multiRoute.route).toThrow('MULTIPLE_ROUTES')
      })
    })

    describe('#worstExecutionPrice', () => {
      describe('tradeType = EXACT_INPUT', () => {
        const exactIn = MixedRouteTrade.createUncheckedTrade({
          route: new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
          inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
          outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
          tradeType: TradeType.EXACT_INPUT,
        })
        const exactInMultiRoute = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
          routes: [
            {
              route: new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 35),
            },
            {
              route: new MixedRouteSDK([pool_0_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 34),
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        })
        it('throws if less than 0', () => {
          expect(() => exactIn.minimumAmountOut(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
        })
        it('returns exact if 0', () => {
          expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice)
        })
        it('returns exact if nonzero', () => {
          expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
          expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
          expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
        })
        it('returns exact if nonzero with multiple routes', () => {
          expect(exactInMultiRoute.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
          expect(exactInMultiRoute.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
          expect(exactInMultiRoute.worstExecutionPrice(new Percent(200, 100))).toEqual(
            new Price(token0, token2, 100, 23)
          )
        })
      })
    })

    describe('#priceImpact', () => {
      describe('100% v3 route', () => {
        describe('tradeType = EXACT_INPUT', () => {
          const exactIn = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
          const exactInMultipleRoutes = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 90),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 62),
              },
              {
                route: new MixedRouteSDK([pool_0_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 10),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 7),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
          it('is cached', () => {
            expect(exactIn.priceImpact === exactIn.priceImpact).toStrictEqual(true)
          })
          it('is correct', () => {
            expect(exactIn.priceImpact.toSignificant(3)).toEqual('17.2')
          })

          it('is cached with multiple routes', () => {
            expect(exactInMultipleRoutes.priceImpact === exactInMultipleRoutes.priceImpact).toStrictEqual(true)
          })
          it('is correct with multiple routes', async () => {
            expect(exactInMultipleRoutes.priceImpact.toSignificant(3)).toEqual('19.8')
          })
        })
      })

      describe('mixed route', () => {
        describe('tradeType = EXACT_INPUT', () => {
          const exactIn = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
          const exactInMultipleRoutes = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 90),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 62),
              },
              {
                route: new MixedRouteSDK([pool_0_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 10),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 7),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
          it('is cached', () => {
            expect(exactIn.priceImpact === exactIn.priceImpact).toStrictEqual(true)
          })
          it('is correct', () => {
            expect(exactIn.priceImpact.toSignificant(3)).toEqual('17.2')
          })

          it('is cached with multiple routes', () => {
            expect(exactInMultipleRoutes.priceImpact === exactInMultipleRoutes.priceImpact).toStrictEqual(true)
          })
          it('is correct with multiple routes', async () => {
            expect(exactInMultipleRoutes.priceImpact.toSignificant(3)).toEqual('19.8')
          })
        })
      })
    })

    describe('#bestTradeExactIn', () => {
      it('throws with empty pools', async () => {
        await expect(
          MixedRouteTrade.bestTradeExactIn([], CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)), token2)
        ).rejects.toThrow('POOLS')
      })
      it('throws with max hops of 0', async () => {
        await expect(
          MixedRouteTrade.bestTradeExactIn(
            [pool_0_2],
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
            token2,
            {
              maxHops: 0,
            }
          )
        ).rejects.toThrow('MAX_HOPS')
      })

      it('provides best route', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pool_0_2, pool_1_2],
          CurrencyAmount.fromRawAmount(token0, 10000),
          token2
        )
        expect(result).toHaveLength(2)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
        expect(result[0].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)))).toBeTruthy()
        expect(result[0].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(9971)))).toBeTruthy()
        expect(result[1].swaps[0].route.pools).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
        expect(result[1].swaps[0].route.path).toEqual([token0, token1, token2])
        expect(result[1].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)))).toBeTruthy()
        expect(result[1].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(7004)))).toBeTruthy()
      })

      it('respects maxHops', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pool_0_2, pool_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2,
          { maxHops: 1 }
        )
        expect(result).toHaveLength(1)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
      })

      it('insufficient input for one pool', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pool_0_2, pool_1_2],
          CurrencyAmount.fromRawAmount(token0, 1),
          token2
        )
        expect(result).toHaveLength(2)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
        expect(result[0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 0))
      })

      it('respects n', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pool_0_2, pool_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2,
          { maxNumResults: 1 }
        )

        expect(result).toHaveLength(1)
      })

      it('no path', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pool_0_3, pool_1_3],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2
        )
        expect(result).toHaveLength(0)
      })

      it('works for ETHER currency input', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_weth_0, pool_0_1, pool_0_3, pool_1_3],
          CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(100)),
          token3
        )
        expect(result).toHaveLength(2)
        expect(result[0].inputAmount.currency).toEqual(ETHER)
        expect(result[0].swaps[0].route.path).toEqual([WETH9[1], token0, token1, token3])
        expect(result[0].outputAmount.currency).toEqual(token3)
        expect(result[1].inputAmount.currency).toEqual(ETHER)
        expect(result[1].swaps[0].route.path).toEqual([WETH9[1], token0, token3])
        expect(result[1].outputAmount.currency).toEqual(token3)
      })

      it('works for ETHER currency output', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_weth_0, pool_0_1, pool_0_3, pool_1_3],
          CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(100)),
          ETHER
        )
        expect(result).toHaveLength(2)
        expect(result[0].inputAmount.currency).toEqual(token3)
        expect(result[0].swaps[0].route.path).toEqual([token3, token0, WETH9[1]])
        expect(result[0].outputAmount.currency).toEqual(ETHER)
        expect(result[1].inputAmount.currency).toEqual(token3)
        expect(result[1].swaps[0].route.path).toEqual([token3, token1, token0, WETH9[1]])
        expect(result[1].outputAmount.currency).toEqual(ETHER)
      })
    })

    describe('#maximumAmountIn', () => {
      describe('tradeType = EXACT_INPUT', () => {
        let exactIn: MixedRouteTrade<Token, Token, TradeType.EXACT_INPUT>
        beforeEach(async () => {
          exactIn = await MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
            TradeType.EXACT_INPUT
          )
        })
        it('throws if less than 0', () => {
          expect(() => exactIn.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
            'SLIPPAGE_TOLERANCE'
          )
        })
        it('returns exact if 0', () => {
          expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.inputAmount)
        })
        it('returns exact if nonzero', () => {
          expect(
            exactIn
              .maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))
              .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
          ).toBeTruthy()
          expect(
            exactIn
              .maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))
              .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
          ).toBeTruthy()
          expect(
            exactIn
              .maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))
              .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
          ).toBeTruthy()
        })
      })
    })

    describe('#minimumAmountOut', () => {
      describe('tradeType = EXACT_INPUT', () => {
        let exactIn: MixedRouteTrade<Token, Token, TradeType.EXACT_INPUT>
        beforeEach(
          async () =>
            (exactIn = await MixedRouteTrade.fromRoute(
              new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2),
              CurrencyAmount.fromRawAmount(token0, 10000),
              TradeType.EXACT_INPUT
            ))
        )

        it('throws if less than 0', () => {
          expect(() => exactIn.minimumAmountOut(new Percent(JSBI.BigInt(-1), 100))).toThrow('SLIPPAGE_TOLERANCE')
        })

        it('returns exact if 0', () => {
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), 10000))).toEqual(exactIn.outputAmount)
        })

        it('returns exact if nonzero', () => {
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token2, 7004)
          )
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(5), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token2, 6670)
          )
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(200), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token2, 2334)
          )
        })
      })
    })
  })

  /// @dev copied over from v2-sdk trade.test.ts
  describe('is backwards compatible with pure v2 routes', () => {
    it('can be constructed with ETHER as input', async () => {
      const trade = await MixedRouteTrade.fromRoute(
        new MixedRouteSDK([pair_weth_0], ETHER, token0),
        CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(100)),
        TradeType.EXACT_INPUT
      )
      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token0)
    })

    it('can be constructed with ETHER as output for exact input', async () => {
      const trade = await MixedRouteTrade.fromRoute(
        new MixedRouteSDK([pair_weth_0], token0, ETHER),
        CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
        TradeType.EXACT_INPUT
      )
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ETHER)
    })

    describe('#bestTradeExactIn', () => {
      it('throws with empty pairs', async () => {
        await expect(
          MixedRouteTrade.bestTradeExactIn([], CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)), token2)
        ).rejects.toThrow('POOLS')
      })
      it('throws with max hops of 0', async () => {
        await expect(
          MixedRouteTrade.bestTradeExactIn([pair_0_2], CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)), token2, {
            maxHops: 0,
          })
        ).rejects.toThrow('MAX_HOPS')
      })

      it('provides best route', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_0_1, pair_0_2, pair_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
          token2
        )
        expect(result).toHaveLength(2)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
        expect(result[0].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
        expect(result[0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(99)))
        expect(result[1].swaps[0].route.pools).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
        expect(result[1].swaps[0].route.path).toEqual([token0, token1, token2])
        expect(result[1].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
        expect(result[1].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(69)))
      })

      it('doesnt throw for zero liquidity pairs', async () => {
        expect(
          await MixedRouteTrade.bestTradeExactIn(
            [empty_pair_0_1],
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
            token1
          )
        ).toHaveLength(0)
      })

      it('respects maxHops', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_0_1, pair_0_2, pair_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2,
          { maxHops: 1 }
        )
        expect(result).toHaveLength(1)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
      })

      it('insufficient input for one pair', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_0_1, pair_0_2, pair_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1)),
          token2
        )
        expect(result).toHaveLength(1)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
        expect(result[0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1)))
      })

      it('respects n', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_0_1, pair_0_2, pair_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2,
          { maxNumResults: 1 }
        )

        expect(result).toHaveLength(1)
      })

      it('no path', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_0_1, pair_0_3, pair_1_3],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2
        )
        expect(result).toHaveLength(0)
      })

      it('works for ETHER currency input', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
          CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(100)),
          token3
        )
        expect(result).toHaveLength(2)
        expect(result[0].inputAmount.currency).toEqual(ETHER)
        expect(result[0].swaps[0].route.path).toEqual([WETH9[1], token0, token1, token3])
        expect(result[0].outputAmount.currency).toEqual(token3)
        expect(result[1].inputAmount.currency).toEqual(ETHER)
        expect(result[1].swaps[0].route.path).toEqual([WETH9[1], token0, token3])
        expect(result[1].outputAmount.currency).toEqual(token3)
      })
      it('works for ETHER currency output', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
          CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(100)),
          ETHER
        )
        expect(result).toHaveLength(2)
        expect(result[0].inputAmount.currency).toEqual(token3)
        expect(result[0].swaps[0].route.path).toEqual([token3, token0, WETH9[1]])
        expect(result[0].outputAmount.currency).toEqual(ETHER)
        expect(result[1].inputAmount.currency).toEqual(token3)
        expect(result[1].swaps[0].route.path).toEqual([token3, token1, token0, WETH9[1]])
        expect(result[1].outputAmount.currency).toEqual(ETHER)
      })
    })

    describe('#maximumAmountIn', () => {
      describe('tradeType = EXACT_INPUT', () => {
        let exactIn: MixedRouteTrade<Currency, Currency, TradeType>
        beforeAll(async () => {
          exactIn = await MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pair_0_1, pair_1_2], token0, token2),
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
            TradeType.EXACT_INPUT
          )
        })

        it('throws if less than 0', () => {
          expect(() => exactIn.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
            'SLIPPAGE_TOLERANCE'
          )
        })
        it('returns exact if 0', () => {
          expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.inputAmount)
        })
        it('returns exact if nonzero', () => {
          expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))
          )
          expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))
          )
          expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))
          )
        })
      })
    })

    describe('#minimumAmountOut', () => {
      describe('tradeType = EXACT_INPUT', () => {
        let exactIn: MixedRouteTrade<Currency, Currency, TradeType>
        beforeAll(async () => {
          exactIn = await MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pair_0_1, pair_1_2], token0, token2),
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
            TradeType.EXACT_INPUT
          )
        })
        it('throws if less than 0', () => {
          expect(() => exactIn.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
            'SLIPPAGE_TOLERANCE'
          )
        })
        it('returns exact if 0', () => {
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.outputAmount)
        })
        it('returns exact if nonzero', () => {
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
            CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(69))
          )
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
            CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(65))
          )
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
            CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(23))
          )
        })
      })
    })

    describe('#worstExecutionPrice', () => {
      describe('tradeType = EXACT_INPUT', () => {
        let exactIn: MixedRouteTrade<Currency, Currency, TradeType>
        beforeAll(async () => {
          exactIn = await MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pair_0_1, pair_1_2], token0, token2),
            CurrencyAmount.fromRawAmount(token0, 100),
            TradeType.EXACT_INPUT
          )
        })
        it('throws if less than 0', () => {
          expect(() => exactIn.minimumAmountOut(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
        })
        it('returns exact if 0', () => {
          expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice)
        })
        it('returns exact if nonzero', () => {
          expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
          expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
          expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
        })
      })
    })
  })

  describe('multihop v2 + v3', () => {
    describe('#fromRoute', () => {
      it('can be constructed with ETHER as input', async () => {
        const trade = await MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_weth_0, pair_0_1], ETHER, token1),
          CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(10000)),
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(ETHER)
        expect(trade.outputAmount.currency).toEqual(token1)
      })
      it('can be constructed with ETHER as output for exact input', async () => {
        const trade = await MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1, pool_weth_0], token1, ETHER),
          CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(10000)),
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(token1)
        expect(trade.outputAmount.currency).toEqual(ETHER)
      })
      it('allows using input tokens as intermediary', async () => {
        const trade = await MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1, pool_0_1, pair_0_2], token0, token2),
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(token0)
        expect(trade.outputAmount.currency).toEqual(token2)
      })
    })

    describe('#fromRoutes', () => {
      it('can be constructed with ETHER as input with multiple routes', async () => {
        const trade = await MixedRouteTrade.fromRoutes<Ether, Token, TradeType>(
          [
            {
              amount: CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(10000)),
              route: new MixedRouteSDK([pool_weth_0, pair_0_1], ETHER, token1),
            },
          ],
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(ETHER)
        expect(trade.outputAmount.currency).toEqual(token1)
      })

      it('can be constructed with ETHER as output for exact input with multiple routes', async () => {
        const trade = await MixedRouteTrade.fromRoutes<Token, Ether, TradeType.EXACT_INPUT>(
          [
            {
              amount: CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(3000)),
              route: new MixedRouteSDK([pair_0_1, pool_weth_0], token1, ETHER),
            },
            {
              amount: CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(7000)),
              route: new MixedRouteSDK([pair_1_2, pool_weth_2], token1, ETHER),
            },
          ],
          TradeType.EXACT_INPUT
        )
        expect(trade.inputAmount.currency).toEqual(token1)
        expect(trade.outputAmount.currency).toEqual(ETHER)
      })

      /// no test for pool duplication because both v3 and v2 tests above cover it
    })

    describe('#createUncheckedTrade', () => {
      it('throws if input currency does not match route', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTrade({
            route: new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
            outputAmount: CurrencyAmount.fromRawAmount(token1, 10000),
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('INPUT_CURRENCY_MATCH')
      })
      it('throws if output currency does not match route', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTrade({
            route: new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
            outputAmount: CurrencyAmount.fromRawAmount(token3, 10000),
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('OUTPUT_CURRENCY_MATCH')
      })
      it('can create an exact input trade without simulating', () => {
        MixedRouteTrade.createUncheckedTrade({
          route: new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
          inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
          outputAmount: CurrencyAmount.fromRawAmount(token2, 100000),
          tradeType: TradeType.EXACT_INPUT,
        })
      })
    })

    describe('#createUncheckedTradeWithMultipleRoutes', () => {
      it('throws if input currency does not match route with multiple routes', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_1_2], token2, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token2, 2000),
                outputAmount: CurrencyAmount.fromRawAmount(token1, 2000),
              },
              {
                route: new MixedRouteSDK([pair_0_1], token0, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token2, 8000),
                outputAmount: CurrencyAmount.fromRawAmount(token1, 8000),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('INPUT_CURRENCY_MATCH')
      })
      it('throws if output currency does not match route with multiple routes', () => {
        expect(() =>
          MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
            routes: [
              {
                route: new MixedRouteSDK([pool_0_2], token0, token2),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
              },
              {
                route: new MixedRouteSDK([pair_0_1], token0, token1),
                inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
                outputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
              },
            ],
            tradeType: TradeType.EXACT_INPUT,
          })
        ).toThrow('OUTPUT_CURRENCY_MATCH')
      })

      it('can create an exact input trade without simulating with multiple routes', () => {
        MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
          routes: [
            {
              route: new MixedRouteSDK([pool_0_1], token0, token1),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
              outputAmount: CurrencyAmount.fromRawAmount(token1, 50000),
            },
            {
              route: new MixedRouteSDK([pool_0_2, pair_1_2], token0, token1),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
              outputAmount: CurrencyAmount.fromRawAmount(token1, 50000),
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        })
      })
    })

    describe('#route and #swaps', () => {
      const singleRoute = MixedRouteTrade.createUncheckedTrade({
        route: new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
        inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
        outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
        tradeType: TradeType.EXACT_INPUT,
      })
      const multiRoute = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
        routes: [
          {
            route: new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 35),
          },
          {
            route: new MixedRouteSDK([pool_0_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 34),
          },
        ],
        tradeType: TradeType.EXACT_INPUT,
      })
      it('can access route for single route trade if less than 0', () => {
        expect(singleRoute.route).toBeDefined()
      })
      it('can access routes for both single and multi route trades', () => {
        expect(singleRoute.swaps).toBeDefined()
        expect(singleRoute.swaps).toHaveLength(1)
        expect(multiRoute.swaps).toBeDefined()
        expect(multiRoute.swaps).toHaveLength(2)
      })
      it('throws if access route on multi route trade', () => {
        expect(() => multiRoute.route).toThrow('MULTIPLE_ROUTES')
      })
    })

    describe('#worstExecutionPrice', () => {
      describe('tradeType = EXACT_INPUT', () => {
        const exactIn = MixedRouteTrade.createUncheckedTrade({
          route: new MixedRouteSDK([pair_0_1, pool_1_2], token0, token2),
          inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
          outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
          tradeType: TradeType.EXACT_INPUT,
        })
        const exactInMultiRoute = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
          routes: [
            {
              route: new MixedRouteSDK([pair_0_1, pool_1_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 35),
            },
            {
              route: new MixedRouteSDK([pool_0_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 34),
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        })
        it('throws if less than 0', () => {
          expect(() => exactIn.minimumAmountOut(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
        })
        it('returns exact if 0', () => {
          expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice)
        })
        it('returns exact if nonzero', () => {
          expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
          expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
          expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
        })
        it('returns exact if nonzero with multiple routes', () => {
          expect(exactInMultiRoute.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
          expect(exactInMultiRoute.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
          expect(exactInMultiRoute.worstExecutionPrice(new Percent(200, 100))).toEqual(
            new Price(token0, token2, 100, 23)
          )
        })
      })
    })

    describe('#priceImpact', () => {
      describe('tradeType = EXACT_INPUT', () => {
        const exactIn = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
          routes: [
            {
              route: new MixedRouteSDK([pair_0_1, pool_1_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        })
        const exactInMultipleRoutes = MixedRouteTrade.createUncheckedTradeWithMultipleRoutes({
          routes: [
            {
              route: new MixedRouteSDK([pair_0_1, pool_1_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 90),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 62),
            },
            {
              route: new MixedRouteSDK([pool_0_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 10),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 7),
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        })
        it('is cached', () => {
          expect(exactIn.priceImpact === exactIn.priceImpact).toStrictEqual(true)
        })
        it('is correct', () => {
          expect(exactIn.priceImpact.toSignificant(3)).toEqual('17.2')
        })

        it('is cached with multiple routes', () => {
          expect(exactInMultipleRoutes.priceImpact === exactInMultipleRoutes.priceImpact).toStrictEqual(true)
        })
        it('is correct with multiple routes', async () => {
          expect(exactInMultipleRoutes.priceImpact.toSignificant(3)).toEqual('19.8')
        })
      })
    })

    describe('#bestTradeExactIn', () => {
      /// no empty check because covered by v3 backward compatibility test

      it('throws with max hops of 0', async () => {
        await expect(
          MixedRouteTrade.bestTradeExactIn(
            [pool_0_2, pair_1_2],
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
            token1,
            {
              maxHops: 0,
            }
          )
        ).rejects.toThrow('MAX_HOPS')
      })

      it('provides best route', async () => {
        const large_pair_0_1 = new Pair(
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100000)),
          CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100000))
        )
        const result = await MixedRouteTrade.bestTradeExactIn(
          [large_pair_0_1, pool_0_2, pool_1_2],
          CurrencyAmount.fromRawAmount(token0, 10000),
          token2
        )

        expect(result).toHaveLength(2)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
        expect(result[0].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)))).toBeTruthy()
        expect(result[0].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(9971)))).toBeTruthy()
        expect(result[1].swaps[0].route.pools).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
        expect(result[1].swaps[0].route.path).toEqual([token0, token1, token2])
        expect(result[1].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)))).toBeTruthy()
        expect(result[1].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(7004)))).toBeTruthy()
      })

      it('respects maxHops', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pool_0_2, pair_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2,
          { maxHops: 1 }
        )
        expect(result).toHaveLength(1)
        expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
      })

      it('insufficient input for one pool', async () => {
        /// pairs are just skipped
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pair_0_1, pool_0_2, pair_1_2],
          CurrencyAmount.fromRawAmount(token0, 1),
          token2
        )

        expect(result).toHaveLength(1)
        expect(result[0].swaps[0].route.pools).toHaveLength(1)
        expect(result[0].swaps[0].route.path).toEqual([token0, token2])
        expect(result[0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 0))
      })

      it('respects n', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pair_0_2, pool_1_2],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2,
          { maxNumResults: 1 }
        )

        expect(result).toHaveLength(1)
      })

      it('no path between v2 and v3', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_0_1, pair_0_3, pool_1_3],
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
          token2
        )
        expect(result).toHaveLength(0)
      })

      it('works for ETHER currency input', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_weth_0, pair_0_1, pool_0_3, pair_1_3],
          CurrencyAmount.fromRawAmount(Ether.onChain(1), JSBI.BigInt(100)),
          token3
        )
        expect(result).toHaveLength(2)
        expect(result[0].inputAmount.currency).toEqual(ETHER)
        expect(result[0].swaps[0].route.path).toEqual([WETH9[1], token0, token1, token3])
        expect(result[0].outputAmount.currency).toEqual(token3)
        expect(result[1].inputAmount.currency).toEqual(ETHER)
        expect(result[1].swaps[0].route.path).toEqual([WETH9[1], token0, token3])
        expect(result[1].outputAmount.currency).toEqual(token3)
      })

      it('works for ETHER currency output', async () => {
        const result = await MixedRouteTrade.bestTradeExactIn(
          [pool_weth_0, pool_0_1, pair_0_3, pair_1_3],
          CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(100)),
          ETHER
        )
        expect(result).toHaveLength(2)
        expect(result[0].inputAmount.currency).toEqual(token3)
        expect(result[0].swaps[0].route.path).toEqual([token3, token0, WETH9[1]])
        expect(result[0].outputAmount.currency).toEqual(ETHER)
        expect(result[1].inputAmount.currency).toEqual(token3)
        expect(result[1].swaps[0].route.path).toEqual([token3, token1, token0, WETH9[1]])
        expect(result[1].outputAmount.currency).toEqual(ETHER)
      })
    })

    describe('#maximumAmountIn', () => {
      describe('tradeType = EXACT_INPUT', () => {
        let exactIn: MixedRouteTrade<Token, Token, TradeType.EXACT_INPUT>
        beforeEach(async () => {
          exactIn = await MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pool_0_1, pair_1_2], token0, token2),
            CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
            TradeType.EXACT_INPUT
          )
        })
        it('throws if less than 0', () => {
          expect(() => exactIn.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
            'SLIPPAGE_TOLERANCE'
          )
        })
        it('returns exact if 0', () => {
          expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.inputAmount)
        })
        it('returns exact if nonzero', () => {
          expect(
            exactIn
              .maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))
              .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
          ).toBeTruthy()
          expect(
            exactIn
              .maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))
              .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
          ).toBeTruthy()
          expect(
            exactIn
              .maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))
              .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
          ).toBeTruthy()
        })
      })
    })

    describe('#minimumAmountOut', () => {
      describe('tradeType = EXACT_INPUT', () => {
        let exactIn: MixedRouteTrade<Token, Token, TradeType.EXACT_INPUT>
        const large_pair_0_1 = new Pair(
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100000)),
          CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100000))
        )
        beforeEach(
          async () =>
            (exactIn = await MixedRouteTrade.fromRoute(
              new MixedRouteSDK([large_pair_0_1, pool_1_2], token0, token2),
              CurrencyAmount.fromRawAmount(token0, 10000),
              TradeType.EXACT_INPUT
            ))
        )

        it('throws if less than 0', () => {
          expect(() => exactIn.minimumAmountOut(new Percent(JSBI.BigInt(-1), 100))).toThrow('SLIPPAGE_TOLERANCE')
        })

        it('returns exact if 0', () => {
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), 10000))).toEqual(exactIn.outputAmount)
        })

        it('returns exact if nonzero', () => {
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token2, 7004)
          )
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(5), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token2, 6670)
          )
          expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(200), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token2, 2334)
          )
        })
      })
    })
  })
})
