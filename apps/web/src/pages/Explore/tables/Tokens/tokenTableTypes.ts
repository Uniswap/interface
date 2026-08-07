import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { ReactElement } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface PriceCellValue {
  chainId: UniverseChainId
  address: string
  price: number | undefined
}

export interface TokenTableValue {
  index: number
  multichainId: string
  /** Unique row identity: multichainId, or chainId:address for ungrouped singles ('' multichainId). */
  rowKey: string
  token: PriceCellValue
  mcToken: RankedMultichainToken | undefined
  /** The registry + rollout-flag filtered networks, volume-first; every per-row network surface reads this. */
  chainIdsByVolume: UniverseChainId[]
  tokenDescription: ReactElement
  percentChange1hr: ReactElement
  percentChange1d: ReactElement
  fdv: string
  fdvRawValue?: number
  volume: string
  volumeRawValue?: number
  sparkline: ReactElement
  link: string
  /** Used for pre-loading TDP with logo to extract color from */
  linkState: { preloadedLogoSrc?: string }
}
