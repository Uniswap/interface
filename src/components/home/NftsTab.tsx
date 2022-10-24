import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { useLazyLoadQuery } from 'react-relay'
import { useAppTheme } from 'src/app/hooks'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { Button } from 'src/components/buttons/Button'
import { TabEmptyState } from 'src/components/home/TabEmptyState'
import {
  NftsTabQuery,
  NftsTabQuery$data,
} from 'src/components/home/__generated__/NftsTabQuery.graphql'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { GridRecyclerList } from 'src/components/layout/GridRecyclerList'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { NFTItem } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { Screens } from 'src/screens/Screens'
import { theme as FixedTheme } from 'src/styles/theme'

const MAX_NFT_IMAGE_SIZE = 375

const styles = StyleSheet.create({
  tabContentStyle: {
    paddingHorizontal: FixedTheme.spacing.xs,
    paddingTop: FixedTheme.spacing.sm,
  },
})

const nftsTabQuery = graphql`
  query NftsTabQuery($ownerAddress: String!) {
    portfolios(ownerAddresses: [$ownerAddress]) {
      id
      ownerAddress
      nftBalances {
        ownedAsset {
          id
          collection {
            name
            isVerified
          }
          smallImageUrl
          name
          tokenId
          description
          nftContract {
            address
          }
        }
      }
    }
  }
`

function formatNftItems(data: NftsTabQuery$data | null | undefined): NFTItem[] {
  const items = data?.portfolios?.[0]?.nftBalances?.flat()
  if (!items) return EMPTY_ARRAY
  const nfts = items
    .filter(
      (item) =>
        item?.ownedAsset?.name &&
        item?.ownedAsset?.nftContract?.address &&
        item?.ownedAsset?.tokenId
    )
    .map((item): NFTItem => {
      return {
        name: item?.ownedAsset?.name ?? undefined,
        description: item?.ownedAsset?.description ?? undefined,
        contractAddress: item?.ownedAsset?.nftContract?.address ?? undefined,
        tokenId: item?.ownedAsset?.tokenId ?? undefined,
        imageUrl: item?.ownedAsset?.smallImageUrl ?? undefined,
        collectionName: item?.ownedAsset?.collection?.name ?? undefined,
        isVerifiedCollection: item?.ownedAsset?.collection?.isVerified ?? undefined,
      }
    })
  return nfts
}

export function NftsTab(props: {
  owner: string
  tabViewScrollProps: TabViewScrollProps
  loadingContainerStyle?: ViewStyle
}) {
  return (
    <Suspense
      fallback={
        <View style={props.loadingContainerStyle}>
          <Flex pt="sm">
            <Loading repeat={6} type="nft" />
          </Flex>
        </View>
      }>
      <NftsTabInner {...props} />
    </Suspense>
  )
}

function NftsTabInner({
  owner,
  tabViewScrollProps,
  loadingContainerStyle,
}: {
  owner: string
  tabViewScrollProps: TabViewScrollProps
  loadingContainerStyle?: ViewStyle
}) {
  const navigation = useHomeStackNavigation()
  const { t } = useTranslation()
  const theme = useAppTheme()

  const nftData = useLazyLoadQuery<NftsTabQuery>(
    nftsTabQuery,
    {
      ownerAddress: owner,
    },
    { networkCacheConfig: { poll: PollingInterval.Normal } }
  )
  const nftDataItems = formatNftItems(nftData)

  const onPressItem = useCallback(
    (asset: NFTItem) => {
      navigation.navigate(Screens.NFTItem, {
        owner: owner,
        address: asset.contractAddress ?? '',
        token_id: asset.tokenId ?? '',
      })
    },
    [navigation, owner]
  )

  const renderItem = useCallback(
    (asset: NFTItem) => {
      return (
        <Box flex={1} justifyContent="flex-start" m="xs">
          <Button activeOpacity={1} onPress={() => onPressItem(asset)}>
            <Box
              alignItems="center"
              aspectRatio={1}
              backgroundColor="backgroundOutline"
              borderRadius="md"
              // eslint-disable-next-line react-native/no-inline-styles
              style={{ overflow: 'hidden' }}
              width="100%">
              <NFTViewer
                maxHeight={MAX_NFT_IMAGE_SIZE}
                placeholderContent={asset.name || asset.collectionName}
                squareGridView={true}
                uri={asset.imageUrl ?? ''}
              />
            </Box>
            <Flex gap="none" py="xs">
              <Text ellipsizeMode="tail" numberOfLines={1} variant="bodyLarge">
                {asset.name}
              </Text>
              <Flex row alignItems="center" gap="xs" justifyContent="flex-start">
                <Flex row shrink>
                  <Text ellipsizeMode="tail" numberOfLines={1} variant="bodySmall">
                    {asset.collectionName}
                  </Text>
                </Flex>
                {asset.isVerifiedCollection && (
                  <VerifiedIcon color={theme.colors.userThemeMagenta} height={16} width={16} />
                )}
              </Flex>
              <Text
                color="textSecondary"
                ellipsizeMode="tail"
                numberOfLines={1}
                variant="bodySmall">
                {/* TODO (Thomas): Update when floor price is available from API */}
                1.23 ETH
              </Text>
            </Flex>
          </Button>
        </Box>
      )
    },
    [onPressItem, theme.colors.userThemeMagenta]
  )
  return (
    <View style={styles.tabContentStyle}>
      {nftDataItems.length === 0 ? (
        <TabEmptyState
          description={t('Any NFTs that you receive, mint, or buy will appear here.')}
          style={loadingContainerStyle}
          title={t('No NFTs yet')}
        />
      ) : (
        <GridRecyclerList
          data={nftDataItems}
          getKey={({ contractAddress, tokenId }) => getNFTAssetKey(contractAddress ?? '', tokenId)}
          renderItem={renderItem}
          tabViewScrollProps={tabViewScrollProps}
        />
      )}
    </View>
  )
}
