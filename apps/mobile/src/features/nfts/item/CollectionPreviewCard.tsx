import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { NFTItem } from 'src/features/nfts/types'
import { Flex, Icons, useSporeColors } from 'ui/src'
import VerifiedIcon from 'ui/src/assets/icons/verified.svg'
import { iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { Currency, NftItemScreenQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

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
              gap="$none"
              height={imageSizes.image40}
              overflow="hidden"
              width={imageSizes.image40}>
              <NFTViewer squareGridView maxHeight={spacing.spacing60} uri={collection.image.url} />
            </Flex>
          ) : null}
          <Flex shrink gap="$none">
            <Flex grow row alignItems="center" gap="$spacing8">
              {/* Width chosen to ensure truncation of collection name on both small
                and large screens with sufficient padding */}
              <Flex shrink gap="$none">
                <Text color="neutral1" numberOfLines={1} variant="bodyLarge">
                  {collection?.name || fallbackData?.name || '-'}
                </Text>
              </Flex>
              {collection?.isVerified && (
                <VerifiedIcon
                  color={colors.accent1.val}
                  height={iconSizes.icon16}
                  width={iconSizes.icon16}
                />
              )}
            </Flex>
            {collection?.markets?.[0]?.floorPrice?.value && (
              <Flex row gap="$spacing4">
                <Text color="neutral2" numberOfLines={1} variant="subheadSmall">
                  {t('Floor')}:
                </Text>
                <PriceAmount
                  iconColor="neutral2"
                  price={{
                    id: collection?.markets?.[0].floorPrice.id,
                    value: collection.markets[0].floorPrice.value,
                    currency: Currency.Eth,
                  }}
                  textColor="neutral2"
                  textVariant="subheadSmall"
                />
              </Flex>
            )}
          </Flex>
        </Flex>
        {isViewableCollection ? (
          <Icons.RotatableChevron
            color="$neutral1"
            direction="e"
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        ) : null}
      </Flex>
    </TouchableArea>
  )
}
