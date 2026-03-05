import { TickData } from '~/appGraphql/data/AllV3TicksQuery'

export const TICK_DATA: TickData[] = [
  {
    tick: -887220,
    liquidityNet: '8732830609',
    price0: '0.000000000000000000000000000000000000002954278418582885262890650958869351',
    price1: '338492131855223783697272027718681500000',
    __typename: 'V3PoolTick',
  },
  {
    tick: -60,
    liquidityNet: '447246727849',
    price0: '0.994018262239490337401066230369517',
    price1: '1.006017734268818165222506292999135',
    __typename: 'V3PoolTick',
  },
  {
    tick: 60,
    liquidityNet: '-447246727849',
    price0: '1.006017734268818165222506292999135',
    price1: '0.994018262239490337401066230369517',
    __typename: 'V3PoolTick',
  },
  {
    tick: 887220,
    liquidityNet: '-8732830609',
    price0: '338492131855223783697272027718681500000',
    price1: '0.000000000000000000000000000000000000002954278418582885262890650958869351',
    __typename: 'V3PoolTick',
  },
]

export const SORTED_TICK_DATA_WITH_LIQUIDITY_ACTIVE = [
  {
    liquidityActive: 8732830609,
    liquidityNet: 8732830609,
    price0: 2.9542784e-39,
    tick: -887220,
    amount0Locked: 8732.830609,
    amount1Locked: 8732.830609,
  },
  {
    liquidityActive: 455979558458,
    liquidityNet: 447246727849,
    price0: 1,
    tick: 0,
    amount0Locked: 8.411022058540207e24,
    amount1Locked: 455979.558458,
  },
  {
    liquidityActive: 8732830609,
    liquidityNet: -447246727849,
    price0: 1.0060177,
    tick: 60,
    amount0Locked: 0,
    amount1Locked: 8706.672682,
  },
]

export const TICK_DATA_WITH_ONE_TICK_AND_ONE_FULL_RANGE: TickData[] = [
  {
    tick: -887220,
    liquidityNet: '8732830609',
    price0: '0.000000000000000000000000000000000000002954278418582885262890650958869351',
    price1: '338492131855223783697272027718681500000',
    __typename: 'V3PoolTick',
  },
  {
    tick: 0,
    liquidityNet: '447246727849',
    price0: '0.994018262239490337401066230369517',
    price1: '1.006017734268818165222506292999135',
    __typename: 'V3PoolTick',
  },
  {
    tick: 60,
    liquidityNet: '-447246727849',
    price0: '1.006017734268818165222506292999135',
    price1: '0.994018262239490337401066230369517',
    __typename: 'V3PoolTick',
  },
  {
    tick: 887220,
    liquidityNet: '-8732830609',
    price0: '338492131855223783697272027718681500000',
    price1: '0.000000000000000000000000000000000000002954278418582885262890650958869351',
    __typename: 'V3PoolTick',
  },
]
