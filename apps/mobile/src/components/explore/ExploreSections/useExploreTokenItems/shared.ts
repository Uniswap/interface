import { TokenItemData } from 'src/components/explore/TokenItemData'
import { getTokenMetadataDisplayType } from 'src/features/explore/utils'
import { ExploreOrderBy, TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

export type TokenItemDataWithMetadata = {
  tokenItemData: TokenItemData
  tokenMetadataDisplayType: TokenMetadataDisplayType
}

export type ExploreTokenItemsResult = {
  topTokenItems: TokenItemDataWithMetadata[]
  hasData: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => unknown
  isFetching: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
}

export const noopFetchNextPage = (): void => undefined

export function getTokenMetadataDisplayTypeSafe(orderBy: ExploreOrderBy): TokenMetadataDisplayType | null {
  try {
    return getTokenMetadataDisplayType(orderBy)
  } catch {
    return null
  }
}
