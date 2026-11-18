import { useAtom } from 'jotai'
import { useEvent } from 'utilities/src/react/hooks'
import { OrderDirection } from '~/data/util'
import {
  auctionSortAscendingAtom,
  auctionSortMethodAtom,
} from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/state/auctionSortAtoms'
import type { AuctionSortField } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'

export function useAuctionTableSort(onSort?: () => void): {
  sortMethod: AuctionSortField | undefined
  sortAscending: boolean
  orderDirection: OrderDirection
  createSortHandler: (newSortMethod: AuctionSortField) => () => void
} {
  const [sortMethod, setSortMethod] = useAtom(auctionSortMethodAtom)
  const [sortAscending, setSortAscending] = useAtom(auctionSortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc

  const createSortHandler = useEvent((newSortMethod: AuctionSortField) => () => {
    if (sortMethod === newSortMethod) {
      setSortAscending((prev) => !prev)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
    onSort?.()
  })

  return { sortMethod, sortAscending, orderDirection, createSortHandler }
}
