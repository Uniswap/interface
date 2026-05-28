import { AllV3TicksQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export type Ticks = NonNullable<NonNullable<AllV3TicksQuery['v3Pool']>['ticks']>
export type TickData = Ticks[number]
