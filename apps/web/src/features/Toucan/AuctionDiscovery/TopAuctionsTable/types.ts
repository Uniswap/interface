import type { ReactElement } from 'react'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import type { ProjectedFdvTableValue } from '~/features/Toucan/utils/computeProjectedFdv'

/**
 * Sort fields for auction table
 */
export enum AuctionSortField {
  FDV = 'FDV',
  COMMITTED_VOLUME = 'Committed Volume',
  LAUNCH_THRESHOLD = 'Launch Threshold',
  TIME_REMAINING = 'Time Remaining',
}

export interface SortableTopAuctionTableValue {
  auction: EnrichedAuction
  projectedFdv: ProjectedFdvTableValue
}

export interface TopAuctionsTableValue extends SortableTopAuctionTableValue {
  index: number
  tokenName: ReactElement
  link: string
  /** Set for external links (quick launches route out to pools.trade) — opens in a new tab. */
  linkTarget?: '_blank'
}

/** Launchpad identity rendered in the optional Launchpad column (see `ToucanTable.launchpad`). */
export interface AuctionLaunchpadDisplay {
  label: string
  logoUrl?: string
  /** True while the launchpad registry is still resolving the logo (renders a skeleton instead of the letter fallback). */
  logoLoading?: boolean
}
