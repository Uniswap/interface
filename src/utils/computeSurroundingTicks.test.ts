import { Token } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { AllV3TicksQuery } from 'state/data/generated'

import computeSurroundingTicks from './computeSurroundingTicks'

const getV3Tick = (tickIdx: number, liquidityNet: number) => ({
  tickIdx,
  liquidityNet: JSBI.BigInt(liquidityNet),
  price0: '1',
  price1: '2',
})

describe('#computeSurroundingTicks', () => {
  it('correctly compute active liquidity', () => {
    const token0 = new Token(1, '0x2170ed0880ac9a755fd29b2688956bd959f933f8', 18)
    const token1 = new Token(1, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 18)
    const feeAmount = FeeAmount.LOW
    const spacing = TICK_SPACINGS[feeAmount]
    const activeTickProcessed = {
      tickIdx: 1000,
      liquidityActive: JSBI.BigInt(300),
      liquidityNet: JSBI.BigInt(100),
      price0: '100',
    }
    const pivot = 3
    const ascending = true
    const sortedTickData: AllV3TicksQuery['ticks'] = [
      getV3Tick(activeTickProcessed.tickIdx - 4 * spacing, 10),
      getV3Tick(activeTickProcessed.tickIdx - 2 * spacing, 20),
      getV3Tick(activeTickProcessed.tickIdx - 1 * spacing, 30),
      getV3Tick(activeTickProcessed.tickIdx * spacing, 100),
      getV3Tick(activeTickProcessed.tickIdx + 1 * spacing, 40),
      getV3Tick(activeTickProcessed.tickIdx + 2 * spacing, 20),
      getV3Tick(activeTickProcessed.tickIdx + 5 * spacing, 20),
    ]

    const previous = computeSurroundingTicks(token0, token1, activeTickProcessed, sortedTickData, pivot, !ascending)

    const subsequent = computeSurroundingTicks(token0, token1, activeTickProcessed, sortedTickData, pivot, ascending)

    expect(previous.length).toEqual(3)
    expect(previous.map((t) => [t.tickIdx, parseFloat(t.liquidityActive.toString())])).toEqual([
      [activeTickProcessed.tickIdx - 4 * spacing, 150],
      [activeTickProcessed.tickIdx - 2 * spacing, 170],
      [activeTickProcessed.tickIdx - 1 * spacing, 200],
    ])

    expect(subsequent.length).toEqual(3)
    expect(subsequent.map((t) => [t.tickIdx, parseFloat(t.liquidityActive.toString())])).toEqual([
      [activeTickProcessed.tickIdx + 1 * spacing, 340],
      [activeTickProcessed.tickIdx + 2 * spacing, 360],
      [activeTickProcessed.tickIdx + 5 * spacing, 380],
    ])
  })
})
