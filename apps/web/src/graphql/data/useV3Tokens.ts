import { useMemo } from 'react'
import useBlocksFromTimestamp from '../thegraph/BlocksFromTimestampQuery'
import { useAllTokensQuery, useEthPriceUsdQuery, useTokensBulkQuery } from '../thegraph/__generated__/types-and-hooks'
import { OrderDirection } from 'graphql/data/util'

import { get2DayChange } from './util'
import { useDeltaTimestamps } from './util'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export enum TokenSortMethod {
  PRICE = 'Price',
  VOLUME = 'Volume',
  PRICE_CHANGE = 'Price Change',
  TVL = 'TVL',
}
export type TokenSortState = {
  sortBy: TokenSortMethod
  sortDirection: OrderDirection
}

export type TableToken = {
  // token is in some pool on uniswap
  exists: boolean

  // basic token info
  name: string
  symbol: string
  address: string

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number
  txCount: number

  //fees
  feesUSD: number

  // tvl
  tvlToken: number
  tvlUSD: number
  tvlUSDChange: number

  priceUSD: number
  priceUSDChange: number
  priceUSDChangeWeek: number
}

interface TokenFields {
  id: string
  symbol: string
  name: string
  derivedETH: string
  volumeUSD: string
  volume: string
  feesUSD: string
  txCount: string
  totalValueLocked: string
  totalValueLockedUSD: string
}
/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow: string | undefined, value24HoursAgo: string | undefined): number => {
  if (valueNow && value24HoursAgo) {
    const change = ((Number.parseFloat(valueNow) - Number.parseFloat(value24HoursAgo)) / Number.parseFloat(value24HoursAgo)) * 100
    if (Number.isFinite(change)) return change
  }
  return 0
}

function sortTokens(tokens: TableToken[], sortState: TokenSortState) {
  return tokens.sort((a, b) => {
    switch (sortState.sortBy) {
      case TokenSortMethod.TVL:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvlUSD - a.tvlUSD : a.tvlUSD - b.tvlUSD
      case TokenSortMethod.PRICE:
        return sortState.sortDirection === OrderDirection.Desc ? b.priceUSD - a.priceUSD : a.priceUSD - b.priceUSD
      case TokenSortMethod.VOLUME:
        return sortState.sortDirection === OrderDirection.Desc ? b.volumeUSD - a.volumeUSD : a.volumeUSD - b.volumeUSD
      case TokenSortMethod.PRICE_CHANGE:
        return sortState.sortDirection === OrderDirection.Desc ? b.priceUSDChange - a.priceUSDChange : a.priceUSDChange - b.priceUSDChange
      default:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvlUSD - a.tvlUSD : a.tvlUSD - b.tvlUSD
    }
  })
}

export function useV3Tokens(sortState: TokenSortState): {
  loading: boolean
  error: boolean
  data: TableToken[]
} {
  const { data: allTokens, error } = useAllTokensQuery()
  const tokens = useMemo(() => allTokens?.tokens.map((d) => d.id) ?? [], [allTokens])

  // 获取三个时间间隔的 block number
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { data: block24, error: blockError24 } = useBlocksFromTimestamp(t24)
  const { data: block48, error: blockError48 } = useBlocksFromTimestamp(t48)
  const { data: blockWeek, error: blockErrorWeek } = useBlocksFromTimestamp(tWeek)

  const {
    data: ethPrices,
    error: ethError,
    loading,
  } = useEthPriceUsdQuery({
    variables: {
      block24: block24,
      block48: block48,
      blockWeek: blockWeek,
    },
  })

  const { data } = useTokensBulkQuery({ variables: { ids: tokens } })
  const { data: data24, loading: loading24, error: error24 } = useTokensBulkQuery({ variables: { ids: tokens, block: { number: block24 } } })
  const { data: data48, loading: loading48, error: error48 } = useTokensBulkQuery({ variables: { ids: tokens, block: { number: block48 } } })
  const { data: dataWeek, loading: loadingWeek, error: errorWeek } = useTokensBulkQuery({ variables: { ids: tokens, block: { number: blockWeek } } })

  const anyError = Boolean(error || blockError24 || blockError48 || blockErrorWeek || ethError || error24 || error48 || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)

  // 如果没有获取到 eth 价格，直接返回
  if (!ethPrices) {
    return {
      loading: true,
      error: false,
      data: [],
    }
  }

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: [],
    }
  }
  const start = performance.now()
  const parsed = data?.tokens
    ? data.tokens.reduce((accum: { [address: string]: TokenFields }, tokendata) => {
        accum[tokendata.id] = tokendata
        return accum
      }, {})
    : {}
  const parsed24 = data24?.tokens
    ? data24.tokens.reduce((accum: { [address: string]: TokenFields }, tokendata) => {
        accum[tokendata.id] = tokendata
        return accum
      }, {})
    : {}
  const parsed48 = data48?.tokens
    ? data48.tokens.reduce((accum: { [address: string]: TokenFields }, tokendata) => {
        accum[tokendata.id] = tokendata
        return accum
      }, {})
    : {}
  const parsedWeek = dataWeek?.tokens
    ? dataWeek.tokens.reduce((accum: { [address: string]: TokenFields }, tokendata) => {
        accum[tokendata.id] = tokendata
        return accum
      }, {})
    : {}

  const parsedTokens = {
    parsed,
    parsed24,
    parsed48,
    parsedWeek,
  }

  const unsortedTokens =
    tokens?.map((address) => {
      const current: TokenFields | undefined = parsedTokens.parsed[address]
      const oneDay: TokenFields | undefined = parsedTokens.parsed24[address]
      const twoDay: TokenFields | undefined = parsedTokens.parsed48[address]
      const week: TokenFields | undefined = parsedTokens.parsedWeek[address]

      const [volumeUSD, volumeUSDChange] =
        current && oneDay && twoDay ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD) : current ? [Number.parseFloat(current.volumeUSD), 0] : [0, 0]

      const volumeUSDWeek = current && week ? Number.parseFloat(current.volumeUSD) - Number.parseFloat(week.volumeUSD) : current ? Number.parseFloat(current.volumeUSD) : 0
      const tvlUSD = current ? Number.parseFloat(current.totalValueLockedUSD) : 0
      const tvlUSDChange = getPercentChange(current?.totalValueLockedUSD, oneDay?.totalValueLockedUSD)
      const tvlToken = current ? Number.parseFloat(current.totalValueLocked) : 0
      const priceUSD = current ? Number.parseFloat(current.derivedETH) * ethPrices.current[0].ethPriceUSD : 0
      const priceUSDOneDay = oneDay ? Number.parseFloat(oneDay.derivedETH) * ethPrices.oneDay[0].ethPriceUSD : 0
      const priceUSDWeek = week ? Number.parseFloat(week.derivedETH) * ethPrices.oneWeek[0].ethPriceUSD : 0
      const priceUSDChange = priceUSD && priceUSDOneDay ? getPercentChange(priceUSD.toString(), priceUSDOneDay.toString()) : 0

      const priceUSDChangeWeek = priceUSD && priceUSDWeek ? getPercentChange(priceUSD.toString(), priceUSDWeek.toString()) : 0
      const txCount = current && oneDay ? Number.parseFloat(current.txCount) - Number.parseFloat(oneDay.txCount) : current ? Number.parseFloat(current.txCount) : 0
      const feesUSD = current && oneDay ? Number.parseFloat(current.feesUSD) - Number.parseFloat(oneDay.feesUSD) : current ? Number.parseFloat(current.feesUSD) : 0

      return {
        exists: !!current,
        address,
        name: current?.name,
        symbol: current?.symbol,
        volumeUSD,
        volumeUSDChange,
        volumeUSDWeek,
        txCount,
        tvlUSD,
        feesUSD,
        tvlUSDChange,
        tvlToken,
        priceUSD,
        priceUSDChange,
        priceUSDChangeWeek,
      } as TableToken
    }) ?? []

  const unfilteredTokens = sortTokens(unsortedTokens, sortState)
  const end = performance.now()
  console.log(end - start)

  // const filteredPools = useFilteredPools(unfilteredPools).slice(0, 100)
  return { data: unfilteredTokens, loading, error: anyError }
}
