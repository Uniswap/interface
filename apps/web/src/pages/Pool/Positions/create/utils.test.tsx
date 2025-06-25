import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, TickMath, Pool as V3Pool, nearestUsableTick } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import {
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  PositionState,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import {
  canUnwrapCurrency,
  getCurrencyForProtocol,
  getCurrencyWithOptionalUnwrap,
  getCurrencyWithWrap,
  getSortedCurrenciesForProtocol,
  getTokenOrZeroAddress,
  getV2PriceRangeInfo,
  getV3PriceRangeInfo,
  getV4PriceRangeInfo,
} from 'pages/Pool/Positions/create/utils'
import { ETH_MAINNET } from 'test-utils/constants'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDT, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getTickToPrice, getV4TickToPrice } from 'utils/getTickToPrice'

const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped

const tickSpaceLimits = [
  nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
  nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
]

// eslint-disable-next-line max-params
function getInitialPrice(base: Currency, quote: Currency, input: string) {
  const parsedQuoteAmount = tryParseCurrencyAmount(input, quote)
  const baseAmount = tryParseCurrencyAmount('1', base)
  return (
    baseAmount &&
    parsedQuoteAmount &&
    new Price(baseAmount.currency, parsedQuoteAmount.currency, baseAmount.quotient, parsedQuoteAmount.quotient)
  )
}

describe('getV2PriceRangeInfo', () => {
  describe('WETH/USDT pool (new pool)', () => {
    describe('not manually inverted', () => {
      const state: PriceRangeState = {
        fullRange: true,
        priceInverted: false,
        initialPrice: '1000',
      }

      const derivedPositionInfo: CreateV2PositionInfo = {
        protocolVersion: ProtocolVersion.V2,
        currencies: {
          display: {
            TOKEN0: WETH,
            TOKEN1: USDT,
          },
          sdk: {
            TOKEN0: WETH,
            TOKEN1: USDT,
          },
        },
        creatingPoolOrPair: true,
        isPoolOutOfSync: false,
        refetchPoolData: () => undefined,
      }

      const initialPrice = getInitialPrice(WETH, USDT, state.initialPrice)

      it('returns correct info for full range', () => {
        expect(getV2PriceRangeInfo({ state, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V2,
          price: initialPrice,
          mockPair: new Pair(
            CurrencyAmount.fromRawAmount(USDT /* quote */, initialPrice?.numerator ?? 0),
            CurrencyAmount.fromRawAmount(WETH /* base */, initialPrice?.denominator ?? 0),
          ),
          deposit0Disabled: false,
          deposit1Disabled: false,
        })
      })
    })

    describe('manually inverted', () => {
      const state: PriceRangeState = {
        fullRange: true,
        priceInverted: true,
        initialPrice: '1000',
      }

      const derivedPositionInfo: CreateV2PositionInfo = {
        protocolVersion: ProtocolVersion.V2,
        currencies: {
          display: {
            TOKEN0: WETH,
            TOKEN1: USDT,
          },
          sdk: {
            TOKEN0: WETH,
            TOKEN1: USDT,
          },
        },
        creatingPoolOrPair: true,
        isPoolOutOfSync: false,
        refetchPoolData: () => undefined,
      }

      const initialPrice = getInitialPrice(USDT, WETH, state.initialPrice)?.invert()

      it('returns correct info for full range', () => {
        expect(getV2PriceRangeInfo({ state, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V2,
          price: initialPrice,
          mockPair: new Pair(
            CurrencyAmount.fromRawAmount(WETH, initialPrice?.denominator ?? 0),
            CurrencyAmount.fromRawAmount(USDT, initialPrice?.numerator ?? 0),
          ),
          deposit0Disabled: false,
          deposit1Disabled: false,
        })
      })
    })
  })
})

describe('getV3PriceRangeInfo', () => {
  describe('WETH/USDT pool', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V3,
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
        isDynamic: false,
      },
    }

    const pool = new V3Pool(WETH, USDT, FeeAmount.MEDIUM, '4054976535745954444738484', '7201247293608325509', -197613)

    const derivedPositionInfo: CreateV3PositionInfo = {
      protocolVersion: ProtocolVersion.V3,
      currencies: {
        display: {
          TOKEN0: WETH,
          TOKEN1: USDT,
        },
        sdk: {
          TOKEN0: WETH,
          TOKEN1: USDT,
        },
      },
      creatingPoolOrPair: false,
      pool,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [
      getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: tickSpaceLimits[0] }),
      getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: tickSpaceLimits[1] }),
    ]
    describe('not manually inverted', () => {
      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: true,
          initialPrice: '',
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: pool.priceOf(WETH),
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minPrice: '2734',
          maxPrice: '2920',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -197160 }),
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -196500 }),
        ]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, -196500],
          ticksAtLimit: [false, false],
          price: pool.priceOf(WETH),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minPrice: '2445',
          maxPrice: '2535',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -198300 }),
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -197940 }),
        ]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-198300, -197940],
          ticksAtLimit: [false, false],
          price: pool.priceOf(WETH),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
        })
      })
    })

    describe('manually inverted', () => {
      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: true,
          initialPrice: '',
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: pool.priceOf(USDT),
          prices: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minPrice: '0.000332258',
          maxPrice: '0.000365734',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -197160 }),
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -196200 }),
        ]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, -196200],
          ticksAtLimit: [false, false],
          price: pool.priceOf(USDT),
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minPrice: '0.00039209341',
          maxPrice: '0.00041884328',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -198540 }),
          getTickToPrice({ baseToken: WETH, quoteToken: USDT, tick: -197880 }),
        ]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-198540, -197880],
          ticksAtLimit: [false, false],
          price: pool.priceOf(USDT),
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
        })
      })
    })
  })

  describe('ETH/USDT (new pool)', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V3,
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
        isDynamic: false,
      },
    }

    const derivedPositionInfo: CreateV3PositionInfo = {
      protocolVersion: ProtocolVersion.V3,
      currencies: {
        display: {
          TOKEN0: ETH_MAINNET,
          TOKEN1: USDT,
        },
        sdk: {
          TOKEN0: ETH_MAINNET.wrapped,
          TOKEN1: USDT,
        },
      },
      creatingPoolOrPair: true,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [
      getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: tickSpaceLimits[0] }),
      getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: tickSpaceLimits[1] }),
    ]

    describe('not manually inverted', () => {
      const mockPool = new V3Pool(
        ETH_MAINNET.wrapped,
        USDT,
        FeeAmount.MEDIUM,
        TickMath.getSqrtRatioAtTick(-196257),
        JSBI.BigInt(0),
        -196257,
      )

      const initialPriceInput = '3000'
      const initialPrice = getInitialPrice(ETH_MAINNET.wrapped, USDT, initialPriceInput)

      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: true,
          initialPrice: initialPriceInput,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: initialPrice,
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '3332',
          maxPrice: '3517',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -195180 }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -194640 }),
        ]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-195180, -194640],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '2734',
          maxPrice: '2920',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -197160 }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -196500 }),
        ]

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, -196500],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0',
          maxPrice: '3600',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: tickSpaceLimits[0] }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -194460 }),
        ]

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [tickSpaceLimits[0], -194460],
          ticksAtLimit: [true, false],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '2734',
          maxPrice: '',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -197160 }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: tickSpaceLimits[1] }),
        ]

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, tickSpaceLimits[1]],
          ticksAtLimit: [false, true],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })
    })

    describe('manually inverted', () => {
      const mockPool = new V3Pool(
        ETH_MAINNET.wrapped,
        USDT,
        FeeAmount.MEDIUM,
        TickMath.getSqrtRatioAtTick(-196256),
        JSBI.BigInt(0),
        -196256,
        [],
      )

      const initialPriceInput = '.0003333'
      const initialPrice = getInitialPrice(USDT, ETH_MAINNET.wrapped, initialPriceInput)?.invert()

      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: true,
          initialPrice: initialPriceInput,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: initialPrice,
          prices: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0.000232258',
          maxPrice: '0.000265734',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -193980 }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -192660 }),
        ]

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-193980, -192660],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0.000389748',
          maxPrice: '0.000401617',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -198120 }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -197820 }),
        ]

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-198120, -197820],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '',
          maxPrice: '0.000389748',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -197820 }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: tickSpaceLimits[1] }),
        ]

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197820, tickSpaceLimits[1]],
          ticksAtLimit: [true, false],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0.000232258',
          maxPrice: '',
        }

        const pricesAtTicks = [
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: tickSpaceLimits[0] }),
          getTickToPrice({ baseToken: ETH_MAINNET.wrapped, quoteToken: USDT, tick: -192660 }),
        ]

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [tickSpaceLimits[0], -192660],
          ticksAtLimit: [false, true],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })
    })
  })
})

describe('getV4PriceRangeInfo', () => {
  describe('ETH/USDT pool', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V4,
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
        isDynamic: false,
      },
    }

    const pool = new V4Pool(
      ETH_MAINNET,
      USDT,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      '4054976535745954444738484',
      '7201247293608325509',
      -197613,
    )

    const derivedPositionInfo: CreateV4PositionInfo = {
      protocolVersion: ProtocolVersion.V4,
      currencies: {
        display: {
          TOKEN0: ETH_MAINNET,
          TOKEN1: USDT,
        },
        sdk: {
          TOKEN0: ETH_MAINNET,
          TOKEN1: USDT,
        },
      },
      creatingPoolOrPair: false,
      pool,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [
      getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[0] }),
      getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[1] }),
    ]
    describe('not manually inverted', () => {
      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: true,
          initialPrice: '',
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: pool.priceOf(ETH_MAINNET),
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minPrice: '2734',
          maxPrice: '2920',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197160 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -196500 }),
        ]
        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197160, -196500],
          ticksAtLimit: [false, false],
          price: pool.priceOf(ETH_MAINNET),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minPrice: '2445',
          maxPrice: '2535',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -198300 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197940 }),
        ]
        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-198300, -197940],
          ticksAtLimit: [false, false],
          price: pool.priceOf(ETH_MAINNET),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
        })
      })
    })

    describe('manually inverted', () => {
      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: true,
          initialPrice: '',
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: pool.priceOf(USDT),
          prices: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minPrice: '0.000332258',
          maxPrice: '0.000365734',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197160 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -196200 }),
        ]
        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197160, -196200],
          ticksAtLimit: [false, false],
          price: pool.priceOf(USDT),
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minPrice: '0.00039209341',
          maxPrice: '0.00041884328',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -198540 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197880 }),
        ]
        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-198540, -197880],
          ticksAtLimit: [false, false],
          price: pool.priceOf(USDT),
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
        })
      })
    })
  })

  describe('ETH/USDT (new pool)', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V4,
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
        isDynamic: false,
      },
    }

    const derivedPositionInfo: CreateV4PositionInfo = {
      protocolVersion: ProtocolVersion.V4,
      currencies: {
        display: {
          TOKEN0: ETH_MAINNET,
          TOKEN1: USDT,
        },
        sdk: {
          TOKEN0: ETH_MAINNET,
          TOKEN1: USDT,
        },
      },
      creatingPoolOrPair: true,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [
      getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[0] }),
      getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[1] }),
    ]

    describe('not manually inverted', () => {
      const mockPool = new V4Pool(
        ETH_MAINNET,
        USDT,
        FeeAmount.MEDIUM,
        TICK_SPACINGS[FeeAmount.MEDIUM],
        ZERO_ADDRESS,
        TickMath.getSqrtRatioAtTick(-196257),
        JSBI.BigInt(0),
        -196257,
      )

      const initialPriceInput = '3000'
      const initialPrice = getInitialPrice(ETH_MAINNET, USDT, initialPriceInput)

      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: true,
          initialPrice: initialPriceInput,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: initialPrice,
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '3332',
          maxPrice: '3517',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -195180 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -194640 }),
        ]
        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-195180, -194640],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '2734',
          maxPrice: '2920',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197160 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -196500 }),
        ]

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197160, -196500],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0',
          maxPrice: '3600',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[0] }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -194460 }),
        ]

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [tickSpaceLimits[0], -194460],
          ticksAtLimit: [true, false],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '2734',
          maxPrice: '',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197160 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[1] }),
        ]

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197160, tickSpaceLimits[1]],
          ticksAtLimit: [false, true],
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })
    })

    describe('manually inverted', () => {
      const mockPool = new V4Pool(
        ETH_MAINNET,
        USDT,
        FeeAmount.MEDIUM,
        TICK_SPACINGS[FeeAmount.MEDIUM],
        ZERO_ADDRESS,
        TickMath.getSqrtRatioAtTick(-196256),
        JSBI.BigInt(0),
        -196256,
      )

      const initialPriceInput = '0.0003333'
      const initialPrice = getInitialPrice(USDT, ETH_MAINNET, initialPriceInput)?.invert()

      it('returns correct info for full range', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: true,
          initialPrice: initialPriceInput,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [undefined, undefined],
          ticksAtLimit: [true, true],
          price: initialPrice,
          prices: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0.000232258',
          maxPrice: '0.000265734',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -193980 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -192660 }),
        ]

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-193980, -192660],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0.000389748',
          maxPrice: '0.000401617',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -198120 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197820 }),
        ]

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-198120, -197820],
          ticksAtLimit: [false, false],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '',
          maxPrice: '0.000389748',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -197820 }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[1] }),
        ]

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197820, tickSpaceLimits[1]],
          ticksAtLimit: [true, false],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: false,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0.000232258',
          maxPrice: '',
        }

        const pricesAtTicks = [
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: tickSpaceLimits[0] }),
          getV4TickToPrice({ baseCurrency: ETH_MAINNET, quoteCurrency: USDT, tick: -192660 }),
        ]

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [tickSpaceLimits[0], -192660],
          ticksAtLimit: [false, true],
          price: initialPrice,
          prices: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: false,
          mockPool,
        })
      })
    })
  })
})

describe('getCurrencyWithWrap', () => {
  const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)

  it('returns undefined when currency is undefined', () => {
    expect(getCurrencyWithWrap(undefined, ProtocolVersion.V2)).toBeUndefined()
  })

  it('returns token as-is for token currencies', () => {
    expect(getCurrencyWithWrap(USDT, ProtocolVersion.V2)).toBe(USDT)
    expect(getCurrencyWithWrap(USDT, ProtocolVersion.V3)).toBe(USDT)
    expect(getCurrencyWithWrap(USDT, ProtocolVersion.V4)).toBe(USDT)

    expect(getCurrencyWithWrap(WETH, ProtocolVersion.V2)).toBe(WETH)
    expect(getCurrencyWithWrap(WETH, ProtocolVersion.V3)).toBe(WETH)
    expect(getCurrencyWithWrap(WETH, ProtocolVersion.V4)).toBe(WETH)
  })

  it('returns wrapped version of native currency for v2/v3 and native for v4', () => {
    expect(getCurrencyWithWrap(nativeCurrency, ProtocolVersion.V2)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyWithWrap(nativeCurrency, ProtocolVersion.V3)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyWithWrap(nativeCurrency, ProtocolVersion.V4)).toBe(nativeCurrency)
  })
})

describe('getTokenOrZeroAddress', () => {
  const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)

  it('returns undefined when currency is undefined', () => {
    expect(getTokenOrZeroAddress(undefined)).toBeUndefined()
  })

  it('returns token address for token currencies', () => {
    expect(getTokenOrZeroAddress(USDT)).toBe(USDT.address)
    expect(getTokenOrZeroAddress(WETH)).toBe(WETH.address)
  })

  it('returns wrapped token address for native currency in V2/V3', () => {
    expect(getTokenOrZeroAddress(nativeCurrency)).toBe(ZERO_ADDRESS)
  })
})

describe('getSortedCurrenciesForProtocol', () => {
  const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)

  it('sorts tokens when they are undefined', () => {
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: undefined, protocolVersion: ProtocolVersion.V2 })).toEqual(
      { TOKEN0: undefined, TOKEN1: undefined },
    )
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: undefined, protocolVersion: ProtocolVersion.V3 })).toEqual(
      { TOKEN0: undefined, TOKEN1: undefined },
    )
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: undefined, protocolVersion: ProtocolVersion.V4 })).toEqual(
      { TOKEN0: undefined, TOKEN1: undefined },
    )

    expect(getSortedCurrenciesForProtocol({ a: USDT, b: undefined, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: USDT,
      TOKEN1: undefined,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: undefined, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: USDT,
      TOKEN1: undefined,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: undefined, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: USDT,
      TOKEN1: undefined,
    })

    expect(getSortedCurrenciesForProtocol({ a: undefined, b: USDT, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: undefined,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: USDT, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: undefined,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: undefined, b: USDT, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: undefined,
      TOKEN1: USDT,
    })
  })

  it('sorts 2 tokens correctly', () => {
    expect(getSortedCurrenciesForProtocol({ a: DAI, b: USDT, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: DAI, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: USDT, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: DAI, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: USDT, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: DAI, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: USDT,
    })
  })

  it('sorts 2 tokens correctly with nativeCurrency', () => {
    expect(getSortedCurrenciesForProtocol({ a: DAI, b: nativeCurrency, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: DAI, protocolVersion: ProtocolVersion.V2 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: nativeCurrency, protocolVersion: ProtocolVersion.V2 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: USDT, protocolVersion: ProtocolVersion.V2 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: nativeCurrency, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: DAI, protocolVersion: ProtocolVersion.V3 })).toEqual({
      TOKEN0: DAI,
      TOKEN1: nativeCurrency,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: nativeCurrency, protocolVersion: ProtocolVersion.V3 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: USDT, protocolVersion: ProtocolVersion.V3 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )

    expect(getSortedCurrenciesForProtocol({ a: DAI, b: nativeCurrency, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: nativeCurrency,
      TOKEN1: DAI,
    })
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: DAI, protocolVersion: ProtocolVersion.V4 })).toEqual({
      TOKEN0: nativeCurrency,
      TOKEN1: DAI,
    })
    expect(getSortedCurrenciesForProtocol({ a: USDT, b: nativeCurrency, protocolVersion: ProtocolVersion.V4 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
    expect(getSortedCurrenciesForProtocol({ a: nativeCurrency, b: USDT, protocolVersion: ProtocolVersion.V4 })).toEqual(
      {
        TOKEN0: nativeCurrency,
        TOKEN1: USDT,
      },
    )
  })
})

describe('getCurrencyForProtocol', () => {
  const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)

  it('returns undefined when currency is undefined', () => {
    expect(getCurrencyForProtocol(undefined, ProtocolVersion.V2)).toBeUndefined()
  })

  it('returns token as-is for token currencies', () => {
    expect(getCurrencyForProtocol(USDT, ProtocolVersion.V2)).toBe(USDT)
    expect(getCurrencyForProtocol(USDT, ProtocolVersion.V3)).toBe(USDT)
    expect(getCurrencyForProtocol(USDT, ProtocolVersion.V4)).toBe(USDT)
  })

  it('returns native token for wrapped native for v4 and as is for v2/v3', () => {
    expect(getCurrencyForProtocol(WETH, ProtocolVersion.V2)).toBe(WETH)
    expect(getCurrencyForProtocol(WETH, ProtocolVersion.V3)).toBe(WETH)
    expect(getCurrencyForProtocol(WETH, ProtocolVersion.V4)).toBe(nativeCurrency)
  })

  it('returns wrapped version of native currency for v2/v3 and native for v4', () => {
    expect(getCurrencyForProtocol(nativeCurrency, ProtocolVersion.V2)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyForProtocol(nativeCurrency, ProtocolVersion.V3)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyForProtocol(nativeCurrency, ProtocolVersion.V4)).toBe(nativeCurrency)
  })
})

describe('canUnwrapCurrency', () => {
  it('returns false when currency is undefined', () => {
    expect(canUnwrapCurrency(undefined, ProtocolVersion.V2)).toBe(false)
    expect(canUnwrapCurrency(undefined, ProtocolVersion.V3)).toBe(false)
    expect(canUnwrapCurrency(undefined, ProtocolVersion.V4)).toBe(false)
  })

  it('never unwraps for v4', () => {
    expect(canUnwrapCurrency(USDT, ProtocolVersion.V4)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V4)).toBe(false)
    expect(canUnwrapCurrency(ETH_MAINNET, ProtocolVersion.V4)).toBe(false)
  })

  it('returns true for the wrapped native token on v3', () => {
    expect(canUnwrapCurrency(USDT, ProtocolVersion.V3)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V3)).toBe(true)
    expect(canUnwrapCurrency(ETH_MAINNET, ProtocolVersion.V3)).toBe(false)
  })

  it('returns true for the wrapped native currency for v2', () => {
    expect(canUnwrapCurrency(USDT, ProtocolVersion.V2)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V2)).toBe(true)
    expect(canUnwrapCurrency(ETH_MAINNET, ProtocolVersion.V2)).toBe(false)
  })
})

describe('getCurrencyWithOptionalUnwrap', () => {
  it('never unwraps when shouldUnwrap is false', () => {
    expect(getCurrencyWithOptionalUnwrap({ currency: USDT, shouldUnwrap: true })).toBe(USDT)
    expect(getCurrencyWithOptionalUnwrap({ currency: WETH, shouldUnwrap: true })).toBe(
      nativeOnChain(UniverseChainId.Mainnet),
    )
    expect(getCurrencyWithOptionalUnwrap({ currency: ETH_MAINNET, shouldUnwrap: true })).toBe(ETH_MAINNET)
  })

  it('unwraps when shouldUnwrap is true and the currency is wrappedNative', () => {
    expect(getCurrencyWithOptionalUnwrap({ currency: USDT, shouldUnwrap: false })).toBe(USDT)
    expect(getCurrencyWithOptionalUnwrap({ currency: WETH, shouldUnwrap: false })).toBe(WETH)
    expect(getCurrencyWithOptionalUnwrap({ currency: ETH_MAINNET, shouldUnwrap: false })).toBe(ETH_MAINNET)
  })
})
