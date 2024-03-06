import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageStyle } from 'react-native-fast-image'
import { BackButton } from 'src/components/buttons/BackButton'
import { Loader } from 'src/components/loading'
import { LongMarkdownText } from 'src/components/text/LongMarkdownText'
import { NFTCollectionContextMenu } from 'src/features/nfts/collection/NFTCollectionContextMenu'
import { Flex, FlexProps, Logos, Text, useDeviceInsets, useSporeColors } from 'ui/src'
import VerifiedIcon from 'ui/src/assets/icons/verified.svg'
import { iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useExtractedColors } from 'wallet/src/utils/colors'
import { NFTCollectionData } from './types'

const PROFILE_IMAGE_SIZE = 72
const PROFILE_IMAGE_WRAPPER_SIZE = PROFILE_IMAGE_SIZE + spacing.spacing4
export const NFT_BANNER_HEIGHT = 102

export function NFTCollectionHeader({
  loading = false,
  data,
  collectionAddress,
}: {
  loading: boolean
  data: Maybe<NFTCollectionData>
  collectionAddress?: Maybe<string>
}): ReactElement {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  // Style based on device sizing
  const { top: deviceTopPadding } = useDeviceInsets()
  const adjustedBannerHeight = deviceTopPadding + NFT_BANNER_HEIGHT

  const bannerImageStyle: ImageStyle = {
    height: adjustedBannerHeight,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: adjustedBannerHeight,
  }

  const bannerLoadingStyle: FlexProps['style'] = {
    ...bannerImageStyle,
    overflow: 'hidden',
  }

  const profileImageWrapperStyle: ImageStyle = {
    position: 'absolute',
    left: 0,
    top: adjustedBannerHeight - PROFILE_IMAGE_WRAPPER_SIZE / 2,
  }

  const collectionStats = data?.markets?.[0]
  const bannerImageUrl = data?.bannerImage?.url
  const profileImageUrl = data?.image?.url

  // Extract profile image color as a fallback background color if no banner image.
  const { colors: bannerColorsFallback } = useExtractedColors(profileImageUrl, 'surface2')

  return (
    <>
      <Flex mb="$spacing16" pb="$spacing4">
        {/* Banner image*/}
        {loading || !!bannerImageUrl ? (
          <ImageUri
            imageStyle={bannerImageStyle}
            loadingContainerStyle={bannerLoadingStyle}
            maxHeight={adjustedBannerHeight}
            resizeMode="cover"
            uri={data?.bannerImage?.url}
          />
        ) : (
          // No uri found on collection
          <Flex
            style={[
              bannerImageStyle,
              { backgroundColor: bannerColorsFallback?.base ?? colors.surface2.val },
            ]}
          />
        )}

        {/* Banner buttons */}
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          mt={deviceTopPadding + spacing.spacing12}
          mx="$spacing24">
          <Flex backgroundColor="$scrim" borderRadius="$roundedFull" p="$spacing4">
            <BackButton color="$sporeWhite" mr="$spacing1" size={iconSizes.icon24} />
          </Flex>
          <NFTCollectionContextMenu
            collectionAddress={collectionAddress}
            data={data}
            iconColor="$sporeWhite"
            showButtonOutline={true}
          />
        </Flex>

        {/* Profile image */}
        <Flex px="$spacing24" style={profileImageWrapperStyle}>
          <Flex
            alignItems="center"
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
            height={PROFILE_IMAGE_WRAPPER_SIZE}
            justifyContent="center"
            width={PROFILE_IMAGE_WRAPPER_SIZE}>
            {data?.image?.url ? (
              <Flex
                height={PROFILE_IMAGE_SIZE}
                overflow="hidden"
                style={{ borderRadius: PROFILE_IMAGE_SIZE }}
                width={PROFILE_IMAGE_SIZE}>
                <NFTViewer uri={data.image.url} />
              </Flex>
            ) : (
              <Flex
                backgroundColor="$surface2"
                borderRadius="$roundedFull"
                height={PROFILE_IMAGE_SIZE}
                width={PROFILE_IMAGE_SIZE}
              />
            )}
          </Flex>
        </Flex>

        {/* Collection stats */}
        <Flex
          gap="$spacing12"
          pt="$spacing12"
          px="$spacing24"
          style={{ marginTop: PROFILE_IMAGE_WRAPPER_SIZE }}>
          <Flex row alignItems="center" gap="$spacing8" mt="$spacing16">
            <Text loading={loading} loadingPlaceholderText="Collection Name" variant="subheading1">
              {data?.name ?? '-'}
            </Text>
            {data?.isVerified ? (
              <VerifiedIcon
                color={colors.accent1.get()}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            ) : null}
          </Flex>

          <Flex row gap="$spacing8" justifyContent="space-between">
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                {t('tokens.nfts.collection.label.items')}
              </Text>
              <Text loading={loading} variant="body1">
                {formatNumberOrString({
                  value: data?.numAssets,
                  type: NumberType.NFTCollectionStats,
                })}
              </Text>
            </Flex>
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                {t('tokens.nfts.collection.label.owners')}
              </Text>
              <Text loading={loading} variant="body1">
                {formatNumberOrString({
                  value: collectionStats?.owners,
                  type: NumberType.NFTCollectionStats,
                })}
              </Text>
            </Flex>
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                {t('tokens.nfts.collection.label.priceFloor')}
              </Text>
              <Flex row alignItems="center">
                <Text loading={loading} variant="body1">
                  {`${formatNumberOrString({
                    value: collectionStats?.floorPrice?.value,
                    type: NumberType.NFTTokenFloorPrice,
                  })} `}
                </Text>
                {collectionStats?.floorPrice?.value !== undefined ? (
                  <Logos.Ethereum color="$neutral1" size="$icon.16" />
                ) : null}
              </Flex>
            </Flex>
            <Flex fill alignItems="flex-start" gap="$spacing4">
              <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                {t('tokens.nfts.collection.label.swapVolume')}
              </Text>
              <Flex row alignItems="center" gap="$spacing4">
                <Text loading={loading} pr="$spacing1" variant="body1">
                  {`${formatNumberOrString({
                    value: collectionStats?.totalVolume?.value,
                    type: NumberType.NFTCollectionStats,
                  })}`}
                </Text>
                {collectionStats?.totalVolume?.value !== undefined ? (
                  <Logos.Ethereum color="$neutral1" size="$icon.16" />
                ) : null}
              </Flex>
            </Flex>
          </Flex>

          {/* Collection description */}
          {data?.description ? (
            <LongMarkdownText initialDisplayedLines={3} text={data?.description} />
          ) : loading ? (
            <Flex gap="$spacing8">
              <Loader.Box height={spacing.spacing16} width="100%" />
              <Loader.Box height={spacing.spacing16} width="100%" />
              <Loader.Box height={spacing.spacing16} width="100%" />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </>
  )
}
