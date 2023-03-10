import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { Currency, NftItemScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { iconSizes, imageSizes } from 'src/styles/sizing'

export type Collection = NonNullable<
  NonNullable<NonNullable<NftItemScreenQuery['nftAssets']>>['edges'][0]
>['node']['collection']

interface CollectionPreviewcardProps {
  collection: NullUndefined<Collection>
  onPress: () => void
  loading: boolean
}
export function CollectionPreviewCard({
  collection,
  onPress,
  loading,
}: CollectionPreviewcardProps): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()

  if (loading || !collection) {
    return <Loader.Box borderRadius="rounded16" height={theme.spacing.spacing60} />
  }

  return (
    <TouchableArea hapticFeedback disabled={!collection} onPress={onPress}>
      <Flex
        row
        alignItems="center"
        backgroundColor="textOnDimTertiary"
        borderRadius="rounded16"
        gap="spacing8"
        justifyContent="space-between"
        px="spacing12"
        py="spacing12">
        <Flex row shrink alignItems="center" gap="spacing12" overflow="hidden">
          {collection.image?.url ? (
            <Box
              borderRadius="roundedFull"
              height={imageSizes.image40}
              overflow="hidden"
              width={imageSizes.image40}>
              <NFTViewer
                squareGridView
                maxHeight={theme.spacing.spacing60}
                uri={collection.image.url}
              />
            </Box>
          ) : null}
          <Flex shrink gap="none">
            <Flex grow row alignItems="center" gap="spacing8">
              {/* Width chosen to ensure truncation of collection name on both small
                and large screens with sufficient padding */}
              <Box flexShrink={1}>
                <Text color="textOnBrightPrimary" numberOfLines={1} variant="bodyLarge">
                  {collection?.name || '-'}
                </Text>
              </Box>
              {collection?.isVerified && (
                <VerifiedIcon
                  color={theme.colors.userThemeMagenta}
                  height={iconSizes.icon16}
                  width={iconSizes.icon16}
                />
              )}
            </Flex>
            {collection?.markets?.[0]?.floorPrice?.value && (
              <Flex row gap="spacing4">
                <Text color="textOnBrightTertiary" numberOfLines={1} variant="subheadSmall">
                  {t('Floor')}
                </Text>
                <PriceAmount
                  iconColor="textOnBrightTertiary"
                  price={{
                    id: collection?.markets?.[0].floorPrice.id,
                    value: collection.markets[0].floorPrice.value,
                    currency: Currency.Eth,
                  }}
                  textColor="textOnBrightTertiary"
                  textVariant="subheadSmall"
                />
              </Flex>
            )}
          </Flex>
        </Flex>
        <Chevron
          color={theme.colors.textOnBrightSecondary}
          direction="e"
          height={theme.iconSizes.icon24}
          width={theme.iconSizes.icon24}
        />
      </Flex>
    </TouchableArea>
  )
}
