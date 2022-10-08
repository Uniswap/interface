import { BigintIsh, CurrencyAmount, Ether, Percent, Token, TradeType, WETH9 } from '@uniswap/sdk-core'
import { Pair, Route as V2Route, Trade as V2Trade } from '@teleswap/v2-sdk'
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  Pool,
  Position,
  Route as V3Route,
  TickMath,
  TICK_SPACINGS,
  Trade as V3Trade,
} from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { SwapRouter, Trade } from '.'
import { ApprovalTypes } from './approveAndCall'
import { MixedRouteSDK } from './entities/mixedRoute/route'
import { MixedRouteTrade } from './entities/mixedRoute/trade'

describe('SwapRouter', () => {
  const ETHER = Ether.onChain(1)
  const WETH = WETH9[1]

  const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const token2 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 't2', 'token2')

  const feeAmount = FeeAmount.MEDIUM
  const sqrtRatioX96 = encodeSqrtRatioX96(1, 1)
  const liquidity = 1_000_000

  // v3
  const makePool = (token0: Token, token1: Token, liquidity: number) => {
    return new Pool(token0, token1, feeAmount, sqrtRatioX96, liquidity, TickMath.getTickAtSqrtRatio(sqrtRatioX96), [
      {
        index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: liquidity,
        liquidityGross: liquidity,
      },
      {
        index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: -liquidity,
        liquidityGross: liquidity,
      },
    ])
  }

  // v2
  const makePair = (token0: Token, token1: Token, liquidity: BigintIsh) => {
    const amount0 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(liquidity))
    const amount1 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(liquidity))

    return new Pair(amount0, amount1)
  }

  const pool_0_1 = makePool(token0, token1, liquidity)
  const pair_0_1 = makePair(token0, token1, liquidity)
  const pair_1_2 = makePair(token1, token2, liquidity)

  const pool_1_WETH = makePool(token1, WETH, liquidity)
  const pair_1_WETH = makePair(token1, WETH, liquidity)
  const pair_2_WETH = makePair(token2, WETH, liquidity)
  const pool_2_WETH = makePool(token2, WETH, liquidity)

  const slippageTolerance = new Percent(1, 100)
  const recipient = '0x0000000000000000000000000000000000000003'
  const deadline = 123

  describe('#swapCallParameters', () => {
    describe('single-hop exact input (v2 + v3)', () => {
      describe('different trade configurations result in identical calldata', () => {
        const expectedCalldata =
          '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000e4472b43f300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000062000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000061000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)

        it('array of trades', async () => {
          const trades = [v2Trade, await v3Trade]
          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })

        it('meta-trade', async () => {
          const trades = await Trade.fromRoutes(
            [
              {
                routev2: v2Trade.route,
                amount: amountIn,
              },
            ],
            [
              {
                routev3: (await v3Trade).swaps[0].route,
                amount: amountIn,
              },
            ],
            TradeType.EXACT_INPUT
          )

          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })
      })
    })

    describe('single-hop exact output (v2 + v3)', () => {
      describe('different trade configurations result in identical calldata', () => {
        const expectedCalldata =
          '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000e442712a6700000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000066000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e45023b4df000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000067000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountOut = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

        const v2Trade = V2Trade.exactOut(new V2Route([pair_0_1], token0, token1), amountOut)
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountOut, TradeType.EXACT_OUTPUT)

        it('array of trades', async () => {
          const trades = [v2Trade, await v3Trade]
          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })

        it('meta-trade', async () => {
          const trades = await Trade.fromRoutes(
            [
              {
                routev2: v2Trade.route,
                amount: amountOut,
              },
            ],
            [
              {
                routev3: (await v3Trade).swaps[0].route,
                amount: amountOut,
              },
            ],
            TradeType.EXACT_OUTPUT
          )

          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })
      })
    })

    describe('multi-hop exact input (v2 + v3)', () => {
      describe('different trade configurations result in identical calldata', () => {
        const expectedCalldata =
          '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000104472b43f30000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000005f00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1, pair_1_WETH], token0, WETH), amountIn)
        const v3Trade = V3Trade.fromRoute(
          new V3Route([pool_0_1, pool_1_WETH], token0, WETH),
          amountIn,
          TradeType.EXACT_INPUT
        )

        it('array of trades', async () => {
          const trades = [v2Trade, await v3Trade]
          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })

        it('meta-trade', async () => {
          const trades = await Trade.fromRoutes(
            [
              {
                routev2: v2Trade.route,
                amount: amountIn,
              },
            ],
            [
              {
                routev3: (await v3Trade).swaps[0].route,
                amount: amountIn,
              },
            ],
            TradeType.EXACT_INPUT
          )

          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })
      })
    })

    describe('multi-hop exact output (v2 + v3)', () => {
      describe('different trade configurations result in identical calldata', () => {
        const expectedCalldata =
          '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000010442712a670000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006700000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012409b81346000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000690000000000000000000000000000000000000000000000000000000000000042c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb80000000000000000000000000000000000000002000bb8000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountOut = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(100))

        const v2Trade = V2Trade.exactOut(new V2Route([pair_0_1, pair_1_WETH], token0, WETH), amountOut)
        const v3Trade = V3Trade.fromRoute(
          new V3Route([pool_0_1, pool_1_WETH], token0, WETH),
          amountOut,
          TradeType.EXACT_OUTPUT
        )

        it('array of trades', async () => {
          const trades = [v2Trade, await v3Trade]
          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })

        it('meta-trade', async () => {
          const trades = await Trade.fromRoutes(
            [
              {
                routev2: v2Trade.route,
                amount: amountOut,
              },
            ],
            [
              {
                routev3: (await v3Trade).swaps[0].route,
                amount: amountOut,
              },
            ],
            TradeType.EXACT_OUTPUT
          )

          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })
      })
    })

    describe('Mixed Route', () => {
      describe('single-hop exact input (v2 + v3) backwards compatible', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000e4472b43f300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000062000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000061000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
          const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
          const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)
          const mixedRouteTrade1 = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pair_0_1], token0, token1),
            amountIn,
            TradeType.EXACT_INPUT
          )
          const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pool_0_1], token0, token1),
            amountIn,
            TradeType.EXACT_INPUT
          )

          it('generates the same calldata', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')

            const mixedRouteTrades = [await mixedRouteTrade1, await mixedRouteTrade2]
            const { calldata: mixedRouteCalldata, value: mixedRouteValue } = SwapRouter.swapCallParameters(
              mixedRouteTrades,
              {
                slippageTolerance,
                recipient,
                deadlineOrPreviousBlockhash: deadline,
              }
            )
            expect(mixedRouteCalldata).toEqual(expectedCalldata)
            expect(mixedRouteValue).toBe('0x00')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountIn,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountIn,
                },
              ],
              TradeType.EXACT_INPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')

            const mixedRouteTrades = await Trade.fromRoutes([], [], TradeType.EXACT_INPUT, [
              {
                mixedRoute: (await mixedRouteTrade1).swaps[0].route,
                amount: amountIn,
              },
              {
                mixedRoute: (await mixedRouteTrade2).swaps[0].route,
                amount: amountIn,
              },
            ])

            const { calldata: mixedRouteCalldata, value: mixedRouteValue } = SwapRouter.swapCallParameters(
              mixedRouteTrades,
              {
                slippageTolerance,
                recipient,
                deadlineOrPreviousBlockhash: deadline,
              }
            )
            expect(mixedRouteCalldata).toEqual(expectedCalldata)
            expect(mixedRouteValue).toBe('0x00')
          })
        })
      })

      describe('multi-hop exact input (mixed route) backwards compatible', () => {
        describe('different trade configurations result in identical calldata', () => {
          /// calldata verified and taken from existing test
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000104472b43f30000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000005f00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
          const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

          const mixedRouteTrade1 = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pair_0_1, pair_1_WETH], token0, WETH),
            amountIn,
            TradeType.EXACT_INPUT
          )
          const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pool_0_1, pool_1_WETH], token0, WETH),
            amountIn,
            TradeType.EXACT_INPUT
          )

          it('single mixedRoute trade', async () => {
            const trades = [await mixedRouteTrade1, await mixedRouteTrade2]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes([], [], TradeType.EXACT_INPUT, [
              {
                mixedRoute: (await mixedRouteTrade1).swaps[0].route,
                amount: amountIn,
              },
              {
                mixedRoute: (await mixedRouteTrade2).swaps[0].route,
                amount: amountIn,
              },
            ])

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })
        })
      })

      describe('mixed route trades with routes with consecutive pools/pairs', () => {
        /// manually verified calldata
        const expectedCalldata =
          '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e4472b43f30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005e000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104472b43f300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f000000000000000000000000000000000000000000000000000000000000002b0000000000000000000000000000000000000003000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))
        const mixedRouteTrade1 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1, pool_1_WETH, pair_2_WETH], token0, WETH),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1, pair_1_2, pool_2_WETH], token0, WETH),
          amountIn,
          TradeType.EXACT_INPUT
        )

        it('generates correct calldata', async () => {
          const trades = [await mixedRouteTrade1, await mixedRouteTrade2]
          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(value).toBe('0x00')
        })
      })
    })

    describe('ETH input', () => {
      describe('single-hop exact input (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000e4472b43f300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000062000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000061000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
          const amountIn = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactIn(new V2Route([pair_1_WETH], ETHER, token1), amountIn)
          const v3Trade = V3Trade.fromRoute(new V3Route([pool_1_WETH], ETHER, token1), amountIn, TradeType.EXACT_INPUT)
          /// mixedRouteTrade mirrors the V3Trade
          const mixedRouteTrade = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pool_1_WETH], ETHER, token1),
            amountIn,
            TradeType.EXACT_INPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })

          it('mixedRoute produces the same calldata when swapped in', async () => {
            const trades = [v2Trade, await mixedRouteTrade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountIn,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountIn,
                },
              ],
              TradeType.EXACT_INPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })

          it('meta-trade with mixedRoute', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountIn,
                },
              ],
              [],
              TradeType.EXACT_INPUT,
              [
                {
                  mixedRoute: (await mixedRouteTrade).swaps[0].route,
                  amount: amountIn,
                },
              ]
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })
        })
      })

      describe('single-hop exact output (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000e442712a6700000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000066000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e45023b4df000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000067000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000412210e8a00000000000000000000000000000000000000000000000000000000'
          const amountOut = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactOut(new V2Route([pair_1_WETH], ETHER, token1), amountOut)
          const v3Trade = V3Trade.fromRoute(
            new V3Route([pool_1_WETH], ETHER, token1),
            amountOut,
            TradeType.EXACT_OUTPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xcd')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountOut,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountOut,
                },
              ],
              TradeType.EXACT_OUTPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xcd')
          })
        })
      })

      describe('multi-hop exact input (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000104472b43f300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000061000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000005f0000000000000000000000000000000000000000000000000000000000000042c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb80000000000000000000000000000000000000002000bb8000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
          const amountIn = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactIn(new V2Route([pair_1_WETH, pair_0_1], ETHER, token0), amountIn)
          /// mixedRouteTrade mirrors V2Trade
          const mixedRouteTrade = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pair_1_WETH, pair_0_1], ETHER, token0),
            amountIn,
            TradeType.EXACT_INPUT
          )
          const v3Trade = V3Trade.fromRoute(
            new V3Route([pool_1_WETH, pool_0_1], ETHER, token0),
            amountIn,
            TradeType.EXACT_INPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })

          it('mixedRoutes in array produce same calldata', async () => {
            const trades = [await mixedRouteTrade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountIn,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountIn,
                },
              ],
              TradeType.EXACT_INPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })

          it('meta-trade with mixedRoutes produces calldata in different order but same content', async () => {
            /// @dev since we order the calldata in the array in a particular way (v2, v3, mixedRoute) the ordering will be different, but the encoded swap data will be the same
            /// Additionally, since we aren't sharing balances across trades order should not matter
            const expectedCalldata =
              '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000005f0000000000000000000000000000000000000000000000000000000000000042c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb80000000000000000000000000000000000000002000bb80000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104472b43f300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000061000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000'
            const trades = await Trade.fromRoutes(
              [],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountIn,
                },
              ],
              TradeType.EXACT_INPUT,
              [
                {
                  mixedRoute: (await mixedRouteTrade).swaps[0].route,
                  amount: amountIn,
                },
              ]
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xc8')
          })
        })
      })

      describe('multi-hop exact output (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010442712a6700000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000067000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012409b813460000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006900000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000412210e8a00000000000000000000000000000000000000000000000000000000'
          const amountOut = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactOut(new V2Route([pair_1_WETH, pair_0_1], ETHER, token0), amountOut)
          const v3Trade = V3Trade.fromRoute(
            new V3Route([pool_1_WETH, pool_0_1], ETHER, token0),
            amountOut,
            TradeType.EXACT_OUTPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xd0')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountOut,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountOut,
                },
              ],
              TradeType.EXACT_OUTPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0xd0')
          })
        })
      })

      describe('high price impact with ETH input to result in refundETH being appended to calldata', () => {
        const expectedCalldata =
          '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000e4472b43f300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000062000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000412210e8a00000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))
        const pool_1_WETH_slippage = makePool(token1, WETH, 100)
        const REFUND_ETH_FUNCTION_SIG = /12210e8a/

        const v2Trade = V2Trade.exactIn(new V2Route([pair_1_WETH], ETHER, token1), amountIn)
        const v3Trade = V3Trade.fromRoute(
          new V3Route([pool_1_WETH_slippage], ETHER, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )

        it('array of trades', async () => {
          const trades = [v2Trade, await v3Trade]
          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(calldata).toMatch(REFUND_ETH_FUNCTION_SIG)
          expect(value).toBe('0xc8')
        })
      })

      describe('high price impact with ERCO20 input does not result in refundETH call', () => {
        const expectedCalldata =
          '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000620000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))
        const pool_1_WETH_slippage = makePool(token1, WETH, 100)
        const REFUND_ETH_FUNCTION_SIG = /12210e8a/

        const v2Trade = V2Trade.exactIn(new V2Route([pair_1_WETH], token1, WETH), amountIn)
        const v3Trade = V3Trade.fromRoute(
          new V3Route([pool_1_WETH_slippage], token1, WETH),
          amountIn,
          TradeType.EXACT_INPUT
        )

        it('array of trades', async () => {
          const trades = [v2Trade, await v3Trade]
          const { calldata, value } = SwapRouter.swapCallParameters(trades, {
            slippageTolerance,
            recipient,
            deadlineOrPreviousBlockhash: deadline,
          })
          expect(calldata).toEqual(expectedCalldata)
          expect(calldata).not.toMatch(REFUND_ETH_FUNCTION_SIG)
          expect(value).toBe('0x00')
        })
      })
    })

    describe('ETH output', () => {
      describe('single-hop exact input (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000620000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000061000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004449404b7c00000000000000000000000000000000000000000000000000000000000000c3000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000'
          const amountIn = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactIn(new V2Route([pair_1_WETH], token1, ETHER), amountIn)
          const v3Trade = V3Trade.fromRoute(new V3Route([pool_1_WETH], token1, ETHER), amountIn, TradeType.EXACT_INPUT)
          /// mixedRoute mirrors v3Trade
          const mixedRouteTrade = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pool_1_WETH], token1, ETHER),
            amountIn,
            TradeType.EXACT_INPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('array of trades with mixedRoute produces same calldata', async () => {
            const trades = [v2Trade, await mixedRouteTrade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountIn,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountIn,
                },
              ],
              TradeType.EXACT_INPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('meta-trade with mixedRoute produces same calldata', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountIn,
                },
              ],
              [],
              TradeType.EXACT_INPUT,
              [
                {
                  mixedRoute: (await mixedRouteTrade).swaps[0].route,
                  amount: amountIn,
                },
              ]
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })
        })
      })

      describe('single-hop exact output (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000e442712a67000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000660000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e45023b4df0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000067000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004449404b7c00000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000'
          const amountOut = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactOut(new V2Route([pair_1_WETH], token1, ETHER), amountOut)
          const v3Trade = V3Trade.fromRoute(
            new V3Route([pool_1_WETH], token1, ETHER),
            amountOut,
            TradeType.EXACT_OUTPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountOut,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountOut,
                },
              ],
              TradeType.EXACT_OUTPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })
        })
      })

      describe('multi-hop exact input (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000104472b43f30000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000005f00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004449404b7c00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000'
          const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1, pair_1_WETH], token0, ETHER), amountIn)
          /// mixedRouteTrade mirrors v2Trade
          const mixedRouteTrade = MixedRouteTrade.fromRoute(
            new MixedRouteSDK([pair_0_1, pair_1_WETH], token0, ETHER),
            amountIn,
            TradeType.EXACT_INPUT
          )
          const v3Trade = V3Trade.fromRoute(
            new V3Route([pool_0_1, pool_1_WETH], token0, ETHER),
            amountIn,
            TradeType.EXACT_INPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('array of trades with mixedRoute produces same calldata', async () => {
            const trades = [await mixedRouteTrade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountIn,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountIn,
                },
              ],
              TradeType.EXACT_INPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('meta-trade with mixedRoute produces same calldata but in different order', async () => {
            const expectedCalldata =
              '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000005f00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104472b43f30000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004449404b7c00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000'
            const trades = await Trade.fromRoutes(
              [],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountIn,
                },
              ],
              TradeType.EXACT_INPUT,
              [
                {
                  mixedRoute: (await mixedRouteTrade).swaps[0].route,
                  amount: amountIn,
                },
              ]
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })
        })
      })

      describe('multi-hop exact output (v2 + v3)', () => {
        describe('different trade configurations result in identical calldata', () => {
          const expectedCalldata =
            '0x5ae401dc000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010442712a670000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006700000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012409b81346000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000690000000000000000000000000000000000000000000000000000000000000042c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb80000000000000000000000000000000000000002000bb8000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004449404b7c00000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000'
          const amountOut = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))

          const v2Trade = V2Trade.exactOut(new V2Route([pair_0_1, pair_1_WETH], token0, ETHER), amountOut)
          const v3Trade = V3Trade.fromRoute(
            new V3Route([pool_0_1, pool_1_WETH], token0, ETHER),
            amountOut,
            TradeType.EXACT_OUTPUT
          )

          it('array of trades', async () => {
            const trades = [v2Trade, await v3Trade]
            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })

          it('meta-trade', async () => {
            const trades = await Trade.fromRoutes(
              [
                {
                  routev2: v2Trade.route,
                  amount: amountOut,
                },
              ],
              [
                {
                  routev3: (await v3Trade).swaps[0].route,
                  amount: amountOut,
                },
              ],
              TradeType.EXACT_OUTPUT
            )

            const { calldata, value } = SwapRouter.swapCallParameters(trades, {
              slippageTolerance,
              recipient,
              deadlineOrPreviousBlockhash: deadline,
            })
            expect(calldata).toEqual(expectedCalldata)
            expect(value).toBe('0x00')
          })
        })
      })
    })

    describe('#swapAndAddCallParameters', () => {
      describe('single-hop trades', () => {
        const expectedCalldata =
          '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000003a00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000056000000000000000000000000000000000000000000000000000000000000005e000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c89c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000032c8ad00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010411ed56c9000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc4000000000000000000000000000000000000000000000000000000000000003c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10))
        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
        /// mirrors V2Trade
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)
        /// mixedRoute mirrors v3Trade
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )

        const position = new Position({
          pool: pool_0_1,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          recipient: '0x0000000000000000000000000000000000000006',
          slippageTolerance,
          deadline: 2 ** 32,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [v2Trade, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process when v2 + mixedRoute', async () => {
          const trades = [v2Trade, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process when mixedRoute + v3', async () => {
          const trades = [await mixedRouteTrade2, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('multi-hop trades', () => {
        const expectedCalldata =
          '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000003800000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000048000000000000000000000000000000000000000000000000000000000000005c000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000104472b43f30000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000005f00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000032c7eb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000032c8ad00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010411ed56c90000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000bb8ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc4000000000000000000000000000000000000000000000000000000000000003c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

        const pool_0_WETH = makePool(token0, WETH, liquidity)
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))
        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1, pair_1_WETH], token0, WETH), amountIn)
        /// mirrors V2Trade
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1, pair_1_WETH], token0, WETH),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const v3Trade = V3Trade.fromRoute(
          new V3Route([pool_0_1, pool_1_WETH], token0, WETH),
          amountIn,
          TradeType.EXACT_INPUT
        )
        /// mixedRoute mirrors v3Trade
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1, pool_1_WETH], token0, WETH),
          amountIn,
          TradeType.EXACT_INPUT
        )

        const position = new Position({
          pool: pool_0_WETH,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          recipient: '0x0000000000000000000000000000000000000006',
          slippageTolerance,
          deadline: 2 ** 32,
        }

        it('encodes the entire swap process for a multi route trade', async () => {
          const trades = [v2Trade, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('encodes the entire swap process for a multi route trade with v2, mixedRoute', async () => {
          const trades = [v2Trade, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('encodes the entire swap process for a multi route trade with mixedRoute, v3', async () => {
          const trades = [await mixedRouteTrade2, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('encodes the entire swap process for a multi route trade with mixedRoute, mixedRoute', async () => {
          const trades = [await mixedRouteTrade2, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('adding liquidity to an existing position', () => {
        const expectedCalldata =
          '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000003a000000000000000000000000000000000000000000000000000000000000004200000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000058000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c89c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000032c8ad0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4f100b20500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10))
        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )

        const position = new Position({
          pool: pool_0_1,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          slippageTolerance,
          deadline: 2 ** 32,
          tokenId: 1,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [v2Trade, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, v2, mixed', async () => {
          const trades = [v2Trade, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, mixed, v3', async () => {
          const trades = [await mixedRouteTrade2, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.NOT_REQUIRED,
            ApprovalTypes.NOT_REQUIRED
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('when MAX tokens must be approved to the NFT Manager', () => {
        const expectedCalldata =
          '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003e0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000004c000000000000000000000000000000000000000000000000000000000000005200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c89c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000032c8ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024571ac8b00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024571ac8b000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4f100b20500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10))
        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )

        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )

        const position = new Position({
          pool: pool_0_1,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          slippageTolerance,
          deadline: 2 ** 32,
          tokenId: 1,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [v2Trade, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, v2, mixed', async () => {
          const trades = [v2Trade, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, mixed, v3', async () => {
          const trades = [await mixedRouteTrade2, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, mixed, mixed', async () => {
          const trades = [await mixedRouteTrade2, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('when MAX_MINUS_ONE tokens must be approved to the NFT Manager', () => {
        const expectedCalldata =
          '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003e0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000004c000000000000000000000000000000000000000000000000000000000000005200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c89c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000032c8ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024cab372ce0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024cab372ce00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4f100b20500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10))
        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const position = new Position({
          pool: pool_0_1,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          slippageTolerance,
          deadline: 2 ** 32,
          tokenId: 1,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [v2Trade, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX_MINUS_ONE,
            ApprovalTypes.MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, v2, mixed', async () => {
          const trades = [v2Trade, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX_MINUS_ONE,
            ApprovalTypes.MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, mixed, v3', async () => {
          const trades = [await mixedRouteTrade2, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX_MINUS_ONE,
            ApprovalTypes.MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process, mixed, mixed', async () => {
          const trades = [await mixedRouteTrade2, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX_MINUS_ONE,
            ApprovalTypes.MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('when ZERO_THEN_MAX tokens must be approved to the NFT Manager', () => {
        const expectedCalldata =
          '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003e0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000004c000000000000000000000000000000000000000000000000000000000000005200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c89c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000032c8ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024639d71a90000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024639d71a900000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4f100b20500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10))
        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const position = new Position({
          pool: pool_0_1,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          slippageTolerance,
          deadline: 2 ** 32,
          tokenId: 1,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [v2Trade, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX,
            ApprovalTypes.ZERO_THEN_MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process v2, mixed', async () => {
          const trades = [v2Trade, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX,
            ApprovalTypes.ZERO_THEN_MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process mixed, v3', async () => {
          const trades = [await mixedRouteTrade2, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX,
            ApprovalTypes.ZERO_THEN_MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process mixed, mixed', async () => {
          const trades = [await mixedRouteTrade2, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX,
            ApprovalTypes.ZERO_THEN_MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('when ZERO_THEN_MAX_MINUS_ONE tokens must be approved to the NFT Manager', () => {
        const expectedCalldata =
          '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003e0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000004c000000000000000000000000000000000000000000000000000000000000005200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000000e4472b43f3000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c89c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000032c8ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024ab3fdd500000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024ab3fdd5000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4f100b20500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const amountIn = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10))
        const v2Trade = V2Trade.exactIn(new V2Route([pair_0_1], token0, token1), amountIn)
        const mixedRouteTrade2 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pair_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_0_1], token0, token1), amountIn, TradeType.EXACT_INPUT)
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_0_1], token0, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const position = new Position({
          pool: pool_0_1,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          slippageTolerance,
          deadline: 2 ** 32,
          tokenId: 1,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [v2Trade, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process v2, mixed', async () => {
          const trades = [v2Trade, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process mixed, v3', async () => {
          const trades = [await mixedRouteTrade2, await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process mixed, mixed', async () => {
          const trades = [await mixedRouteTrade2, await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE,
            ApprovalTypes.ZERO_THEN_MAX_MINUS_ONE
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('when input is native', () => {
        const expectedCalldata =
          '0xac9650d8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003c000000000000000000000000000000000000000000000000000000000000004a0000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c8a50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000241c58db4f000000000000000000000000000000000000000000000000000000000032c8ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024571ac8b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024571ac8b000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4f100b2050000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024496169970000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

        const ETH = Ether.onChain(1)
        const amountIn = CurrencyAmount.fromRawAmount(ETH, JSBI.BigInt(10))
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_1_WETH], ETH, token1), amountIn, TradeType.EXACT_INPUT)
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_1_WETH], ETH, token1),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const position = new Position({
          pool: pool_1_WETH,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          slippageTolerance,
          deadline: 2 ** 32,
          tokenId: 1,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process when is a mixedRoute', async () => {
          const trades = [await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })

      describe('when output is native', () => {
        const expectedCalldata =
          '0xac9650d8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003c000000000000000000000000000000000000000000000000000000000000004a0000000000000000000000000000000000000000000000000000000000000052000000000000000000000000000000000000000000000000000000000000000e404e45aaf0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000241c58db4f000000000000000000000000000000000000000000000000000000000032c8a5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044f2d5d56b0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000032c8ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024571ac8b00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024571ac8b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4f100b2050000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044e90a182f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002449616997000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        const ETH = Ether.onChain(1)
        const amountIn = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(10))
        const v3Trade = V3Trade.fromRoute(new V3Route([pool_1_WETH], token1, ETH), amountIn, TradeType.EXACT_INPUT)
        const mixedRouteTrade3 = MixedRouteTrade.fromRoute(
          new MixedRouteSDK([pool_1_WETH], token1, ETH),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const position = new Position({
          pool: pool_1_WETH,
          tickLower: -60,
          tickUpper: 60,
          liquidity: 1111111111,
        })
        const addLiquidityOptions = {
          slippageTolerance,
          deadline: 2 ** 32,
          tokenId: 1,
        }

        it('correctly encodes the entire swap process', async () => {
          const trades = [await v3Trade]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })

        it('correctly encodes the entire swap process when is mixedRoute', async () => {
          const trades = [await mixedRouteTrade3]
          const methodParameters = SwapRouter.swapAndAddCallParameters(
            trades,
            { slippageTolerance },
            position,
            addLiquidityOptions,
            ApprovalTypes.MAX,
            ApprovalTypes.MAX
          )
          expect(methodParameters.calldata).toEqual(expectedCalldata)
        })
      })
    })
  })
})
