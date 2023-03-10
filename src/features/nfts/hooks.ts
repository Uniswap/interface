import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { PollingInterval } from 'src/constants/misc'
import { uniswapUrls } from 'src/constants/urls'
import { NftsQuery, useNftsQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { selectHiddenNfts } from 'src/features/favorites/selectors'
import { HiddenNftsByAddress, toggleNftVisibility } from 'src/features/favorites/slice'
import { NFTItem } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { useAccounts } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'

export const HIDDEN_NFTS_ROW_LEFT_ITEM = 'HIDDEN_NFTS_ROW_LEFT_ITEM'
export const HIDDEN_NFTS_ROW_RIGHT_ITEM = 'HIDDEN_NFTS_ROW_RIGHT_ITEM'
export const EMPTY_NFT_ITEM = 'EMPTY_NFT_ITEM'

export type GQLNftAsset = NonNullable<
  NonNullable<NonNullable<NonNullable<NftsQuery['portfolios']>[0]>['nftBalances']>[0]
>['ownedAsset']

// TODO(MOB-3390): deprecate this hook in favor of component queries
export function useNFT(
  owner: Address = '',
  address?: Address,
  tokenId?: string
): GqlResult<GQLNftAsset> {
  // TODO: [MOB-3893] do a direct cache lookup in Apollo using id instead of re-querying
  const { data, loading, refetch } = useNftsQuery({
    variables: { ownerAddress: owner },
    pollInterval: PollingInterval.Slow,
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

interface NFTMenuParams {
  tokenId?: string
  contractAddress?: Address
  owner: Address
}

function shouldHideNft(
  hiddenNfts: HiddenNftsByAddress,
  owner: Address,
  contractAddress?: Address,
  tokenId?: string
): boolean {
  return !!(
    contractAddress &&
    tokenId &&
    !!hiddenNfts[owner]?.[getNFTAssetKey(contractAddress, tokenId)]
  )
}

export function useNFTMenu({ contractAddress, tokenId, owner }: NFTMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
  onlyShare: boolean
} {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const isLocalAccount = !!accounts[owner]

  const isShareable = contractAddress && tokenId
  const hiddenNfts = useAppSelector(selectHiddenNfts)
  const hidden = shouldHideNft(hiddenNfts, owner, contractAddress, tokenId)

  const menuActions = useMemo(
    () => [
      ...((isShareable && [
        {
          title: t('Share'),
          systemIcon: 'square.and.arrow.up',
          onPress: async (): Promise<void> => {
            if (!isShareable) return
            try {
              await Share.share({
                message: `${uniswapUrls.nftUrl}/asset/${contractAddress}/${tokenId}`,
              })
            } catch (e) {
              logger.error('NFTItemScreen', 'onShare', (e as unknown as Error).message)
            }
          },
        },
      ]) ||
        []),
      ...((isLocalAccount && [
        {
          title: hidden ? t('Unhide NFT') : t('Hide NFT'),
          systemIcon: hidden ? 'eye' : 'eye.slash',
          destructive: !hidden,
          onPress: (): void => {
            if (contractAddress && tokenId) {
              dispatch(toggleNftVisibility({ owner, contractAddress, tokenId }))
            }
          },
        },
      ]) ||
        []),
    ],
    [contractAddress, dispatch, hidden, isLocalAccount, isShareable, owner, t, tokenId]
  )

  const onContextMenuPress = useCallback(
    (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): void => {
      menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress, onlyShare: !!isShareable && !isLocalAccount }
}

// Apply to NFTs fetched from API hidden filter, which is stored in Redux
export function useGroupNftsByVisibility(
  nftDataItems: Array<NFTItem>,
  showHidden: boolean,
  owner: Address
): {
  nfts: Array<NFTItem | string>
  numHidden: number
} {
  const hiddenNfts = useAppSelector(selectHiddenNfts)
  return useMemo(() => {
    const { shown, hidden } = nftDataItems.reduce<{
      shown: NFTItem[]
      hidden: NFTItem[]
    }>(
      (acc, item) => {
        if (shouldHideNft(hiddenNfts, owner, item.contractAddress, item.tokenId)) {
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
    }
  }, [hiddenNfts, nftDataItems, owner, showHidden])
}
