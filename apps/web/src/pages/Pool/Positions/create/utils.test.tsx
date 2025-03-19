import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, TickMath, Pool as V3Pool, nearestUsableTick } from '@uniswap/v3-sdk'
import { ZERO_ADDRESS } from 'constants/misc'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import {
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  PositionState,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import {
  canUnwrapCurrency,
  getCurrencyAddressWithWrap,
  getCurrencyForProtocol,
  getCurrencyWithOptionalUnwrap,
  getCurrencyWithWrap,
  getV2PriceRangeInfo,
  getV3PriceRangeInfo,
} from 'pages/Pool/Positions/create/utils'
import { PositionField } from 'types/position'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DAI, ETH, WETH } from 'uniswap/src/test/fixtures'
import { getTickToPrice } from 'utils/getTickToPrice'

const tickSpaceLimits = [
  nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
  nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
]

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
  describe('WETH/DAI pool (new pool)', () => {
    describe('not manually inverted', () => {
      const state: PriceRangeState = {
        fullRange: true,
        priceInverted: false,
        initialPrice: '1000',
      }

      const derivedPositionInfo: CreateV2PositionInfo = {
        protocolVersion: ProtocolVersion.V2,
        currencies: [WETH, DAI],
        creatingPoolOrPair: true,
        isPoolOutOfSync: false,
        refetchPoolData: () => undefined,
      }

      const initialPrice = getInitialPrice(WETH, DAI, state.initialPrice)?.invert()

      it('returns correct info for full range', () => {
        expect(getV2PriceRangeInfo({ state, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V2,
          price: initialPrice,
          mockPair: new Pair(
            CurrencyAmount.fromRawAmount(WETH, initialPrice?.numerator ?? 0),
            CurrencyAmount.fromRawAmount(DAI, initialPrice?.denominator ?? 0),
          ),
          deposit0Disabled: false,
          deposit1Disabled: false,
          invertPrice: true,
        })
      })
    })

    describe('manually inverted', () => {
      const state: PriceRangeState = {
        fullRange: true,
        priceInverted: true,
        initialPrice: '.001',
      }

      const derivedPositionInfo: CreateV2PositionInfo = {
        protocolVersion: ProtocolVersion.V2,
        currencies: [WETH, DAI],
        creatingPoolOrPair: true,
        isPoolOutOfSync: false,
        refetchPoolData: () => undefined,
      }

      const initialPrice = getInitialPrice(DAI, WETH, state.initialPrice)

      it('returns correct info for full range', () => {
        expect(getV2PriceRangeInfo({ state, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V2,
          price: initialPrice,
          mockPair: new Pair(
            CurrencyAmount.fromRawAmount(WETH, initialPrice?.numerator ?? 0),
            CurrencyAmount.fromRawAmount(DAI, initialPrice?.denominator ?? 0),
          ),
          deposit0Disabled: false,
          deposit1Disabled: false,
          invertPrice: false,
        })
      })
    })
  })

  describe('DAI/WETH pool (new pool)', () => {
    describe('not manually inverted', () => {
      const state: PriceRangeState = {
        fullRange: true,
        priceInverted: false,
        initialPrice: '.001',
      }

      const derivedPositionInfo: CreateV2PositionInfo = {
        protocolVersion: ProtocolVersion.V2,
        currencies: [DAI, WETH],
        creatingPoolOrPair: true,
        isPoolOutOfSync: false,
        refetchPoolData: () => undefined,
      }

      const initialPrice = getInitialPrice(DAI, WETH, state.initialPrice)

      it('returns correct info for full range', () => {
        expect(getV2PriceRangeInfo({ state, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V2,
          price: initialPrice,
          mockPair: new Pair(
            CurrencyAmount.fromRawAmount(WETH, initialPrice?.numerator ?? 0),
            CurrencyAmount.fromRawAmount(DAI, initialPrice?.denominator ?? 0),
          ),
          deposit0Disabled: false,
          deposit1Disabled: false,
          invertPrice: false,
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
        currencies: [DAI, WETH],
        creatingPoolOrPair: true,
        isPoolOutOfSync: false,
        refetchPoolData: () => undefined,
      }

      const initialPrice = getInitialPrice(WETH, DAI, state.initialPrice)?.invert()

      it('returns correct info for full range', () => {
        expect(getV2PriceRangeInfo({ state, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V2,
          price: initialPrice,
          mockPair: new Pair(
            CurrencyAmount.fromRawAmount(WETH, initialPrice?.numerator ?? 0),
            CurrencyAmount.fromRawAmount(DAI, initialPrice?.denominator ?? 0),
          ),
          deposit0Disabled: false,
          deposit1Disabled: false,
          invertPrice: true,
        })
      })
    })
  })
})

describe('getV3PriceRangeInfo', () => {
  describe('WETH/DAI pool', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V3,
      currencyInputs: {
        [PositionField.TOKEN0]: WETH,
        [PositionField.TOKEN1]: DAI,
      },
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
      },
    }

    const pool = new V3Pool(
      WETH,
      DAI,
      FeeAmount.MEDIUM,
      '1414156315058840454248304742',
      '140124537305748886800195',
      -80521,
    )

    const derivedPositionInfo: CreateV3PositionInfo = {
      protocolVersion: ProtocolVersion.V3,
      currencies: [WETH, DAI],
      creatingPoolOrPair: false,
      pool,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [getTickToPrice(DAI, WETH, tickSpaceLimits[0]), getTickToPrice(DAI, WETH, tickSpaceLimits[1])]

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
          isSorted: false,
          price: pool.priceOf(DAI),
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
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

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -79800), getTickToPrice(DAI, WETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-79800, -79140],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: '',
          minPrice: '3332',
          maxPrice: '3517',
        }

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -81660), getTickToPrice(DAI, WETH, -81120)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81660, -81120],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
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
          isSorted: true,
          price: pool.priceOf(DAI),
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invertPrice: false,
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

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -80100), getTickToPrice(DAI, WETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-80100, -79140],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: '',
          minPrice: '0.00028943',
          maxPrice: '0.00030549',
        }

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -81480), getTickToPrice(DAI, WETH, -80940)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81480, -80940],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
        })
      })
    })
  })

  describe('DAI/WETH pool', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V3,
      currencyInputs: {
        [PositionField.TOKEN0]: DAI,
        [PositionField.TOKEN1]: WETH,
      },
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
      },
    }

    const pool = new V3Pool(
      DAI,
      WETH,
      FeeAmount.MEDIUM,
      '1414156315058840454248304742',
      '140124537305748886800195',
      -80521,
    )

    const derivedPositionInfo: CreateV3PositionInfo = {
      protocolVersion: ProtocolVersion.V3,
      currencies: [DAI, WETH],
      creatingPoolOrPair: false,
      pool,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [getTickToPrice(DAI, WETH, tickSpaceLimits[0]), getTickToPrice(DAI, WETH, tickSpaceLimits[1])]

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
          isSorted: true,
          price: pool.priceOf(DAI),
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invertPrice: false,
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
          minPrice: '0.000332258',
          maxPrice: '0.000365734',
        }

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -80100), getTickToPrice(DAI, WETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-80100, -79140],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
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
          minPrice: '0.00028943',
          maxPrice: '0.00030549',
        }

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -81480), getTickToPrice(DAI, WETH, -80940)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81480, -80940],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
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
          isSorted: false,
          price: pool.priceOf(DAI),
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
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
          minPrice: '2734',
          maxPrice: '2920',
        }

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -79800), getTickToPrice(DAI, WETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-79800, -79140],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
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
          minPrice: '3332',
          maxPrice: '3517',
        }

        const pricesAtTicks = [getTickToPrice(DAI, WETH, -81660), getTickToPrice(DAI, WETH, -81120)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81660, -81120],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: pool.priceOf(DAI),
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
        })
      })
    })
  })

  describe('ETH/DAI (new pool)', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V3,
      currencyInputs: {
        [PositionField.TOKEN0]: ETH,
        [PositionField.TOKEN1]: DAI,
      },
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
      },
    }

    const derivedPositionInfo: CreateV3PositionInfo = {
      protocolVersion: ProtocolVersion.V3,
      currencies: [ETH, DAI],
      creatingPoolOrPair: true,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [getTickToPrice(DAI, ETH, tickSpaceLimits[0]), getTickToPrice(DAI, ETH, tickSpaceLimits[1])]

    describe('not manually inverted', () => {
      const mockPool = new V3Pool(
        ETH.wrapped,
        DAI,
        FeeAmount.MEDIUM,
        TickMath.getSqrtRatioAtTick(-80068),
        JSBI.BigInt(0),
        -80068,
      )

      const initialPriceInput = '3000'
      const initialPrice = getInitialPrice(ETH, DAI, initialPriceInput)?.invert()

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
          isSorted: false,
          price: initialPrice,
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
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
          minPrice: '2734',
          maxPrice: '2920',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -79800), getTickToPrice(DAI, ETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-79800, -79140],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: false,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '3332',
          maxPrice: '3517',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -81660), getTickToPrice(DAI, ETH, -81120)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81660, -81120],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
          mockPool,
        })
      })
    })

    describe('manually inverted', () => {
      const mockPool = new V3Pool(
        ETH.wrapped,
        DAI,
        FeeAmount.MEDIUM,
        TickMath.getSqrtRatioAtTick(-80068),
        JSBI.BigInt(0),
        -80068,
      )

      const initialPriceInput = '0.000333333'
      const initialPrice = getInitialPrice(DAI, ETH, initialPriceInput)

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
          isSorted: true,
          price: initialPrice,
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invertPrice: false,
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
          minPrice: '0.000342258',
          maxPrice: '0.000365734',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -79800), getTickToPrice(DAI, ETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-79800, -79140],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
          mockPool,
        })
      })

      it('returns correct info for single side - token1', () => {
        const state: PriceRangeState = {
          priceInverted: true,
          fullRange: false,
          initialPrice: initialPriceInput,
          minPrice: '0.00028943',
          maxPrice: '0.00030549',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -81480), getTickToPrice(DAI, ETH, -80940)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81480, -80940],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: false,
          deposit1Disabled: true,
          mockPool,
        })
      })
    })
  })

  describe('DAI/ETH (new pool)', () => {
    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V3,
      currencyInputs: {
        [PositionField.TOKEN0]: DAI,
        [PositionField.TOKEN1]: ETH,
      },
      fee: {
        feeAmount: FeeAmount.MEDIUM,
        tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
      },
    }

    const derivedPositionInfo: CreateV3PositionInfo = {
      protocolVersion: ProtocolVersion.V3,
      currencies: [DAI, ETH],
      creatingPoolOrPair: true,
      isPoolOutOfSync: false,
      refetchPoolData: () => undefined,
    }

    const pricesAtLimit = [getTickToPrice(DAI, ETH, tickSpaceLimits[0]), getTickToPrice(DAI, ETH, tickSpaceLimits[1])]

    describe('not manually inverted', () => {
      const mockPool = new V3Pool(
        ETH.wrapped,
        DAI,
        FeeAmount.MEDIUM,
        TickMath.getSqrtRatioAtTick(-80068),
        JSBI.BigInt(0),
        -80068,
      )

      const initialPriceInput = '0.000333333'
      const initialPrice = getInitialPrice(DAI, ETH, initialPriceInput)

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
          isSorted: true,
          price: initialPrice,
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          tickSpaceLimits,
          pricesAtLimit,
          invertPrice: false,
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
          minPrice: '0.000342258',
          maxPrice: '0.000365734',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -79800), getTickToPrice(DAI, ETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-79800, -79140],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
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
          minPrice: '0.00028943',
          maxPrice: '0.00030549',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -81480), getTickToPrice(DAI, ETH, -80940)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81480, -80940],
          ticksAtLimit: [false, false],
          isSorted: true,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: false,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
          deposit1Disabled: false,
          mockPool,
        })
      })
    })

    describe('manually inverted', () => {
      const mockPool = new V3Pool(
        ETH.wrapped,
        DAI,
        FeeAmount.MEDIUM,
        TickMath.getSqrtRatioAtTick(-80068),
        JSBI.BigInt(0),
        -80068,
      )

      const initialPriceInput = '3000'
      const initialPrice = getInitialPrice(ETH, DAI, initialPriceInput)?.invert()

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
          isSorted: false,
          price: initialPrice,
          prices: pricesAtLimit,
          pricesAtTicks: [undefined, undefined],
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
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
          minPrice: '2734',
          maxPrice: '2920',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -79800), getTickToPrice(DAI, ETH, -79140)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-79800, -79140],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
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
          minPrice: '3332',
          maxPrice: '3517',
        }

        const pricesAtTicks = [getTickToPrice(DAI, ETH, -81660), getTickToPrice(DAI, ETH, -81120)]
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo })).toMatchObject({
          protocolVersion: ProtocolVersion.V3,
          ticks: [-81660, -81120],
          ticksAtLimit: [false, false],
          isSorted: false,
          price: initialPrice,
          prices: pricesAtTicks,
          pricesAtTicks,
          pricesAtLimit,
          tickSpaceLimits,
          invertPrice: true,
          invalidPrice: false,
          invalidRange: false,
          outOfRange: true,
          deposit0Disabled: true,
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
    expect(getCurrencyWithWrap(DAI, ProtocolVersion.V2)).toBe(DAI)
    expect(getCurrencyWithWrap(DAI, ProtocolVersion.V3)).toBe(DAI)
    expect(getCurrencyWithWrap(DAI, ProtocolVersion.V4)).toBe(DAI)

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

describe('getCurrencyAddressWithWrap', () => {
  const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)

  it('returns undefined when currency is undefined', () => {
    expect(getCurrencyAddressWithWrap(undefined, ProtocolVersion.V2)).toBeUndefined()
  })

  it('returns token address for token currencies', () => {
    expect(getCurrencyAddressWithWrap(DAI, ProtocolVersion.V2)).toBe(DAI.address)
    expect(getCurrencyAddressWithWrap(DAI, ProtocolVersion.V3)).toBe(DAI.address)
    expect(getCurrencyAddressWithWrap(DAI, ProtocolVersion.V4)).toBe(DAI.address)

    expect(getCurrencyAddressWithWrap(WETH, ProtocolVersion.V2)).toBe(WETH.address)
    expect(getCurrencyAddressWithWrap(WETH, ProtocolVersion.V3)).toBe(WETH.address)
    expect(getCurrencyAddressWithWrap(WETH, ProtocolVersion.V4)).toBe(WETH.address)
  })

  it('returns wrapped token address for native currency in V2/V3', () => {
    expect(getCurrencyAddressWithWrap(nativeCurrency, ProtocolVersion.V2)).toBe(nativeCurrency.wrapped.address)
    expect(getCurrencyAddressWithWrap(nativeCurrency, ProtocolVersion.V3)).toBe(nativeCurrency.wrapped.address)
    expect(getCurrencyAddressWithWrap(nativeCurrency, ProtocolVersion.V4)).toBe(ZERO_ADDRESS)
  })
})

describe('getCurrencyForProtocol', () => {
  const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)

  it('returns undefined when currency is undefined', () => {
    expect(getCurrencyForProtocol(undefined, ProtocolVersion.V2)).toBeUndefined()
  })

  it('returns token as-is for token currencies', () => {
    expect(getCurrencyForProtocol(DAI, ProtocolVersion.V2)).toBe(DAI)
    expect(getCurrencyForProtocol(DAI, ProtocolVersion.V3)).toBe(DAI)
    expect(getCurrencyForProtocol(DAI, ProtocolVersion.V4)).toBe(DAI)
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
    expect(canUnwrapCurrency(DAI, ProtocolVersion.V4)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V4)).toBe(false)
    expect(canUnwrapCurrency(ETH, ProtocolVersion.V4)).toBe(false)
  })

  it('returns true for the wrapped native token on v3', () => {
    expect(canUnwrapCurrency(DAI, ProtocolVersion.V3)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V3)).toBe(true)
    expect(canUnwrapCurrency(ETH, ProtocolVersion.V3)).toBe(false)
  })

  it('returns true for the wrapped native currency for v2', () => {
    expect(canUnwrapCurrency(DAI, ProtocolVersion.V2)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V2)).toBe(true)
    expect(canUnwrapCurrency(ETH, ProtocolVersion.V2)).toBe(false)
  })
})

describe('getCurrencyWithOptionalUnwrap', () => {
  it('never unwraps when shouldUnwrap is false', () => {
    expect(getCurrencyWithOptionalUnwrap({ currency: DAI, shouldUnwrap: true })).toBe(DAI)
    expect(getCurrencyWithOptionalUnwrap({ currency: WETH, shouldUnwrap: true })).toBe(
      nativeOnChain(UniverseChainId.Mainnet),
    )
    expect(getCurrencyWithOptionalUnwrap({ currency: ETH, shouldUnwrap: true })).toBe(ETH)
  })

  it('unwraps when shouldUnwrap is true and the currency is wrappedNative', () => {
    expect(getCurrencyWithOptionalUnwrap({ currency: DAI, shouldUnwrap: false })).toBe(DAI)
    expect(getCurrencyWithOptionalUnwrap({ currency: WETH, shouldUnwrap: false })).toBe(WETH)
    expect(getCurrencyWithOptionalUnwrap({ currency: ETH, shouldUnwrap: false })).toBe(ETH)
  })
})
