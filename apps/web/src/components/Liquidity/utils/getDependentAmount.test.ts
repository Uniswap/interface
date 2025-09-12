import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import {
  getDependentAmountFromV2Pair,
  getDependentAmountFromV3Position,
  getDependentAmountFromV4Position,
} from 'components/Liquidity/utils/getDependentAmount'
import { ETH_MAINNET } from 'test-utils/constants'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped
const tickSpaceLimits = [
  nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
  nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
]

describe('getDependentAmountFromV2Pair', () => {
  it('returns undefined', () => {
    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
        pair: new Pair(
          CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        ),
        exactField: PositionField.TOKEN0,
        token0: undefined,
        token1: undefined,
        dependentToken: undefined,
      }),
    ).toBeUndefined()

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
        pair: undefined,
        exactField: PositionField.TOKEN0,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: USDT,
      }),
    ).toBeUndefined()

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: undefined,
        pair: new Pair(
          CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        ),
        exactField: PositionField.TOKEN0,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: undefined,
      }),
    ).toBeUndefined()
  })

  it('returns dependent amount', () => {
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
      CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
    )

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        pair,
        exactField: PositionField.TOKEN1,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: USDT,
      }),
    ).toEqual(
      pair.priceOf(ETH_MAINNET.wrapped).quote(CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000')),
    )

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
        pair,
        exactField: PositionField.TOKEN0,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: USDT,
      }),
    ).toEqual(pair.priceOf(USDT.wrapped).quote(CurrencyAmount.fromRawAmount(USDT, '1000000000000000000')))
  })
})

describe('getDependentAmountFromV3Position', () => {
  it('returns dependent amount', () => {
    const pool = new V3Pool(WETH, USDT, FeeAmount.MEDIUM, '4862546267419838844180017', '6661209530036967407', -193981)

    expect(
      getDependentAmountFromV3Position({
        independentAmount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[0],
        tickUpper: tickSpaceLimits[1],
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDT, '3766763261'))
  })
})

describe('getDependentAmountFromV4Position', () => {
  it('returns dependent amount', () => {
    const pool = new V4Pool(
      ETH_MAINNET,
      USDT,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      '4862546267419838844180017',
      '6661209530036967407',
      -193981,
    )

    expect(
      getDependentAmountFromV4Position({
        independentAmount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[0],
        tickUpper: tickSpaceLimits[1],
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDT, '3766763261'))
  })
})
