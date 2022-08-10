import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Masonry } from 'src/components/layout/Masonry'
import { PollingInterval } from 'src/constants/misc'
import { useNftBalancesQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { getAddress } from 'src/utils/addresses'

export function PortfolioNFTsSection({ count, owner }: { count?: number; owner?: string }) {
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const { t } = useTranslation()

  const { currentData: nftsByCollection, isLoading: loading } = useNftBalancesQuery(
    activeAddress ? { owner: activeAddress } : skipToken,
    { pollingInterval: PollingInterval.Normal }
  )
  const { nftItems, totalCount } = useMemo(() => {
    const allItems = Object.values(nftsByCollection ?? {}).flat()
    return {
      nftItems: allItems.slice(0, count),
      totalCount: allItems.length,
    }
  }, [count, nftsByCollection])

  const onPressItem = useCallback(
    (asset: NFTAsset.Asset) => {
      navigation.navigate(Screens.NFTItem, {
        owner: activeAddress ?? '',
        address: getAddress(asset.asset_contract.address),
        token_id: asset.token_id,
      })
    },
    [activeAddress, navigation]
  )

  const renderItem = useCallback(
    (asset: NFTAsset.Asset) => {
      return (
        <Button activeOpacity={1} onPress={() => onPressItem(asset)}>
          <NFTViewer placeholderContent={asset.name} uri={asset.image_url} />
        </Button>
      )
    },
    [onPressItem]
  )

  return (
    <BaseCard.Container>
      {nftItems.length === 0 ? (
        <BaseCard.EmptyState
          description={t('Any NFTs that you receive, mint, or buy will appear here.')}
          title={t('No NFTs yet')}
        />
      ) : (
        <>
          <BaseCard.Header
            borderBottomWidth={0}
            title={t('NFTs ({{totalCount}})', { totalCount })}
            onPress={() => navigation.navigate(Screens.PortfolioNFTs, { owner })}
          />
          <Masonry
            data={nftItems}
            getKey={({ asset_contract, token_id }) =>
              getNFTAssetKey(asset_contract.address, token_id)
            }
            loading={loading}
            renderItem={renderItem}
          />
        </>
      )}
    </BaseCard.Container>
  )
}
