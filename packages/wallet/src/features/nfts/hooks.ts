import { useMemo } from 'react'
import {
  NftsQuery,
  useNftsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { PollingInterval } from 'wallet/src/constants/misc'
import { selectNftsData } from 'wallet/src/features/favorites/selectors'
import { AccountToNftData } from 'wallet/src/features/favorites/slice'
import {
  EMPTY_NFT_ITEM,
  HIDDEN_NFTS_ROW_LEFT_ITEM,
  HIDDEN_NFTS_ROW_RIGHT_ITEM,
} from 'wallet/src/features/nfts/constants'
import { NFTItem, NftData } from 'wallet/src/features/nfts/types'
import { getNFTAssetKey } from 'wallet/src/features/nfts/utils'
import { useAppSelector } from 'wallet/src/state'

export type GQLNftAsset = NonNullable<
  NonNullable<NonNullable<NonNullable<NftsQuery['portfolios']>[0]>['nftBalances']>[0]
>['ownedAsset']

export function useNFT(
  owner: Address = '',
  address?: Address,
  tokenId?: string
): GqlResult<GQLNftAsset> {
  // TODO: [MOB-227] do a direct cache lookup in Apollo using id instead of re-querying
  const { data, loading, refetch } = useNftsQuery({
    variables: { ownerAddress: owner },
    pollInterval: PollingInterval.Slow,
    skip: !owner,
  })

  const nft = useMemo(
    () =>
      data?.portfolios?.[0]?.nftBalances?.find(
        (balance) =>
          balance?.ownedAsset?.nftContract?.address === address &&
          balance?.ownedAsset?.tokenId === tokenId
      )?.ownedAsset ?? undefined,
    [data, address, tokenId]
  )

  return { data: nft, loading, refetch }
}

export function isNftHidden(nftData: NftData, isSpam?: boolean): boolean {
  return Boolean(nftData.isHidden || (isSpam && !nftData.isSpamIgnored))
}

export function shouldHideNft({
  nftsData,
  owner,
  contractAddress,
  tokenId,
  isSpam,
}: {
  nftsData: AccountToNftData
  owner: Address
  contractAddress: Address
  tokenId: string
  isSpam?: boolean
}): boolean {
  const nftKey = getNFTAssetKey(contractAddress, tokenId)
  const nftData = nftsData[owner]?.[nftKey] ?? {}
  return isNftHidden(nftData, isSpam)
}

// Apply to NFTs fetched from API hidden filter, which is stored in Redux
export function useGroupNftsByVisibility(
  nftDataItems: Array<NFTItem> | undefined,
  showHidden: boolean,
  owner: Address
): {
  nfts: Array<NFTItem | string>
  numHidden: number
  numShown: number
} {
  const nftsData = useAppSelector(selectNftsData)
  return useMemo(() => {
    const { shown, hidden } = (nftDataItems ?? []).reduce<{
      shown: NFTItem[]
      hidden: NFTItem[]
    }>(
      (acc, item) => {
        if (
          item.contractAddress &&
          item.tokenId &&
          shouldHideNft({
            nftsData,
            owner,
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            isSpam: item.isSpam,
          })
        ) {
          acc.hidden.push(item)
        } else {
          acc.shown.push(item)
        }
        return acc
      },
      { shown: [], hidden: [] }
    )
    return {
      nfts: [
        ...shown,
        ...((hidden.length && [
          // to fill the gap for odd number of shown elements in 2 columns layout
          ...(shown.length % 2 ? [EMPTY_NFT_ITEM] : []),
          HIDDEN_NFTS_ROW_LEFT_ITEM,
          HIDDEN_NFTS_ROW_RIGHT_ITEM,
        ]) ||
          []),
        ...((showHidden && hidden) || []),
      ],
      numHidden: hidden.length,
      numShown: shown.length,
    }
  }, [nftDataItems, nftsData, owner, showHidden])
}
