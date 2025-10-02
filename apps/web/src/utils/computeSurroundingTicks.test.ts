import { TickData } from 'appGraphql/data/AllV3TicksQuery'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Price, Token } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import computeSurroundingTicks, { TickProcessed } from 'utils/computeSurroundingTicks'

const getV3Tick = (tick: number, liquidityNet: number): TickData => ({
  tick,
  liquidityNet: JSBI.BigInt(liquidityNet).toString(),
  price0: undefined,
  price1: undefined,
})

describe('#computeSurroundingTicks', () => {
  it('correctly compute active liquidity', () => {
    const token0 = new Token(1, '0x2170ed0880ac9a755fd29b2688956bd959f933f8', 18)
    const token1 = new Token(1, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 18)
    const feeAmount = FeeAmount.LOW
    const spacing = TICK_SPACINGS[feeAmount]
    const activeTickProcessed: TickProcessed = {
      tick: 1000,
      liquidityActive: JSBI.BigInt(300),
      liquidityNet: JSBI.BigInt(100),
      price0: '100',
      sdkPrice: new Price(token0, token1, '1', '100'),
    }
    const pivot = 3
    const sortedTickData: TickData[] = [
      getV3Tick(activeTickProcessed.tick - 4 * spacing, 10),
      getV3Tick(activeTickProcessed.tick - 2 * spacing, 20),
      getV3Tick(activeTickProcessed.tick - 1 * spacing, 30),
      getV3Tick(activeTickProcessed.tick * spacing, 100),
      getV3Tick(activeTickProcessed.tick + 1 * spacing, 40),
      getV3Tick(activeTickProcessed.tick + 2 * spacing, 20),
      getV3Tick(activeTickProcessed.tick + 5 * spacing, 20),
    ]

    const previous = computeSurroundingTicks({
      token0,
      token1,
      activeTickProcessed,
      sortedTickData,
      pivot,
      ascending: false,
      version: ProtocolVersion.V3,
    })

    const subsequent = computeSurroundingTicks({
      token0,
      token1,
      activeTickProcessed,
      sortedTickData,
      pivot,
      ascending: true,
      version: ProtocolVersion.V3,
    })

    expect(previous.length).toEqual(3)
    expect(previous.map((t) => [t.tick, parseFloat(t.liquidityActive.toString())])).toEqual([
      [activeTickProcessed.tick - 4 * spacing, 150],
      [activeTickProcessed.tick - 2 * spacing, 170],
      [activeTickProcessed.tick - 1 * spacing, 200],
    ])

    expect(subsequent.length).toEqual(3)
    expect(subsequent.map((t) => [t.tick, parseFloat(t.liquidityActive.toString())])).toEqual([
      [activeTickProcessed.tick + 1 * spacing, 340],
      [activeTickProcessed.tick + 2 * spacing, 360],
      [activeTickProcessed.tick + 5 * spacing, 380],
    ])
  })
})
