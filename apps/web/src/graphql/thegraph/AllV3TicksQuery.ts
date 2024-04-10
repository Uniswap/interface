import gql from 'graphql-tag'

import { AllV3TicksQuery } from './__generated__/types-and-hooks'

gql`
  query AllV3Ticks($poolAddress: String, $skip: Int!) {
    ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
      tick: tickIdx
      liquidityNet
      price0
      price1
    }
  }
`

export type Ticks = AllV3TicksQuery['ticks']
export type TickData = Ticks[number]
