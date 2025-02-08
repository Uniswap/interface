// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS, TickMath, Pool as V3Pool, nearestUsableTick } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { CreateV3PositionInfo, PositionState, PriceRangeState } from 'pages/Pool/Positions/create/types'
import { getV3PriceRangeInfo } from 'pages/Pool/Positions/create/utils'
import { PositionField } from 'types/position'
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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

        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
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
        expect(getV3PriceRangeInfo({ state, positionState, derivedPositionInfo, isTaxed: false })).toMatchObject({
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
          isTaxed: false,
        })
      })
    })
  })
})
