import { skipToken } from '@reduxjs/toolkit/dist/query'
import { utils } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Masonry } from 'src/components/layout/Masonry'
import { ScrollDetailScreen } from 'src/components/layout/ScrollDetailScreen'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { Text } from 'src/components/Text'
import { PollingInterval } from 'src/constants/misc'
import { useNftBalancesQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'

const IMAGE_SIZE_RATIO = 2.4

export function PortfolioNFTsScreen({
  route: {
    params: { owner },
  },
}: HomeStackScreenProp<Screens.PortfolioNFTs>) {
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const { t } = useTranslation()

  const { currentData: nftsByCollection, isLoading: loading } = useNftBalancesQuery(
    activeAddress ? { owner: activeAddress } : skipToken,
    { pollingInterval: PollingInterval.Normal }
  )
  const nftItems = useMemo(() => Object.values(nftsByCollection ?? {}).flat(), [nftsByCollection])

  const onPressItem = useCallback(
    (asset: NFTAsset.Asset) => {
      navigation.navigate(Screens.NFTItem, {
        owner: activeAddress ?? '',
        address: utils.getAddress(asset.asset_contract.address),
        token_id: asset.token_id,
      })
    },
    [activeAddress, navigation]
  )

  const renderItem = useCallback(
    (asset: NFTAsset.Asset) => {
      const key = getNFTAssetKey(asset.asset_contract.address, asset.token_id)
      return (
        <Button onPress={() => onPressItem(asset)}>
          <NFTAssetItem id={key} nft={asset} size={dimensions.fullWidth / IMAGE_SIZE_RATIO} />
        </Button>
      )
    },
    [onPressItem]
  )

  return (
    <ScrollDetailScreen
      contentHeader={
        <Text mb="md" mx="xs" variant="headlineSmall">
          {t('Your NFTs')}
        </Text>
      }
      title={t('Your NFTs')}>
      <Masonry
        data={nftItems}
        getKey={({ asset_contract, token_id }) => getNFTAssetKey(asset_contract.address, token_id)}
        loading={loading}
        renderItem={renderItem}
      />
    </ScrollDetailScreen>
  )
}
