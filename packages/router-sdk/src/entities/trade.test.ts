import { sqrt, Token, CurrencyAmount, TradeType, WETH9, Ether, Percent, Price } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { MixedRoute, RouteV2, RouteV3 } from './route'
import { Trade } from './trade'
import {
  Route as V3RouteSDK,
  FeeAmount,
  TICK_SPACINGS,
  Pool,
  TickMath,
  nearestUsableTick,
  encodeSqrtRatioX96,
} from '@uniswap/v3-sdk'
import { Pair, Route as V2RouteSDK } from '@teleswap/v2-sdk'
import { MixedRouteSDK } from './mixedRoute/route'

describe('Trade', () => {
  const ETHER = Ether.onChain(1)
  const weth = WETH9[1]
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

  const pool_1_2 = v2StylePool(
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(12000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(10000))
  )

  const pool_0_3 = v2StylePool(
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
    CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(10000))
  )

  const pair_0_1 = new Pair(
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(12000)),
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(12000))
  )
  const pair_1_2 = new Pair(
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(12000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(10000))
  )
  const pair_0_2 = new Pair(
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(12000))
  )
  const pair_2_3 = new Pair(
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(10000)),
    CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(10000))
  )

  const pair_weth_0 = new Pair(
    CurrencyAmount.fromRawAmount(weth, JSBI.BigInt(10000)),
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000))
  )
  const pair_weth_1 = new Pair(
    CurrencyAmount.fromRawAmount(weth, JSBI.BigInt(10000)),
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(10000))
  )
  const pair_weth_2 = new Pair(
    CurrencyAmount.fromRawAmount(weth, JSBI.BigInt(10000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(10000))
  )

  const pool_weth_0 = v2StylePool(
    CurrencyAmount.fromRawAmount(weth, JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100000))
  )

  const pool_weth_2 = v2StylePool(
    CurrencyAmount.fromRawAmount(weth, JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100000))
  )

  const pool_weth_1 = v2StylePool(
    CurrencyAmount.fromRawAmount(weth, JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100000))
  )

  describe('#fromRoute', () => {
    it('can contain only a v3 route', async () => {
      const routeOriginal = new V3RouteSDK([pool_0_1], token0, token1)
      const route = new RouteV3(routeOriginal)

      const amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))
      const tradeType = TradeType.EXACT_INPUT
      const expectedOut = await pool_0_1.getOutputAmount(amount)

      const trade = await Trade.fromRoute(route, amount, tradeType)
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(token1)
      expect(trade.inputAmount).toEqual(amount)
      expect(trade.outputAmount).toEqual(expectedOut[0])
      expect(trade.swaps.length).toEqual(1)
      expect(trade.routes.length).toEqual(1)
      expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    })

    it('can contain only a v2 route', async () => {
      const routeOriginal = new V2RouteSDK([pair_0_1], token0, token1)
      const route = new RouteV2(routeOriginal)

      const amount = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000))
      const tradeType = TradeType.EXACT_OUTPUT
      const expectedIn = pair_0_1.getInputAmount(amount)[0]

      const trade = await Trade.fromRoute(route, amount, tradeType)
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(token1)
      expect(trade.outputAmount).toEqual(amount)
      expect(trade.inputAmount).toEqual(expectedIn)
      expect(trade.swaps.length).toEqual(1)
      expect(trade.routes.length).toEqual(1)
      expect(trade.tradeType).toEqual(TradeType.EXACT_OUTPUT)
    })

    it('can contain only a mixed route', async () => {
      const routeOriginal = new MixedRouteSDK([pool_0_1], token0, token1)
      const route = new MixedRoute(routeOriginal)

      const amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))
      const tradeType = TradeType.EXACT_INPUT
      const expectedOut = await pool_0_1.getOutputAmount(amount)

      const trade = await Trade.fromRoute(route, amount, tradeType)
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(token1)
      expect(trade.inputAmount).toEqual(amount)
      expect(trade.outputAmount).toEqual(expectedOut[0])
      expect(trade.swaps.length).toEqual(1)
      expect(trade.routes.length).toEqual(1)
      expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    })

    it('can be constructed with ETHER as input for a V3 Route exact input swap', async () => {
      const routeOriginal = new V3RouteSDK([pool_weth_0], ETHER, token0)
      const route = new RouteV3(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(10))

      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_INPUT)
      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token0)
    })

    it('can be constructed with ETHER as input for a V3 Route exact output swap', async () => {
      const routeOriginal = new V3RouteSDK([pool_weth_0], ETHER, token0)
      const route = new RouteV3(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_OUTPUT)
      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token0)
    })

    it('can be constructed with ETHER as output for a V3 Route exact output swap', async () => {
      const routeOriginal = new V3RouteSDK([pool_weth_0], token0, ETHER)
      const route = new RouteV3(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))
      const expectedIn = await pool_weth_0.getInputAmount(amount.wrapped)
      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_OUTPUT)
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount).toEqual(amount)
      expect(trade.inputAmount).toEqual(expectedIn[0])
    })

    it('can be constructed with ETHER as output for a V3 Route exact input swap', async () => {
      const routeOriginal = new V3RouteSDK([pool_weth_0], token0, ETHER)
      const route = new RouteV3(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))
      const expectedOut = await pool_weth_0.getOutputAmount(amount)
      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_INPUT)
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ETHER)
      expect(trade.inputAmount).toEqual(amount)
      expect(trade.outputAmount.wrapped).toEqual(expectedOut[0])
    })

    it('can be constructed with ETHER as input for a V2 Route exact input swap', async () => {
      const routeOriginal = new V2RouteSDK([pair_weth_2], ETHER, token2)
      const route = new RouteV2(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(10))

      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_INPUT)
      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token2)
    })

    it('can be constructed with ETHER as input for a V2 Route exact output swap', async () => {
      const routeOriginal = new V2RouteSDK([pair_weth_2], ETHER, token2)
      const route = new RouteV2(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100))

      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_OUTPUT)
      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token2)
    })

    it('can be constructed with ETHER as output for a V2 Route exact output swap', async () => {
      const routeOriginal = new V2RouteSDK([pair_weth_2], token2, ETHER)
      const route = new RouteV2(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))

      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_OUTPUT)
      expect(trade.inputAmount.currency).toEqual(token2)
      expect(trade.outputAmount.currency).toEqual(ETHER)
    })

    it('can be constructed with ETHER as output for a V2 Route exact input swap', async () => {
      const routeOriginal = new V2RouteSDK([pair_weth_2], token2, ETHER)
      const route = new RouteV2(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100))

      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_INPUT)
      expect(trade.inputAmount.currency).toEqual(token2)
      expect(trade.outputAmount.currency).toEqual(ETHER)
    })

    it('can be constructed with ETHER as input for a Mixed Route exact input swap', async () => {
      const routeOriginal = new MixedRouteSDK([pool_weth_0], ETHER, token0)
      const route = new MixedRoute(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(10))

      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_INPUT)
      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token0)
    })

    it('can be constructed with ETHER as output for a Mixed Route exact input swap', async () => {
      const routeOriginal = new MixedRouteSDK([pool_weth_0], token0, ETHER)
      const route = new MixedRoute(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))
      const expectedOut = await pool_weth_0.getOutputAmount(amount)
      const trade = await Trade.fromRoute(route, amount, TradeType.EXACT_INPUT)
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ETHER)
      expect(trade.inputAmount).toEqual(amount)
      expect(trade.outputAmount.wrapped).toEqual(expectedOut[0])
    })

    it('throws if input currency does not match for V2 Route', async () => {
      const routeOriginal = new V2RouteSDK([pair_weth_2], token2, ETHER)
      const route = new RouteV2(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      await expect(Trade.fromRoute(route, amount, TradeType.EXACT_INPUT)).rejects.toThrow('INPUT')
    })

    it('throws if output currency does not match for V2 Route', async () => {
      const routeOriginal = new V2RouteSDK([pair_0_1], token0, token1)
      const route = new RouteV2(routeOriginal)
      const amount = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      await expect(Trade.fromRoute(route, amount, TradeType.EXACT_OUTPUT)).rejects.toThrow('OUTPUT')
    })

    it('throws if input currency does not match for V3 route', async () => {
      const routeOriginal = new V3RouteSDK([pool_0_1], token0, token1)
      const route = new RouteV3(routeOriginal)

      const amount = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1000))
      const tradeType = TradeType.EXACT_INPUT

      await expect(Trade.fromRoute(route, amount, tradeType)).rejects.toThrow('INPUT')
    })

    it('throws if output currency does not match for V3 route', async () => {
      const routeOriginal = new V3RouteSDK([pool_0_1], token0, token1)
      const route = new RouteV3(routeOriginal)

      const amount = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1000))
      const tradeType = TradeType.EXACT_OUTPUT
      await expect(Trade.fromRoute(route, amount, tradeType)).rejects.toThrow('OUTPUT')
    })

    it('throws if input currency does not match for Mixed route', async () => {
      const routeOriginal = new MixedRouteSDK([pool_0_1], token0, token1)
      const route = new MixedRoute(routeOriginal)

      const amount = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1000))
      const tradeType = TradeType.EXACT_INPUT

      await expect(Trade.fromRoute(route, amount, tradeType)).rejects.toThrow('INPUT')
    })
  })

  describe('#fromRoutes', () => {
    it('can contain both a v2 and a v3 route', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const amountIn = amountv2.add(amountv3)

      const outv2 = pair_1_2.getOutputAmount(pair_0_1.getOutputAmount(amountv2)[0])[0]
      const out1v3 = await pool_0_1.getOutputAmount(amountv3)
      const out2v3 = await pool_1_2.getOutputAmount(out1v3[0])

      const expectedOut = outv2.add(out2v3[0])

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_INPUT
      )

      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(token2)
      expect(trade.inputAmount).toEqual(amountIn)
      expect(trade.outputAmount).toEqual(expectedOut)
      expect(trade.swaps.length).toEqual(2)
      expect(trade.routes.length).toEqual(2)
      expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    })

    it('can contain a v2, a v3, and a mixed route', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const mixedRouteOriginal = new MixedRouteSDK([pool_weth_0, pair_weth_2], token0, token2)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const amountIn = amountv2.add(amountv3).add(amountMixedRoute)

      const outv2 = pair_1_2.getOutputAmount(pair_0_1.getOutputAmount(amountv2)[0])[0]
      const out1v3 = await pool_0_1.getOutputAmount(amountv3)
      const out2v3 = await pool_1_2.getOutputAmount(out1v3[0])
      const out1mixed = await pool_weth_0.getOutputAmount(amountMixedRoute)
      const out2mixed = pair_weth_2.getOutputAmount(out1mixed[0])[0]

      const expectedOut = outv2.add(out2v3[0]).add(out2mixed)

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_INPUT,
        [{ mixedRoute, amount: amountMixedRoute }]
      )

      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(token2)
      expect(trade.inputAmount).toEqual(amountIn)
      expect(trade.outputAmount).toEqual(expectedOut)
      expect(trade.swaps.length).toEqual(3)
      expect(trade.routes.length).toEqual(3)
      expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    })

    it('can contain multiple v2, v3, and mixed routes', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const mixedRouteOriginal = new MixedRouteSDK([pool_weth_0, pair_weth_2], token0, token2)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const mixedRoute2Original = new MixedRouteSDK([pool_0_3, pair_2_3], token0, token2)
      const mixedRoute2 = new MixedRoute(mixedRoute2Original)
      const amountMixedRoute2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const amountIn = amountv2.add(amountv3).add(amountMixedRoute).add(amountMixedRoute2)

      const outv2 = pair_1_2.getOutputAmount(pair_0_1.getOutputAmount(amountv2)[0])[0]
      const out1v3 = await pool_0_1.getOutputAmount(amountv3)
      const out2v3 = await pool_1_2.getOutputAmount(out1v3[0])
      const out1mixed = await pool_weth_0.getOutputAmount(amountMixedRoute)
      const out2mixed = pair_weth_2.getOutputAmount(out1mixed[0])[0]
      const out1mixed2 = await pool_0_3.getOutputAmount(amountMixedRoute2)
      const out2mixed2 = pair_2_3.getOutputAmount(out1mixed2[0])[0]

      const expectedOut = outv2.add(out2v3[0]).add(out2mixed).add(out2mixed2)

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_INPUT,
        [
          { mixedRoute, amount: amountMixedRoute },
          { mixedRoute: mixedRoute2, amount: amountMixedRoute2 },
        ]
      )

      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(token2)
      expect(trade.inputAmount).toEqual(amountIn)
      expect(trade.outputAmount).toEqual(expectedOut)
      expect(trade.swaps.length).toEqual(4)
      expect(trade.routes.length).toEqual(4)
      expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    })

    it('can contain muliptle v2 and v3 routes', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100))

      const route2OriginalV2 = new V2RouteSDK([pair_weth_0, pair_weth_2], token0, token2)
      const route2v2 = new RouteV2(route2OriginalV2)
      const amount2v2 = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1000))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1000))

      const route2OriginalV3 = new V3RouteSDK([pool_weth_0, pool_weth_2], token0, token2)
      const route2v3 = new RouteV3(route2OriginalV3)
      const amount2v3 = CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1000))

      const amountOutExpected = amountv2.add(amount2v2).add(amountv3).add(amount2v3)

      // calculate expected amount in across v2
      const amountIn1v2 = pair_0_1.getInputAmount(pair_1_2.getInputAmount(amountv2)[0])
      const amountIn2v2 = pair_weth_0.getInputAmount(pair_weth_2.getInputAmount(amount2v2)[0])
      // calculate expected amount in across v3
      const amountIn1v3 = await pool_1_2.getInputAmount(amountv3)
      const amountIn2v3 = await pool_0_1.getInputAmount(amountIn1v3[0])
      const amountIn3v3 = await pool_weth_2.getInputAmount(amount2v3)
      const amountIn4v3 = await pool_weth_0.getInputAmount(amountIn3v3[0])
      // calculate total expected amount in
      const expectedIn = amountIn1v2[0].add(amountIn2v2[0]).add(amountIn2v3[0]).add(amountIn4v3[0])

      const trade = await Trade.fromRoutes(
        [
          { routev2, amount: amountv2 },
          { routev2: route2v2, amount: amount2v2 },
        ],
        [
          { routev3, amount: amountv3 },
          { routev3: route2v3, amount: amount2v3 },
        ],
        TradeType.EXACT_OUTPUT
      )

      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(token2)
      expect(trade.outputAmount).toEqual(amountOutExpected)
      expect(trade.inputAmount).toEqual(expectedIn)
      expect(trade.swaps.length).toEqual(4)
      expect(trade.routes.length).toEqual(4)
      expect(trade.tradeType).toEqual(TradeType.EXACT_OUTPUT)
      expect(trade.routes[0].path).toEqual([token0, token1, token2])
      expect(trade.routes[1].path).toEqual([token0, weth, token2])
      expect(trade.routes[2].path).toEqual([token0, token1, token2])
      expect(trade.routes[3].path).toEqual([token0, weth, token2])
    })

    it('can be constructed with ETHER as input for exact input', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_weth_0, pair_0_1], ETHER, token1)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_weth_0, pool_0_1], ETHER, token1)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(1000))

      const mixedRouteOriginal = new MixedRouteSDK([pool_weth_2, pair_1_2], ETHER, token1)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(1000))

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_INPUT,
        [{ mixedRoute, amount: amountMixedRoute }]
      )

      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token1)
      expect(trade.swaps.length).toEqual(3)
      expect(trade.routes.length).toEqual(3)
      expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    })

    it('can be constructed with ETHER as input for exact output', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_weth_0, pair_0_1], ETHER, token1)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_weth_0, pool_0_1], ETHER, token1)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000))

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_OUTPUT
      )

      expect(trade.inputAmount.currency).toEqual(ETHER)
      expect(trade.outputAmount.currency).toEqual(token1)
      expect(trade.swaps.length).toEqual(2)
      expect(trade.routes.length).toEqual(2)
      expect(trade.tradeType).toEqual(TradeType.EXACT_OUTPUT)
    })

    it('can be constructed with ETHER as output for exact output swap', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_weth_0], token1, ETHER)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_weth_0], token1, ETHER)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(ETHER, JSBI.BigInt(1000))

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_OUTPUT
      )

      expect(trade.inputAmount.currency).toEqual(token1)
      expect(trade.outputAmount.currency).toEqual(ETHER)
      expect(trade.swaps.length).toEqual(2)
      expect(trade.routes.length).toEqual(2)
      expect(trade.tradeType).toEqual(TradeType.EXACT_OUTPUT)
    })

    it('can be constructed with ETHER as output for exact input swap', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_weth_0], token1, ETHER)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_weth_0], token1, ETHER)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000))

      const mixedRouteOriginal = new MixedRouteSDK([pair_1_2, pool_weth_2], token1, ETHER)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000))

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_INPUT,
        [{ mixedRoute, amount: amountMixedRoute }]
      )

      expect(trade.inputAmount.currency).toEqual(token1)
      expect(trade.outputAmount.currency).toEqual(ETHER)
      expect(trade.swaps.length).toEqual(3)
      expect(trade.routes.length).toEqual(3)
      expect(trade.tradeType).toEqual(TradeType.EXACT_INPUT)
    })

    it('throws if pools are re-used between V3 routes', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      //duplicate pool
      const route2OriginalV3 = new V3RouteSDK([pool_0_1, pool_weth_1, pool_weth_2], token0, token2)
      const route2v3 = new RouteV3(route2OriginalV3)
      const amount2v3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes(
          [{ routev2, amount: amountv2 }],
          [
            { routev3, amount: amountv3 },
            { routev3: route2v3, amount: amount2v3 },
          ],
          TradeType.EXACT_INPUT
        )
      ).rejects.toThrow('POOLS_DUPLICATED')
    })

    it('throws if pools are re-used between V2 routes', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const route2OriginalV2 = new V2RouteSDK([pair_0_1, pair_weth_1, pair_weth_2], token0, token2)
      const route2v2 = new RouteV2(route2OriginalV2)
      const amount2v2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes(
          [
            { routev2, amount: amountv2 },
            { routev2: route2v2, amount: amount2v2 },
          ],
          [{ routev3, amount: amountv3 }],
          TradeType.EXACT_INPUT
        )
      ).rejects.toThrow('POOLS_DUPLICATED')
    })

    it('throws if pools are re-used between mixed routes and v2 routes', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      // mixed route which will use v2 pair again
      const mixedRouteOriginal = new MixedRouteSDK([pair_0_1, pool_weth_1, pool_weth_2], token0, token2)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes([{ routev2, amount: amountv2 }], [{ routev3, amount: amountv3 }], TradeType.EXACT_INPUT, [
          { mixedRoute, amount: amountMixedRoute },
        ])
      ).rejects.toThrow('POOLS_DUPLICATED')
    })

    it('throws if pools are re-used between mixed routes and v3 routes', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1, pair_1_2], token0, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      // mixed route which will use v3 pair again
      const mixedRouteOriginal = new MixedRouteSDK([pool_0_1, pair_weth_1, pool_weth_2], token0, token2)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes([{ routev2, amount: amountv2 }], [{ routev3, amount: amountv3 }], TradeType.EXACT_INPUT, [
          { mixedRoute, amount: amountMixedRoute },
        ])
      ).rejects.toThrow('POOLS_DUPLICATED')
    })

    it('throws if routes have different inputs', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_1_2], token1, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes([{ routev2, amount: amountv2 }], [{ routev3, amount: amountv3 }], TradeType.EXACT_INPUT)
      ).rejects.toThrow('INPUT_CURRENCY_MATCH')
    })

    it('throws if routes have different inputs mixedRoute', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_1_2], token1, token2)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

      const mixedRouteOriginal = new MixedRouteSDK([pair_0_1, pool_1_2], token0, token2)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes([{ routev2, amount: amountv2 }], [], TradeType.EXACT_INPUT, [
          { mixedRoute, amount: amountMixedRoute },
        ])
      ).rejects.toThrow('INPUT_CURRENCY_MATCH')
    })

    it('throws if routes have different outputs', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1], token0, token1)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes([{ routev2, amount: amountv2 }], [{ routev3, amount: amountv3 }], TradeType.EXACT_INPUT)
      ).rejects.toThrow('OUTPUT_CURRENCY_MATCH')
    })

    it('throws if routes have different outputs mixedRoutes', async () => {
      const routeOriginalV3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      const mixedRouteOriginal = new MixedRouteSDK([pair_0_1, pool_weth_1], token0, weth)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixedRoute = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes([], [{ routev3, amount: amountv3 }], TradeType.EXACT_INPUT, [
          { mixedRoute, amount: amountMixedRoute },
        ])
      ).rejects.toThrow('OUTPUT_CURRENCY_MATCH')
    })

    it('throws if trade is created with EXACT_OUTPUT and contains mixedRoutes', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_weth_0, pair_0_1], ETHER, token1)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

      const mixedRouteOriginal = new MixedRouteSDK([pool_weth_0, pool_0_1], ETHER, token1)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const mixedRouteAmount = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(1000))

      await expect(
        Trade.fromRoutes([{ routev2, amount: amountv2 }], [], TradeType.EXACT_OUTPUT, [
          { mixedRoute, amount: mixedRouteAmount },
        ])
      ).rejects.toThrow('TRADE_TYPE')
    })
  })

  describe('#worstExecutionPrice', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const routev3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const route2v3 = new V3RouteSDK([pool_0_2], token0, token2)

      const mixedRoute = new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2)
      const mixedRoute2 = new MixedRouteSDK([pool_0_2], token0, token2)

      const inputAmount = CurrencyAmount.fromRawAmount(token0, 100)
      const outputAmount = CurrencyAmount.fromRawAmount(token2, 69)
      const tradeType = TradeType.EXACT_INPUT

      const exactInV3 = new Trade({
        v2Routes: [],
        v3Routes: [{ routev3, inputAmount, outputAmount }],
        tradeType,
      })

      const exactInMixed = new Trade({
        v2Routes: [],
        v3Routes: [],
        tradeType,
        mixedRoutes: [{ mixedRoute, inputAmount, outputAmount }],
      })

      const exactInMultiRoute = new Trade({
        v2Routes: [],
        v3Routes: [
          {
            routev3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 35),
          },
          {
            routev3: route2v3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 34),
          },
        ],
        tradeType: TradeType.EXACT_INPUT,
      })

      const exactInMultiMixedRoute = new Trade({
        v2Routes: [],
        v3Routes: [],
        tradeType: TradeType.EXACT_INPUT,
        mixedRoutes: [
          {
            mixedRoute,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 35),
          },
          {
            mixedRoute: mixedRoute2,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 34),
          },
        ],
      })

      it('throws if less than 0', () => {
        expect(() => exactInV3.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
        expect(() => exactInMixed.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', () => {
        expect(exactInV3.worstExecutionPrice(new Percent(0, 100))).toEqual(exactInV3.executionPrice)
        expect(exactInMixed.worstExecutionPrice(new Percent(0, 100))).toEqual(exactInV3.executionPrice)
      })
      it('returns exact if nonzero', () => {
        expect(exactInV3.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
        expect(exactInV3.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
        expect(exactInV3.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
        expect(exactInMixed.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
        expect(exactInMixed.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
        expect(exactInMixed.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
      })
      it('returns exact if nonzero with multiple routes', () => {
        expect(exactInMultiRoute.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
        expect(exactInMultiRoute.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
        expect(exactInMultiRoute.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
        expect(exactInMultiMixedRoute.worstExecutionPrice(new Percent(0, 100))).toEqual(
          new Price(token0, token2, 100, 69)
        )
        expect(exactInMultiMixedRoute.worstExecutionPrice(new Percent(5, 100))).toEqual(
          new Price(token0, token2, 100, 65)
        )
        expect(exactInMultiMixedRoute.worstExecutionPrice(new Percent(200, 100))).toEqual(
          new Price(token0, token2, 100, 23)
        )
      })
    })

    describe('tradeType = EXACT_OUTPUT', () => {
      const routev3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const route2v3 = new V3RouteSDK([pool_0_2], token0, token2)

      const exactOut = new Trade({
        v2Routes: [],
        v3Routes: [
          {
            routev3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 156),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
        ],
        tradeType: TradeType.EXACT_OUTPUT,
      })

      const exactOutMultiRoute = new Trade({
        v2Routes: [],
        v3Routes: [
          {
            routev3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 78),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 50),
          },
          {
            routev3: route2v3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 78),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 50),
          },
        ],
        tradeType: TradeType.EXACT_OUTPUT,
      })

      it('throws if less than 0', () => {
        expect(() => exactOut.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(exactOut.executionPrice)
      })
      it('returns slippage amount if nonzero', () => {
        expect(
          exactOut.worstExecutionPrice(new Percent(0, 100)).equalTo(new Price(token0, token2, 156, 100))
        ).toBeTruthy()
        expect(
          exactOut.worstExecutionPrice(new Percent(5, 100)).equalTo(new Price(token0, token2, 163, 100))
        ).toBeTruthy()
        expect(
          exactOut.worstExecutionPrice(new Percent(200, 100)).equalTo(new Price(token0, token2, 468, 100))
        ).toBeTruthy()
      })
      it('returns exact if nonzero with multiple routes', () => {
        expect(
          exactOutMultiRoute.worstExecutionPrice(new Percent(0, 100)).equalTo(new Price(token0, token2, 156, 100))
        ).toBeTruthy()
        expect(
          exactOutMultiRoute.worstExecutionPrice(new Percent(5, 100)).equalTo(new Price(token0, token2, 163, 100))
        ).toBeTruthy()
        expect(
          exactOutMultiRoute.worstExecutionPrice(new Percent(200, 100)).equalTo(new Price(token0, token2, 468, 100))
        ).toBeTruthy()
      })
    })

    describe('worst execution price across v2 and v3 trades exact input', () => {
      const routev3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev2 = new V2RouteSDK([pair_0_2], token0, token2)
      const mixedRoute = new MixedRouteSDK([pool_weth_0, pair_weth_2], token0, token2)
      const exactIn = new Trade({
        v2Routes: [
          {
            routev2,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
        ],
        v3Routes: [
          {
            routev3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 156),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
        ],
        tradeType: TradeType.EXACT_INPUT,
        mixedRoutes: [
          {
            mixedRoute,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 94),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 50),
          },
        ],
      })
      it('throws if less than 0', () => {
        expect(() => exactIn.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice)
      })
      it('returns exact if nonzero', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 350, 250))
        expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 350, 238))
        expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 350, 83))
      })
    })

    describe('worst execution price across only mixedRoute trades exact input', () => {
      const mixedRoute = new MixedRouteSDK([pool_weth_0, pair_weth_2], token0, token2)
      const mixedRoute2 = new MixedRouteSDK([pair_0_1, pool_weth_1, pool_weth_2], token0, token2)
      const exactIn = new Trade({
        v2Routes: [],
        v3Routes: [],
        tradeType: TradeType.EXACT_INPUT,
        mixedRoutes: [
          {
            mixedRoute,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
          {
            mixedRoute: mixedRoute2,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 156),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
        ],
      })
      it('throws if less than 0', () => {
        expect(() => exactIn.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice)
      })
      it('returns exact if nonzero', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 256, 200))
        expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 256, 190))
        expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 256, 66))
      })
    })

    describe('worst execution price across v2 and v3 trades exact output', () => {
      const routev3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const routev2 = new V2RouteSDK([pair_0_2], token0, token2)
      const exactOut = new Trade({
        v2Routes: [
          {
            routev2,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
        ],
        v3Routes: [
          {
            routev3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 156),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
        ],
        tradeType: TradeType.EXACT_OUTPUT,
      })
      it('throws if less than 0', () => {
        expect(() => exactOut.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(exactOut.executionPrice)
      })
      it('returns exact if nonzero', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 256, 200))
        expect(exactOut.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 268, 200))
        expect(exactOut.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 768, 200))
      })
    })
  })

  describe('#minimumAmountOut', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const routev3 = new V3RouteSDK([pool_0_1], token0, token1)
      const routev2 = new V2RouteSDK([pair_0_1], token0, token1)
      const mixedRoute = new MixedRouteSDK([pair_0_2, pool_1_2], token0, token1)

      const inputAmount = CurrencyAmount.fromRawAmount(token0, 100)
      const outputAmount = CurrencyAmount.fromRawAmount(token1, 100)
      const tradeType = TradeType.EXACT_INPUT

      const trade = new Trade({
        v2Routes: [{ routev2, inputAmount, outputAmount }],
        v3Routes: [{ routev3, inputAmount, outputAmount }],
        tradeType,
        mixedRoutes: [{ mixedRoute, inputAmount, outputAmount }],
      })

      it('throws if less than 0', () => {
        expect(() => trade.minimumAmountOut(new Percent(JSBI.BigInt(-1), 100))).toThrow('SLIPPAGE_TOLERANCE')
      })

      it('returns exact if 0', () => {
        expect(trade.minimumAmountOut(new Percent(JSBI.BigInt(0), 100))).toEqual(trade.outputAmount)
      })

      it('returns exact if nonzero', () => {
        expect(trade.minimumAmountOut(new Percent(JSBI.BigInt(5), 100))).toEqual(
          CurrencyAmount.fromRawAmount(token1, 285) // 300 * 0.95
        )
        expect(trade.minimumAmountOut(new Percent(JSBI.BigInt(200), 100))).toEqual(
          CurrencyAmount.fromRawAmount(token1, 100)
        )
      })

      describe('tradeType = EXACT_OUTPUT', () => {
        const routev3 = new V3RouteSDK([pool_0_1], token0, token1)
        const routev2 = new V2RouteSDK([pair_0_1], token0, token1)

        const inputAmount = CurrencyAmount.fromRawAmount(token0, 100)
        const outputAmount = CurrencyAmount.fromRawAmount(token1, 100)
        const tradeType = TradeType.EXACT_OUTPUT

        const trade = new Trade({
          v2Routes: [{ routev2, inputAmount, outputAmount }],
          v3Routes: [{ routev3, inputAmount, outputAmount }],
          tradeType,
        })

        it('throws if less than 0', () => {
          expect(() => trade.minimumAmountOut(new Percent(JSBI.BigInt(-1), 100))).toThrow('SLIPPAGE_TOLERANCE')
        })

        it('returns exact if 0', () => {
          expect(trade.minimumAmountOut(new Percent(JSBI.BigInt(0), 100))).toEqual(trade.outputAmount)
        })

        it('returns exact if nonzero', () => {
          expect(trade.minimumAmountOut(new Percent(JSBI.BigInt(5), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token1, 200)
          )
        })
      })
    })
  })

  describe('#maximumAmountIn', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const routev3 = new V3RouteSDK([pool_0_1], token0, token1)
      const routev2 = new V2RouteSDK([pair_0_1], token0, token1)
      const mixedRoute = new MixedRouteSDK([pair_0_2, pool_1_2], token0, token1)

      const inputAmount = CurrencyAmount.fromRawAmount(token0, 100)
      const outputAmount = CurrencyAmount.fromRawAmount(token1, 100)
      const tradeType = TradeType.EXACT_INPUT

      const trade = new Trade({
        v2Routes: [{ routev2, inputAmount, outputAmount }],
        v3Routes: [{ routev3, inputAmount, outputAmount }],
        tradeType,
        mixedRoutes: [{ mixedRoute, inputAmount, outputAmount }],
      })

      it('throws if less than 0', () => {
        expect(() => trade.maximumAmountIn(new Percent(JSBI.BigInt(-1), 100))).toThrow('SLIPPAGE_TOLERANCE')
      })

      it('returns exact if 0', () => {
        expect(trade.maximumAmountIn(new Percent(JSBI.BigInt(0), 100))).toEqual(trade.inputAmount)
      })

      it('returns exact if nonzero', () => {
        expect(trade.maximumAmountIn(new Percent(JSBI.BigInt(5), 100))).toEqual(
          CurrencyAmount.fromRawAmount(token0, 300)
        )
      })

      describe('tradeType = EXACT_OUTPUT', () => {
        const routev3 = new V3RouteSDK([pool_0_1], token0, token1)
        const routev2 = new V2RouteSDK([pair_0_1], token0, token1)

        const inputAmount = CurrencyAmount.fromRawAmount(token0, 100)
        const outputAmount = CurrencyAmount.fromRawAmount(token1, 100)
        const tradeType = TradeType.EXACT_OUTPUT

        const trade = new Trade({
          v2Routes: [{ routev2, inputAmount, outputAmount }],
          v3Routes: [{ routev3, inputAmount, outputAmount }],
          tradeType,
        })

        it('throws if less than 0', () => {
          expect(() => trade.maximumAmountIn(new Percent(JSBI.BigInt(-1), 100))).toThrow('SLIPPAGE_TOLERANCE')
        })

        it('returns exact if 0', () => {
          expect(trade.maximumAmountIn(new Percent(JSBI.BigInt(0), 100))).toEqual(trade.inputAmount)
        })

        it('returns exact if nonzero', () => {
          expect(trade.maximumAmountIn(new Percent(JSBI.BigInt(5), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token0, 210)
          )
          expect(trade.maximumAmountIn(new Percent(JSBI.BigInt(200), 100))).toEqual(
            CurrencyAmount.fromRawAmount(token0, 600)
          )
        })
      })
    })
  })
  // v3 sdk price impact tests
  describe('#priceImpact', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const routev3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const mixedRoute = new MixedRouteSDK([pool_0_1, pool_1_2], token0, token2)

      const trade = new Trade({
        v2Routes: [],
        v3Routes: [
          {
            routev3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
          },
        ],
        tradeType: TradeType.EXACT_INPUT,
      })

      const mixedTrade = new Trade({
        v2Routes: [],
        v3Routes: [],
        tradeType: TradeType.EXACT_INPUT,
        mixedRoutes: [
          {
            mixedRoute,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
          },
        ],
      })

      it('is cached', () => {
        expect(trade.priceImpact === trade.priceImpact).toStrictEqual(true)
        expect(mixedTrade.priceImpact.equalTo(trade.priceImpact)).toBe(true)
      })
      it('is correct', () => {
        expect(trade.priceImpact.toSignificant(3)).toEqual('17.2')
        expect(mixedTrade.priceImpact.toSignificant(3)).toEqual(trade.priceImpact.toSignificant(3))
      })
    })

    describe('tradeType = EXACT_OUTPUT', () => {
      const routev3 = new V3RouteSDK([pool_0_1, pool_1_2], token0, token2)
      const exactOut = new Trade({
        v2Routes: [],
        v3Routes: [
          {
            routev3,
            inputAmount: CurrencyAmount.fromRawAmount(token0, 156),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
          },
        ],
        tradeType: TradeType.EXACT_OUTPUT,
      })

      it('is cached', () => {
        expect(exactOut.priceImpact === exactOut.priceImpact).toStrictEqual(true)
      })
      it('is correct', () => {
        expect(exactOut.priceImpact.toSignificant(3)).toEqual('23.1')
      })
    })
  })

  describe('#executionPrice', () => {
    it('is correct for tradeType = EXACT_INPUT', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1], token0, token1)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1], token0, token1)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const mixedRouteOriginal = new MixedRouteSDK([pair_weth_0, pool_weth_1], token0, token1)
      const mixedRoute = new MixedRoute(mixedRouteOriginal)
      const amountMixed = CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100))

      const expectedOutV3 = await pool_0_1.getOutputAmount(amountv3)
      const expectedOutMixed = await pool_weth_1.getOutputAmount((await pair_weth_0.getOutputAmount(amountMixed))[0])
      const expectedOut = expectedOutV3[0].add(pair_0_1.getOutputAmount(amountv2)[0]).add(expectedOutMixed[0])

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_INPUT,
        [{ mixedRoute, amount: amountMixed }]
      )
      const expectedPrice = new Price(
        token0,
        token1,
        CurrencyAmount.fromRawAmount(token0, 300).quotient,
        expectedOut.quotient
      )
      expect(trade.executionPrice).toEqual(expectedPrice)
    })

    it('is correct for tradeType = EXACT_OUTPUT', async () => {
      const routeOriginalV2 = new V2RouteSDK([pair_0_1], token0, token1)
      const routev2 = new RouteV2(routeOriginalV2)
      const amountv2 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

      const routeOriginalV3 = new V3RouteSDK([pool_0_1], token0, token1)
      const routev3 = new RouteV3(routeOriginalV3)
      const amountv3 = CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100))

      const expectedInV3 = await pool_0_1.getInputAmount(amountv3)
      const expectedIn = expectedInV3[0].add(pair_0_1.getInputAmount(amountv2)[0])

      const trade = await Trade.fromRoutes(
        [{ routev2, amount: amountv2 }],
        [{ routev3, amount: amountv3 }],
        TradeType.EXACT_OUTPUT
      )
      const expectedPrice = new Price(
        token0,
        token1,
        expectedIn.quotient,
        CurrencyAmount.fromRawAmount(token1, 200).quotient
      )
      expect(trade.executionPrice).toEqual(expectedPrice)
    })
  })
})
