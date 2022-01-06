import { HourlyTokenPricesQuery } from 'src/features/historicalChainData/generated/uniswap-hooks'

export type ArrayItem<T> = T extends Array<infer U> ? U : never

export type TokenData = Omit<ArrayItem<HourlyTokenPricesQuery['tokenHourDatas']>, '__typename'>
