import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { PollingInterval } from 'src/constants/misc'
import { uniswapUrls } from 'src/constants/urls'
import { NftsQuery, useNftsQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'
import { useAccounts } from 'src/features/wallet/hooks'
import { logger } from 'src/utils/logger'

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

export function useNFTMenu({ contractAddress, tokenId, owner }: NFTMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
  onlyShare: boolean
} {
  const { t } = useTranslation()
  const accounts = useAccounts()
  const isLocalAccount = !!accounts[owner]

  const isShareable = contractAddress && tokenId

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
          title: t('Hide NFT'),
          systemIcon: 'eye.slash',
          destructive: true,
          onPress: (): void => {
            // TODO: add Hide/Unhide logic
            // https://uniswaplabs.atlassian.net/browse/MOB-3966
          },
        },
      ]) ||
        []),
    ],
    [contractAddress, isLocalAccount, isShareable, t, tokenId]
  )

  const onContextMenuPress = useCallback(
    (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): void => {
      menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress, onlyShare: !!isShareable && !isLocalAccount }
}
