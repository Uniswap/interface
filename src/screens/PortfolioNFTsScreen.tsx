import { skipToken } from '@reduxjs/toolkit/dist/query'
import { utils } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import ListIcon from 'src/assets/icons/list.svg'
import MasonryIcon from 'src/assets/icons/masonry.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Masonry } from 'src/components/layout/Masonry'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { NFTGroupByCollection } from 'src/components/NFT/NFTGroupByCollection'
import { Text } from 'src/components/Text'
import { PollingInterval } from 'src/constants/misc'
import { useNftBalancesQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { theme } from 'src/styles/theme'

const MAX_NFT_IMAGE_SIZE = 375

export function PortfolioNFTsScreen({
  route: {
    params: { owner },
  },
}: HomeStackScreenProp<Screens.PortfolioNFTs>) {
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress

  // TODO: move this out of the local state and into the wallet settings redux store
  const [isGridView, setIsGridView] = useState(true)

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
      return (
        <Button activeOpacity={1} alignItems="center" onPress={() => onPressItem(asset)}>
          <NFTViewer
            maxHeight={MAX_NFT_IMAGE_SIZE}
            placeholderContent={asset.name}
            uri={asset.image_url}
          />
        </Button>
      )
    },
    [onPressItem]
  )

  const isOtherOwner = owner && owner !== accountAddress

  return (
    <HeaderScrollScreen
      contentHeader={
        <Flex gap="md">
          {isOtherOwner ? (
            <BackHeader>
              <AddressDisplay address={owner} color="textSecondary" size={16} variant="subhead" />
            </BackHeader>
          ) : (
            <BackButton showButtonLabel />
          )}
          <Flex row alignItems="center" mb="md">
            <Flex grow>
              <Text mx="xs" variant="headlineSmall">
                {isOtherOwner ? t('NFTs') : t('Your NFTs')}
              </Text>
            </Flex>
            <IconButton
              icon={
                isGridView ? (
                  <ListIcon color={theme.colors.textSecondary} height={24} width={24} />
                ) : (
                  <MasonryIcon color={theme.colors.textSecondary} height={24} width={24} />
                )
              }
              onPress={() => setIsGridView(!isGridView)}
            />
          </Flex>
        </Flex>
      }
      fixedHeader={
        <BackHeader>
          {isOtherOwner ? (
            <Flex centered gap="none">
              <AddressDisplay address={owner} size={16} variant="subhead" />
              <Text color="accentTextLightSecondary" variant="subheadSmall">
                {t('NFTs')}
              </Text>
            </Flex>
          ) : (
            <Text variant="subhead">{t('Your NFTs')}</Text>
          )}
        </BackHeader>
      }>
      {isGridView ? (
        <Masonry
          data={nftItems}
          getKey={({ asset_contract, token_id }) =>
            getNFTAssetKey(asset_contract.address, token_id)
          }
          loading={loading}
          renderItem={renderItem}
        />
      ) : (
        <NFTGroupByCollection nftAssets={nftItems} owner={activeAddress} />
      )}
    </HeaderScrollScreen>
  )
}
