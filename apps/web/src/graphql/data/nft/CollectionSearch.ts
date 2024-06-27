import { isAddress } from '@ethersproject/address'
import { GenieCollection } from 'nft/types'
import { blocklistedCollections } from 'nft/utils'
import { useMemo } from 'react'
import {
  NftCollection,
  useCollectionSearchQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { formatCollectionQueryData, useCollection } from './Collection'

const MAX_SEARCH_RESULTS = 6

interface useCollectionSearchReturnProps {
  data: GenieCollection[]
  loading: boolean
}

function useCollectionQuerySearch(query: string, skip?: boolean): useCollectionSearchReturnProps {
  const { data: queryData, loading } = useCollectionSearchQuery({
    variables: {
      query,
    },
    skip: skip || !query,
  })

  return useMemo(() => {
    return {
      data:
        queryData?.nftCollections?.edges
          ?.filter(
            (collectionEdge) =>
              collectionEdge.node.nftContracts?.[0]?.address &&
              !blocklistedCollections.includes(collectionEdge.node.nftContracts?.[0]?.address)
          )
          .slice(0, MAX_SEARCH_RESULTS)
          .map((collectionEdge) => {
            const queryCollection = collectionEdge.node as NonNullable<NftCollection>
            return formatCollectionQueryData(queryCollection)
          }) ?? [],
      loading,
    }
  }, [loading, queryData])
}

export function useCollectionSearch(queryOrAddress: string): useCollectionSearchReturnProps {
  const isName = !isAddress(queryOrAddress.toLowerCase())
  const queryResult = useCollectionQuerySearch(queryOrAddress, /* skip= */ !isName)
  const addressResult = useCollection(queryOrAddress, /* skip= */ isName)
  const invalidCollectionAddress =
    blocklistedCollections.includes(queryOrAddress) || !addressResult.data.stats?.total_supply
  return isName
    ? queryResult
    : invalidCollectionAddress
    ? { data: [], loading: false }
    : { data: [addressResult.data], loading: addressResult.loading }
}
