import JSBI from 'jsbi'

export type TickData2 = { [tick: number]: JSBI }

export interface TickData {
  tick: number
  liquidityNet: string
}

// Tick with fields parsed to JSBIs, and active liquidity computed.
export interface TickProcessed {
  tickIdx: number
  liquidityActive: JSBI
  liquidityNet: JSBI
  price0: string
}

/* Three options

1/  (current)
-process ticks as {tick, liquidity}[]
-further extract { [tick]: liquidity }
-while not at bounds
  --how to define bounds?

2/ sorting
-process ticks as {tick, liquidity}[] SORTED
  -no need to extract { [tick]: liquidity }
- from 0, both sides, while there's initialized ticks
  -bounds are easy to calculate
  -sorting is o(nlogn)

3/ straight to map
-process ticks as { [tick]: liquidity }
-while not at bounds
  -how to define bounds?


*/
