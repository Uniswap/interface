import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import {
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  PositionState,
  PriceRangeState,
} from 'components/Liquidity/Create/types'
import {
  getFieldsDisabled,
  getV2PriceRangeInfo,
  getV3PriceRangeInfo,
  getV4PriceRangeInfo,
} from 'components/Liquidity/utils/priceRangeInfo'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ETH_MAINNET } from 'test-utils/constants'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: pool.priceOf(WETH),
          pricesAtTicks: pricesAtLimit,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: pool.priceOf(USDT),
          pricesAtTicks: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: initialPrice,
          pricesAtTicks: pricesAtLimit,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: initialPrice,
          pricesAtTicks: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: pool.priceOf(ETH_MAINNET),
          pricesAtTicks: pricesAtLimit,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: pool.priceOf(USDT),
          pricesAtTicks: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: initialPrice,
          pricesAtTicks: pricesAtLimit,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          pricesAtTicks,
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
          ticks: tickSpaceLimits,
          ticksAtLimit: [true, true],
          price: initialPrice,
          pricesAtTicks: [pricesAtLimit[1]?.invert(), pricesAtLimit[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
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
          pricesAtTicks: [pricesAtTicks[1]?.invert(), pricesAtTicks[0]?.invert()],
          mockPool,
        })
      })
    })
  })
})

describe('getFieldsDisabled', () => {
  const pool = new V3Pool(WETH, USDT, FeeAmount.MEDIUM, '4054976535745954444738484', '7201247293608325509', -197613)

  it('returns correct info for full range', () => {
    expect(
      getFieldsDisabled({
        ticks: tickSpaceLimits as [number, number],
        poolOrPair: pool,
      }),
    ).toEqual({
      TOKEN0: false,
      TOKEN1: false,
    })
  })

  it('returns correct info for single side - token0', () => {
    expect(
      getFieldsDisabled({
        ticks: [-197160, -196500],
        poolOrPair: pool,
      }),
    ).toEqual({
      TOKEN0: false,
      TOKEN1: true,
    })
  })

  it('returns correct info for single side - token1', () => {
    expect(
      getFieldsDisabled({
        ticks: [-198300, -197940],
        poolOrPair: pool,
      }),
    ).toEqual({
      TOKEN0: true,
      TOKEN1: false,
    })
  })

  it('returns all false when ticks is undefined', () => {
    expect(getFieldsDisabled({ ticks: undefined, poolOrPair: pool })).toEqual({
      TOKEN0: false,
      TOKEN1: false,
    })
  })

  it('returns all false when pool is undefined', () => {
    expect(getFieldsDisabled({ ticks: [-197160, -196500], poolOrPair: undefined })).toEqual({
      TOKEN0: false,
      TOKEN1: false,
    })
  })

  it('returns correct info when tickUpper equals pool.tickCurrent (deposit0Disabled)', () => {
    expect(getFieldsDisabled({ ticks: [pool.tickCurrent - 1, pool.tickCurrent], poolOrPair: pool })).toEqual({
      TOKEN0: true,
      TOKEN1: false,
    })
  })

  it('returns correct info when tickLower equals pool.tickCurrent (deposit1Disabled)', () => {
    expect(getFieldsDisabled({ ticks: [pool.tickCurrent, pool.tickCurrent + 1], poolOrPair: pool })).toEqual({
      TOKEN0: false,
      TOKEN1: true,
    })
  })

  // V4Pool edge cases
  it('returns correct info for V4Pool', () => {
    const v4Pool = new V4Pool(
      WETH,
      USDT,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      '4054976535745954444738484',
      '7201247293608325509',
      -197613,
    )
    expect(getFieldsDisabled({ ticks: [-297613, -177613], poolOrPair: v4Pool })).toEqual({
      TOKEN0: false,
      TOKEN1: false,
    })
    expect(getFieldsDisabled({ ticks: [-297613, -277613], poolOrPair: v4Pool })).toEqual({
      TOKEN0: true,
      TOKEN1: false,
    })
    expect(getFieldsDisabled({ ticks: [197613, 297613], poolOrPair: v4Pool })).toEqual({
      TOKEN0: false,
      TOKEN1: true,
    })
  })
})
