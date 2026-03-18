import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  PositionState,
  PriceRangeState,
} from '~/components/Liquidity/Create/types'
import {
  getFieldsDisabled,
  getV2PriceRangeInfo,
  getV3PriceRangeInfo,
  getV4PriceRangeInfo,
} from '~/components/Liquidity/utils/priceRangeInfo'
import tryParseCurrencyAmount from '~/lib/utils/tryParseCurrencyAmount'
import { ETH_MAINNET } from '~/test-utils/constants'
import { getTickToPrice, getV4TickToPrice } from '~/utils/getTickToPrice'

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
          price: pool.priceOf(WETH),
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minTick: -197160,
          maxTick: -196500,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, -196500],
          price: pool.priceOf(WETH),
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minTick: -198300,
          maxTick: -197940,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-198300, -197940],
          price: pool.priceOf(WETH),
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
          price: pool.priceOf(USDT),
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minTick: 196200,
          maxTick: 197160,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, -196200],
          price: pool.priceOf(USDT),
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minTick: 197880,
          maxTick: 198540,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-198540, -197880],
          price: pool.priceOf(USDT),
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
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: -195180,
          maxTick: -194640,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-195180, -194640],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: -197160,
          maxTick: -196500,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, -196500],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: tickSpaceLimits[0],
          maxTick: -194460,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [tickSpaceLimits[0], -194460],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: -197160,
          maxTick: tickSpaceLimits[1],
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197160, tickSpaceLimits[1]],
          price: initialPrice,
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
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: 192660,
          maxTick: 193980,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-193980, -192660],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: 197820,
          maxTick: 198120,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-198120, -197820],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: tickSpaceLimits[0],
          maxTick: 197820,
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-197820, tickSpaceLimits[1]],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: 192660,
          maxTick: tickSpaceLimits[1],
        }

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [tickSpaceLimits[0], -192660],
          price: initialPrice,
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
          price: pool.priceOf(ETH_MAINNET),
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minTick: -197160,
          maxTick: -196500,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197160, -196500],
          price: pool.priceOf(ETH_MAINNET),
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minTick: -198300,
          maxTick: -197940,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-198300, -197940],
          price: pool.priceOf(ETH_MAINNET),
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
          price: pool.priceOf(USDT),
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minTick: -197160,
          maxTick: -196200,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [196200, 197160],
          price: pool.priceOf(USDT),
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minTick: 197880,
          maxTick: 198540,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-198540, -197880],
          price: pool.priceOf(USDT),
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
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: -195180,
          maxTick: -194640,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-195180, -194640],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: -197160,
          maxTick: -196500,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197160, -196500],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: tickSpaceLimits[0],
          maxTick: -194460,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [tickSpaceLimits[0], -194460],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: -197160,
          maxTick: tickSpaceLimits[1],
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197160, tickSpaceLimits[1]],
          price: initialPrice,
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
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token0', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: 192660,
          maxTick: 193980,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-193980, -192660],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: 197820,
          maxTick: 198120,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-198120, -197820],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - min', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: tickSpaceLimits[0],
          maxTick: 197820,
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [-197820, tickSpaceLimits[1]],
          price: initialPrice,
          mockPool,
        })
      })

      it('returns correct info for custom range - ticks at limit - max', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minTick: 192660,
          maxTick: tickSpaceLimits[1],
        }

        expect(getV4PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V4,
          ticks: [tickSpaceLimits[0], -192660],
          price: initialPrice,
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
