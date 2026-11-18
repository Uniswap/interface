import { atomWithReset } from 'jotai/utils'
import type { AuctionSortField } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'

export const auctionSortMethodAtom = atomWithReset<AuctionSortField | undefined>(undefined)
export const auctionSortAscendingAtom = atomWithReset<boolean>(false)
