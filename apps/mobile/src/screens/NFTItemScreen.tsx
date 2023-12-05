/* eslint-disable complexity */
import { ApolloQueryResult } from '@apollo/client'
import { isAddress } from 'ethers/lib/utils'
import { impactAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, StyleSheet, TouchableOpacity } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading'
import { LongText } from 'src/components/text/LongText'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID, IS_IOS } from 'src/constants/globals'
import { selectModalState } from 'src/features/modals/selectModalState'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { useNFTMenu } from 'src/features/nfts/hooks'
import { BlurredImageBackground } from 'src/features/nfts/item/BlurredImageBackground'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { NFTTraitList } from 'src/features/nfts/item/traits'
import { ModalName } from 'src/features/telemetry/constants'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { setClipboardImage } from 'src/utils/clipboard'
import { Flex, getTokenValue, Text, Theme, TouchableArea, useSporeColors } from 'ui/src'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import ShareIcon from 'ui/src/assets/icons/share.svg'
import { colorsDark, fonts, iconSizes } from 'ui/src/theme'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  NftActivityType,
  NftItemScreenQuery,
  useNftItemScreenQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { GQLNftAsset } from 'wallet/src/features/nfts/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import {
  MIN_COLOR_CONTRAST_THRESHOLD,
  passesContrast,
  useNearestThemeColorFromImageUri,
} from 'wallet/src/utils/colors'

const MAX_NFT_IMAGE_HEIGHT = 375

type NFTItemScreenProps = AppStackScreenProp<Screens.NFTItem>

export function NFTItemScreen(props: NFTItemScreenProps): JSX.Element {
  return IS_ANDROID ? (
    // display screen with theme dependent colors on Android
    <NFTItemScreenContents {...props} />
  ) : (
    // put Theme above the Contents so our useSporeColors() gets the right colors
    <Theme name="dark">
      <NFTItemScreenContents {...props} />
    </Theme>
  )
}

function NFTItemScreenContents({
  route: {
    // ownerFromProps needed here, when nftBalances GQL query returns a user NFT,
    // but nftAssets query for this NFT returns ownerAddress === null,
    params: { owner: ownerFromProps, address, tokenId, isSpam, fallbackData },
  },
}: NFTItemScreenProps): JSX.Element {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()
  const colors = useSporeColors()
  const navigation = useAppStackNavigation()

  const {
    data,
    loading: nftLoading,
    refetch,
  } = useNftItemScreenQuery({
    variables: {
      contractAddress: address,
      filter: { tokenIds: [tokenId] },
      activityFilter: {
        address,
        tokenId,
        activityTypes: [NftActivityType.Sale],
      },
    },
    pollInterval: PollingInterval.Slow,
  })
  const asset = data?.nftAssets?.edges[0]?.node
  const owner = (ownerFromProps || asset?.ownerAddress) ?? undefined

  const lastSaleData = data?.nftActivity?.edges[0]?.node
  const listingPrice = asset?.listings?.edges?.[0]?.node?.price

  const name = useMemo(() => asset?.name ?? fallbackData?.name, [asset?.name, fallbackData?.name])
  const description = useMemo(
    () => asset?.description ?? fallbackData?.description,
    [asset?.description, fallbackData?.description]
  )
  const imageUrl = useMemo(
    () => asset?.image?.url ?? fallbackData?.imageUrl,
    [asset?.image?.url, fallbackData?.imageUrl]
  )
  const imageHeight = asset?.image?.dimensions?.height
  const imageWidth = asset?.image?.dimensions?.width
  const imageDimensionsExist = imageHeight && imageWidth
  const imageDimensions = imageDimensionsExist
    ? { height: imageHeight, width: imageWidth }
    : undefined
  const imageAspectRatio = imageDimensions ? imageDimensions.width / imageDimensions.height : 1
  const onPressCollection = (): void => {
    const collectionAddress = asset?.nftContract?.address ?? fallbackData?.contractAddress
    if (collectionAddress) {
      navigation.navigate(Screens.NFTCollection, { collectionAddress })
    }
  }

  // Disable navigation to profile if user owns NFT or invalid owner
  const disableProfileNavigation = Boolean(
    owner && (areAddressesEqual(owner, activeAccountAddress) || !isAddress(owner))
  )

  const onPressOwner = (): void => {
    if (owner) {
      navigation.navigate(Screens.ExternalProfile, {
        address: owner,
      })
    }
  }

  const inModal = useAppSelector(selectModalState(ModalName.Explore)).isOpen

  const traceProperties = useMemo(
    () =>
      asset?.collection?.name
        ? { owner, address, tokenId, collectionName: asset?.collection?.name }
        : undefined,
    [address, asset?.collection?.name, owner, tokenId]
  )

  const { colorLight, colorDark } = useNearestThemeColorFromImageUri(imageUrl)
  // check if colorLight passes contrast against card bg color, if not use fallback
  const accentTextColor = useMemo(() => {
    if (
      colorLight &&
      passesContrast(colorLight, colors.surface1.val, MIN_COLOR_CONTRAST_THRESHOLD)
    ) {
      return colorLight
    }
    return colors.neutral2.val
  }, [colorLight, colors.neutral2, colors.surface1])

  const onLongPressNFTImage = async (): Promise<void> => {
    await setClipboardImage(imageUrl)
    await impactAsync()
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Image,
      })
    )
  }

  const rightElement = useMemo(
    () => <RightElement asset={asset} isSpam={isSpam} owner={owner} />,
    [asset, isSpam, owner]
  )

  return (
    <>
      {IS_IOS ? (
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      ) : null}
      <Trace
        directFromPage
        logImpression={!!traceProperties}
        properties={traceProperties}
        screen={Screens.NFTItem}>
        <ExploreModalAwareView>
          <>
            {IS_IOS ? (
              <BlurredImageBackground
                backgroundColor={colorDark ?? colorsDark.surface2}
                imageUri={imageUrl}
              />
            ) : (
              <Flex bg="$surface2" style={StyleSheet.absoluteFill} />
            )}
            <HeaderScrollScreen
              backButtonColor="$neutral1"
              backgroundColor="$transparent"
              centerElement={
                imageUrl ? (
                  <Flex
                    borderRadius="$rounded8"
                    maxHeight={getTokenValue('$icon.40')}
                    maxWidth={getTokenValue('$icon.40')}
                    ml="$spacing16"
                    overflow="hidden">
                    <NFTViewer autoplay imageDimensions={imageDimensions} uri={imageUrl} />
                  </Flex>
                ) : (
                  <Text color="$neutral1" numberOfLines={1} variant="body1">
                    {name}
                  </Text>
                )
              }
              renderedInModal={inModal}
              rightElement={rightElement}>
              {/* Content wrapper */}
              <Flex
                bg="$transparent"
                gap="$spacing24"
                mb="$spacing48"
                mt="$spacing8"
                pb="$spacing48">
                <Flex
                  gap="$spacing12"
                  px="$spacing24"
                  shadowColor="$sporeBlack"
                  shadowOffset={{ width: 0, height: 16 }}
                  shadowOpacity={0.2}
                  shadowRadius={16}>
                  <Flex centered borderRadius="$rounded16" overflow="hidden">
                    {nftLoading ? (
                      <Flex aspectRatio={imageAspectRatio} width="100%">
                        <Loader.Image />
                      </Flex>
                    ) : imageUrl ? (
                      <TouchableArea onPress={onLongPressNFTImage}>
                        <NFTViewer
                          autoplay
                          imageDimensions={imageDimensions}
                          maxHeight={MAX_NFT_IMAGE_HEIGHT}
                          uri={imageUrl}
                        />
                      </TouchableArea>
                    ) : (
                      <Flex
                        aspectRatio={1}
                        style={{ backgroundColor: colorsDark.surface2 }}
                        width="100%">
                        <BaseCard.ErrorState
                          retryButtonLabel="Retry"
                          title={t('Couldn’t load NFT details')}
                          onRetry={(): Promise<ApolloQueryResult<NftItemScreenQuery>> =>
                            refetch?.()
                          }
                        />
                      </Flex>
                    )}
                  </Flex>
                  {nftLoading ? (
                    <Text
                      color="$neutral1"
                      loading={nftLoading}
                      loadingPlaceholderText="#0000 NFT Title"
                      mt="$spacing4"
                      variant="subheading1"
                    />
                  ) : name ? (
                    <Text color="$neutral1" mt="$spacing4" numberOfLines={2} variant="subheading1">
                      {name}
                    </Text>
                  ) : null}
                  <CollectionPreviewCard
                    collection={asset?.collection}
                    fallbackData={fallbackData}
                    loading={nftLoading}
                    onPress={onPressCollection}
                  />
                </Flex>

                {/* Description */}
                <Flex px="$spacing24">
                  {nftLoading ? (
                    <Flex mt="$spacing12">
                      <Loader.Box height={fonts.body2.lineHeight} mb="$spacing4" repeat={3} />
                    </Flex>
                  ) : description ? (
                    <LongText
                      renderAsMarkdown
                      color={colors.neutral1.val}
                      initialDisplayedLines={3}
                      text={description || '-'}
                    />
                  ) : null}
                </Flex>

                {/* Metadata */}
                <Flex gap="$spacing12" px="$spacing24">
                  {listingPrice?.value ? (
                    <AssetMetadata
                      title={t('Current price')}
                      valueComponent={
                        <PriceAmount
                          iconColor="$neutral1"
                          price={listingPrice}
                          textColor="$neutral1"
                          textVariant="buttonLabel3"
                        />
                      }
                    />
                  ) : null}
                  {lastSaleData?.price?.value ? (
                    <AssetMetadata
                      title={t('Last sale price')}
                      valueComponent={
                        <PriceAmount
                          iconColor="$neutral1"
                          price={lastSaleData.price}
                          textColor="$neutral1"
                          textVariant="buttonLabel3"
                        />
                      }
                    />
                  ) : null}

                  {owner && (
                    <AssetMetadata
                      title={t('Owned by')}
                      valueComponent={
                        <TouchableArea
                          disabled={disableProfileNavigation}
                          hitSlop={16}
                          onPress={onPressOwner}>
                          <AddressDisplay
                            address={owner}
                            hideAddressInSubtitle={true}
                            horizontalGap="$spacing4"
                            size={iconSizes.icon20}
                            textColor="$neutral1"
                            variant="buttonLabel3"
                          />
                        </TouchableArea>
                      }
                    />
                  )}
                </Flex>

                {/* Traits */}
                {asset?.traits && asset?.traits?.length > 0 ? (
                  <Flex gap="$spacing12">
                    <Text color="$neutral1" ml="$spacing24" variant="body2">
                      {t('Traits')}
                    </Text>
                    <NFTTraitList titleTextColor={accentTextColor} traits={asset.traits} />
                  </Flex>
                ) : null}
              </Flex>
            </HeaderScrollScreen>
          </>
        </ExploreModalAwareView>
      </Trace>
    </>
  )
}

function AssetMetadata({
  title,
  valueComponent,
}: {
  title: string
  valueComponent: JSX.Element
}): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between" pl="$spacing2">
      <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start" maxWidth="40%">
        <Text color="$neutral2" variant="body2">
          {title}
        </Text>
      </Flex>
      <Flex maxWidth="60%">{valueComponent}</Flex>
    </Flex>
  )
}

function RightElement({
  asset,
  owner,
  isSpam,
}: {
  asset: GQLNftAsset
  owner?: string
  isSpam?: boolean
}): JSX.Element {
  const colors = useSporeColors()

  const { menuActions, onContextMenuPress, onlyShare } = useNFTMenu({
    contractAddress: asset?.nftContract?.address,
    tokenId: asset?.tokenId,
    owner,
    showNotification: true,
    isSpam,
  })

  return (
    <Flex
      alignItems="center"
      height={iconSizes.icon40}
      justifyContent="center"
      width={iconSizes.icon40}>
      {menuActions.length > 0 ? (
        onlyShare ? (
          <TouchableOpacity onPress={menuActions[0]?.onPress}>
            <ShareIcon
              color={colors.neutral1.get()}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </TouchableOpacity>
        ) : (
          <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
            <EllipsisIcon
              color={colors.neutral1.get()}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
          </ContextMenu>
        )
      ) : undefined}
    </Flex>
  )
}
