import { skipToken } from '@reduxjs/toolkit/dist/query'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp } from 'src/app/navigation/types'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Masonry } from 'src/components/layout/Masonry'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { PollingInterval } from 'src/constants/misc'
import { useNftBalancesQuery, useNftCollectionQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { useActiveAccount, useDisplayName } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { formatNumber } from 'src/utils/format'
import { openUri } from 'src/utils/linking'

interface Props {
  collection?: NFTAsset.Collection
  collectionName: string
}

function NFTCollectionHeader({ collection, collectionName }: Props) {
  const { t } = useTranslation()
  const appTheme = useAppTheme()

  return (
    <Trace section={SectionName.NFTCollectionHeader}>
      <Flex gap="lg">
        <Flex gap="sm">
          {/* Collection image and name */}
          <Flex alignItems="center" gap="sm">
            {collection?.image_url && (
              <Box borderRadius="full" height={48} overflow="hidden" width={48}>
                <NFTViewer uri={collection?.image_url} />
              </Box>
            )}
            <Flex centered row gap="xxs">
              <Text color="textPrimary" variant="headlineSmall">
                {collectionName}
              </Text>
              {collection?.safelist_request_status === 'verified' && (
                <VerifiedIcon height={22} width={22} />
              )}
            </Flex>
          </Flex>

          {/* Collection stats */}
          <Flex flexDirection="row" gap="xl">
            <Flex fill alignItems="center" gap="xxs">
              <Text color="textTertiary" variant="bodySmall">
                {t('Items')}
              </Text>
              {collection?.stats.total_supply && (
                <Text variant="subhead">{formatNumber(collection?.stats.total_supply)}</Text>
              )}
            </Flex>
            <Flex fill alignItems="center" gap="xxs">
              <Text color="textTertiary" variant="bodySmall">
                {t('Owners')}
              </Text>
              {collection?.stats.num_owners && (
                <Text variant="subhead">{formatNumber(collection?.stats.num_owners)}</Text>
              )}
            </Flex>
            {collection?.stats.floor_price && (
              <Flex fill alignItems="center" gap="xxs">
                <Text color="textTertiary" variant="bodySmall">
                  {t('Floor')}
                </Text>
                <Text variant="subhead">
                  {t('{{price}} ETH', { price: formatNumber(collection?.stats.floor_price) })}
                </Text>
              </Flex>
            )}
          </Flex>

          {/* Collection description */}
          {collection?.description && (
            <LongText color="textPrimary" text={collection?.description} variant="bodySmall" />
          )}

          {/* Collection links */}
          <Flex flexDirection="row" gap="md">
            {collection?.external_url && (
              <Button
                borderRadius="md"
                name={ElementName.NFTCollectionWebsite}
                testID={ElementName.NFTCollectionWebsite}
                onPress={() => openUri(collection.external_url)}>
                <Text color="accentAction" fontWeight="600" variant="caption">
                  {t('Website ↗')}
                </Text>
              </Button>
            )}
            {collection?.twitter_username && (
              <Button
                borderRadius="md"
                name={ElementName.NFTCollectionTwitter}
                testID={ElementName.NFTCollectionTwitter}
                onPress={() => openUri(`https://twitter.com/${collection?.twitter_username}`)}>
                <Text color="accentAction" fontWeight="600" variant="caption">
                  {t('Twitter ↗')}
                </Text>
              </Button>
            )}
            {collection?.discord_url && (
              <Button
                borderRadius="md"
                name={ElementName.NFTCollectionDiscord}
                testID={ElementName.NFTCollectionDiscord}
                onPress={() => openUri(collection.discord_url)}>
                <Text color="accentAction" fontWeight="600" variant="caption">
                  {t('Discord ↗')}
                </Text>
              </Button>
            )}
          </Flex>
          <Button
            borderColor="backgroundOutline"
            borderRadius="md"
            borderWidth={1}
            name={ElementName.NFTCollectionViewOnOpensea}
            py="sm"
            testID={ElementName.NFTCollectionViewOnOpensea}
            onPress={() => openUri(`https://opensea.io/collection/${collection?.slug}`)}>
            <Flex alignItems="center" flexDirection="row" gap="xs" justifyContent="center">
              <OpenSeaIcon color={appTheme.colors.textPrimary} height={20} width={20} />
              <Text fontWeight="600" variant="mediumLabel">
                {t('View Collection on Opensea')}
              </Text>
            </Flex>
          </Button>
        </Flex>
      </Flex>
    </Trace>
  )
}

export function NFTCollectionScreen({
  navigation,
  route,
}: HomeStackScreenProp<Screens.NFTCollection>) {
  const { t } = useTranslation()

  const activeAddress = useActiveAccount()?.address
  const { collectionAddress, slug, owner = activeAddress } = route.params

  const ownerDisplayName = useDisplayName(owner)

  const { currentData: nftsByCollection, isLoading: isLoadingAssets } = useNftBalancesQuery(
    owner ? { owner } : skipToken,
    { pollingInterval: PollingInterval.Normal }
  )
  const nftAssets = nftsByCollection?.[collectionAddress]

  const { currentData: collection, isLoading: collectionLoading } = useNftCollectionQuery(
    {
      openseaSlug: slug,
    },
    {
      pollingInterval: PollingInterval.Normal,
    }
  )

  const onPressMasonryItem = useCallback(
    (asset: NFTAsset.Asset) => {
      navigation.navigate(Screens.NFTItem, {
        owner: owner ?? '',
        address: asset.asset_contract.address,
        token_id: asset.token_id,
      })
    },
    [owner, navigation]
  )

  const renderMasonryItem = useCallback(
    (asset: NFTAsset.Asset) => {
      return (
        <Button activeOpacity={1} alignItems="center" onPress={() => onPressMasonryItem(asset)}>
          <NFTViewer maxHeight={375} uri={asset.image_url} />
        </Button>
      )
    },
    [onPressMasonryItem]
  )

  return (
    <HeaderScrollScreen
      contentHeader={<BackButton showButtonLabel />}
      fixedHeader={
        <BackHeader>
          <Text variant="subhead">{collection?.name}</Text>
        </BackHeader>
      }>
      <Flex gap="lg">
        <Box mx="lg">
          {collectionLoading ? (
            <Box mt="xl">
              <Loading repeat={4} type="box" />
            </Box>
          ) : (
            <NFTCollectionHeader collection={collection} collectionName={collection?.name ?? ''} />
          )}
        </Box>
        <Text mx="lg" variant="mediumLabel">
          {owner === activeAddress
            ? t('Your {{collection}}', { collection: collection?.name ?? '' })
            : t("{{owner}}'s NFTs", { owner: ownerDisplayName?.name ?? 'Unknown' })}
        </Text>
        <Masonry
          data={nftAssets ?? []}
          getKey={({ asset_contract, token_id }) =>
            getNFTAssetKey(asset_contract.address, token_id)
          }
          loading={isLoadingAssets}
          renderItem={renderMasonryItem}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}
