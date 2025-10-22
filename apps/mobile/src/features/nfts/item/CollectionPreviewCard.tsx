import { GraphQLApi } from '@universe/api'
import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader } from 'src/components/loading/loaders'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { RotatableChevron, Verified } from 'ui/src/components/icons'
import { iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { NFTViewer } from 'uniswap/src/components/nfts/images/NFTViewer'
import { NFTItem } from 'uniswap/src/features/nfts/types'

type Collection = NonNullable<
  NonNullable<NonNullable<GraphQLApi.NftItemScreenQuery['nftAssets']>>['edges'][0]
>['node']['collection']

interface CollectionPreviewCardProps {
  collection: GraphQLApi.Maybe<Collection>
  fallbackData?: NFTItem
  onPress: () => void
  loading: boolean
  shouldDisableLink?: boolean
}
export function CollectionPreviewCard({
  collection,
  fallbackData,
  onPress,
  loading,
  shouldDisableLink,
}: CollectionPreviewCardProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  if (loading || (!collection && !fallbackData?.name)) {
    return <Loader.Box borderRadius="$rounded16" height={spacing.spacing60} />
  }

  const isViewableCollection = !shouldDisableLink && Boolean(collection || fallbackData?.contractAddress)

  return (
    <TouchableArea disabled={!isViewableCollection} onPress={onPress}>
      <Flex
        row
        alignItems="center"
        backgroundColor={colors.surface2.val}
        borderRadius="$rounded16"
        gap="$spacing8"
        justifyContent="space-between"
        px="$spacing12"
        py="$spacing12"
      >
        <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
          {collection?.image?.url ? (
            <Flex borderRadius="$roundedFull" height={imageSizes.image40} overflow="hidden" width={imageSizes.image40}>
              <NFTViewer squareGridView maxHeight={spacing.spacing60} uri={collection.image.url} />
            </Flex>
          ) : null}
          <Flex shrink>
            <Flex grow row alignItems="center" gap="$spacing8">
              {/* Width chosen to ensure truncation of collection name on both small
                and large screens with sufficient padding */}
              <Flex shrink>
                <Text color={colors.neutral1.val} numberOfLines={1} variant="subheading2">
                  {collection?.name || fallbackData?.collectionName || '-'}
                </Text>
              </Flex>
              {collection?.isVerified && <Verified color="$accent1" size="$icon.16" />}
            </Flex>
            {collection?.markets?.[0]?.floorPrice && (
              <Flex row gap="$spacing4">
                <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                  {t('tokens.nfts.collection.label.priceFloor')}:
                </Text>
                <PriceAmount
                  iconColor="$neutral2"
                  price={{
                    value: collection.markets[0].floorPrice.value,
                    currency: GraphQLApi.Currency.Eth,
                  }}
                  textColor="$neutral2"
                  textVariant="subheading2"
                />
              </Flex>
            )}
          </Flex>
        </Flex>
        {isViewableCollection ? (
          <RotatableChevron color="$neutral1" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
        ) : null}
      </Flex>
    </TouchableArea>
  )
}
