import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { TabEmptyState } from 'src/components/home/TabEmptyState'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { GridRecyclerList } from 'src/components/layout/GridRecyclerList'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { PollingInterval } from 'src/constants/misc'
import { useNftBalancesQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

const MAX_NFT_IMAGE_SIZE = 375

export function NFTCollectionsTab({
  owner,
  tabViewScrollProps,
  loadingContainerStyle,
}: {
  owner?: string
  tabViewScrollProps: TabViewScrollProps
  loadingContainerStyle?: ViewStyle
}) {
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
        address: asset.asset_contract.address,
        token_id: asset.token_id,
      })
    },
    [activeAddress, navigation]
  )

  const renderItem = useCallback(
    (asset: NFTAsset.Asset) => {
      return (
        <Box flex={1} justifyContent="flex-start" m="xxs">
          <Button activeOpacity={1} onPress={() => onPressItem(asset)}>
            <Box
              alignItems="center"
              aspectRatio={1}
              borderRadius="md"
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ overflow: 'hidden' }}
              width="100%">
              <NFTViewer
                maxHeight={MAX_NFT_IMAGE_SIZE}
                placeholderContent={asset.name || asset.collection.name}
                squareGridView={true}
                uri={asset.image_url}
              />
            </Box>
            <Flex gap="none" py="sm">
              <Text ellipsizeMode="tail" numberOfLines={1} variant="subheadSmall">
                {asset.name}
              </Text>
              <Text variant="bodySmall">{asset.collection.name}</Text>
            </Flex>
          </Button>
        </Box>
      )
    },
    [onPressItem]
  )

  return (
    <View>
      {loading ? (
        <>
          {/* TODO(daniel): replace this with an NFT loader type once it's implemented */}
          <View style={loadingContainerStyle}>
            <Loading />
          </View>
        </>
      ) : nftItems.length === 0 ? (
        <TabEmptyState
          description={t('Any NFTs that you receive, mint, or buy will appear here.')}
          style={loadingContainerStyle}
          title={t('No NFTs yet')}
        />
      ) : (
        <GridRecyclerList
          data={nftItems}
          getKey={({ asset_contract, token_id }) =>
            getNFTAssetKey(asset_contract.address, token_id)
          }
          renderItem={renderItem}
          tabViewScrollProps={tabViewScrollProps}
        />
      )}
    </View>
  )
}
