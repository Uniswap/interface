import { skipToken } from '@reduxjs/toolkit/dist/query'
import { utils } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SharedElement } from 'react-navigation-shared-element'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { Masonry } from 'src/components/layout/Masonry'
import { Section } from 'src/components/layout/Section'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
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
  // avoid relayouts which causes an jitter with shared elements
  const insets = useSafeAreaInsets()

  return (
    <Box
      bg="mainBackground"
      flex={1}
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <NFTMasonry expanded count={50} owner={owner} />
    </Box>
  )
}
export function NFTMasonry({
  expanded,
  count,
  owner,
}: {
  count?: number
  expanded?: boolean
  owner?: string
}) {
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const { t } = useTranslation()

  const { currentData: nftsByCollection, isLoading: loading } = useNftBalancesQuery(
    activeAddress ? { owner: activeAddress } : skipToken
  )
  const nftItems = useMemo(
    () =>
      Object.values(nftsByCollection ?? {})
        .slice(0, count)
        .flat(),
    [count, nftsByCollection]
  )

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
    <Section.Container>
      {nftItems.length === 0 ? (
        <Section.EmptyState
          buttonLabel={t('Explore')}
          description={t(
            'Buy tokens on any Uniswap supported chains to start building your all-in-one portfolio and wallet.'
          )}
          title={t('Explore NFTs')}
          onPress={() => {
            // TODO: figure out how to navigate to explore
          }}
        />
      ) : (
        <SharedElement id="portfolio-nfts-header">
          <Flex gap="xs">
            <Section.Header
              buttonLabel={t('View all')}
              expanded={Boolean(expanded)}
              title={t('NFTs')}
              onMaximize={() => navigation.navigate(Screens.PortfolioNFTs, { owner })}
              onMinimize={() => navigation.canGoBack() && navigation.goBack()}
            />
            <Masonry
              data={nftItems}
              getKey={({ asset_contract, token_id }) =>
                getNFTAssetKey(asset_contract.address, token_id)
              }
              loading={loading}
              renderItem={renderItem}
            />
          </Flex>
        </SharedElement>
      )}
    </Section.Container>
  )
}
