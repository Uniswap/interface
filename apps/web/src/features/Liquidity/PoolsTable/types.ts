import type { UniverseChainId } from '@universe/chains'
import type { ReactElement } from 'react'
import type { FeeData, PositionRewardApr } from 'uniswap/src/features/positions/types'
import type { PoolBrowserLinkState } from '~/features/Liquidity/poolBrowserEntry'

/** Router state a pool row's link carries to the page it opens. */
export type PoolTableLinkState = { entryPoint?: string } & PoolBrowserLinkState

export interface PoolLinkData {
  chainId: UniverseChainId
  poolIdOrHash: string
  token0Address?: string
  token1Address?: string
  fee?: FeeData
  hookAddress?: string
  protocolVersion?: string
}

export interface PoolTableValues {
  index: number
  poolDescription: ReactElement
  tvl: string
  apr?: number
  totalApr?: number
  volume24h: string
  volume30d: string
  selectedVolume: string
  volOverTvl?: number
  link: string
  linkState?: PoolTableLinkState
  /** The pool's live per-token boosts, as served. Empty when it runs no live campaign. */
  rewards?: PositionRewardApr[]
  token0CurrencyId?: string
  token1CurrencyId?: string
  selected?: boolean
}
