import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader } from 'src/components/loading'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import VerifiedIcon from 'ui/src/assets/icons/verified.svg'
import { iconSizes, imageSizes, spacing } from 'ui/src/theme'
import {
  Currency,
  NftItemScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { NFTItem } from 'wallet/src/features/nfts/types'

export type Collection = NonNullable<
  NonNullable<NonNullable<NftItemScreenQuery['nftAssets']>>['edges'][0]
>['node']['collection']

interface CollectionPreviewCardProps {
  collection: Maybe<Collection>
  fallbackData?: NFTItem
  onPress: () => void
  loading: boolean
}
export function CollectionPreviewCard({
  collection,
  fallbackData,
  onPress,
  loading,
}: CollectionPreviewCardProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  if (loading || (!collection && !fallbackData?.name)) {
    return <Loader.Box borderRadius="$rounded16" height={spacing.spacing60} />
  }

  const isViewableCollection = Boolean(collection || fallbackData?.contractAddress)

  return (
    <TouchableArea hapticFeedback disabled={!isViewableCollection} onPress={onPress}>
      <Flex
        row
        alignItems="center"
        backgroundColor="$surface3"
        borderRadius="$rounded16"
        gap="$spacing8"
        justifyContent="space-between"
        px="$spacing12"
        py="$spacing12">
        <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
          {collection?.image?.url ? (
            <Flex
              borderRadius="$roundedFull"
              height={imageSizes.image40}
              overflow="hidden"
              width={imageSizes.image40}>
              <NFTViewer squareGridView maxHeight={spacing.spacing60} uri={collection.image.url} />
            </Flex>
          ) : null}
          <Flex shrink>
            <Flex grow row alignItems="center" gap="$spacing8">
              {/* Width chosen to ensure truncation of collection name on both small
                and large screens with sufficient padding */}
              <Flex shrink>
                <Text color="$neutral1" numberOfLines={1} variant="body1">
                  {collection?.name || fallbackData?.collectionName || '-'}
                </Text>
              </Flex>
              {collection?.isVerified && (
                <VerifiedIcon
                  color={colors.accent1.get()}
                  height={iconSizes.icon16}
                  width={iconSizes.icon16}
                />
              )}
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
                    currency: Currency.Eth,
                  }}
                  textColor="$neutral2"
                  textVariant="subheading2"
                />
              </Flex>
            )}
          </Flex>
        </Flex>
        {isViewableCollection ? (
          <Icons.RotatableChevron
            color="$neutral1"
            direction="end"
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        ) : null}
      </Flex>
    </TouchableArea>
  )
}
