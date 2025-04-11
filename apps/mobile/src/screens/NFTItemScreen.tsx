/* eslint-disable complexity */
import { ApolloQueryResult } from '@apollo/client'
import { isAddress } from 'ethers/lib/utils'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, StyleSheet, TouchableOpacity } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch, useSelector } from 'react-redux'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading/loaders'
import { LongMarkdownText } from 'src/components/text/LongMarkdownText'
import { selectModalState } from 'src/features/modals/selectModalState'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { BlurredImageBackground } from 'src/features/nfts/item/BlurredImageBackground'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { NFTTraitList } from 'src/features/nfts/item/traits'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import {
  Flex,
  MIN_COLOR_CONTRAST_THRESHOLD,
  Text,
  Theme,
  TouchableArea,
  getTokenValue,
  passesContrast,
  useSporeColors,
} from 'ui/src'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import ShareIcon from 'ui/src/assets/icons/share.svg'
import { colorsDark, fonts, iconSizes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  NftActivityType,
  NftItemScreenQuery,
  useNftItemScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, getChainLabel } from 'uniswap/src/features/chains/utils'
import { GQLNftAsset } from 'uniswap/src/features/nfts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { setClipboardImage } from 'uniswap/src/utils/clipboard'
import { useNearestThemeColorFromImageUri } from 'uniswap/src/utils/colors'
import { isAndroid, isIOS } from 'utilities/src/platform'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { useNFTContextMenu } from 'wallet/src/features/nfts/useNftContextMenu'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const MAX_NFT_IMAGE_HEIGHT = 375

type NFTItemScreenProps = AppStackScreenProp<MobileScreens.NFTItem>

export function NFTItemScreen(props: NFTItemScreenProps): JSX.Element {
  return isAndroid ? (
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
  const dispatch = useDispatch()
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
  const chainId = fromGraphQLChain(fallbackData?.chain) ?? undefined

  const lastSaleData = data?.nftActivity?.edges[0]?.node
  const listingPrice = asset?.listings?.edges?.[0]?.node?.price

  const name = useMemo(() => asset?.name ?? fallbackData?.name, [asset?.name, fallbackData?.name])
  const description = useMemo(
    () => asset?.description ?? fallbackData?.description,
    [asset?.description, fallbackData?.description],
  )
  const imageUrl = useMemo(
    () => asset?.image?.url ?? fallbackData?.imageUrl,
    [asset?.image?.url, fallbackData?.imageUrl],
  )
  const imageHeight = asset?.image?.dimensions?.height
  const imageWidth = asset?.image?.dimensions?.width
  const imageDimensionsExist = imageHeight && imageWidth
  const imageDimensions = imageDimensionsExist ? { height: imageHeight, width: imageWidth } : undefined
  const imageAspectRatio = imageDimensions ? imageDimensions.width / imageDimensions.height : 1
  const onPressCollection = (): void => {
    const collectionAddress = asset?.nftContract?.address ?? fallbackData?.contractAddress
    if (collectionAddress) {
      navigation.navigate(MobileScreens.NFTCollection, { collectionAddress })
    }
  }

  // Disable navigation to profile if user owns NFT or invalid owner
  const disableProfileNavigation = Boolean(
    owner && (areAddressesEqual(owner, activeAccountAddress) || !isAddress(owner)),
  )

  const onPressOwner = (): void => {
    if (owner) {
      navigation.navigate(MobileScreens.ExternalProfile, {
        address: owner,
      })
    }
  }

  const inModal = useSelector(selectModalState(ModalName.Explore)).isOpen

  const traceProperties: Record<string, Maybe<string | boolean>> = useMemo(() => {
    const baseProps = {
      owner,
      address,
      tokenId,
    }

    if (asset?.collection?.name) {
      return {
        ...baseProps,
        collectionName: asset?.collection?.name,
        isMissingData: false,
      }
    }

    if (fallbackData) {
      return {
        ...baseProps,
        collectionName: fallbackData.collectionName,
        isMissingData: true,
      }
    }

    return { ...baseProps, isMissingData: true }
  }, [address, asset?.collection?.name, fallbackData, owner, tokenId])

  const { collectionName } = traceProperties

  const displayCollectionName = name || collectionName

  const { colorLight, colorDark } = useNearestThemeColorFromImageUri(imageUrl)
  // check if colorLight passes contrast against card bg color, if not use fallback
  const accentTextColor = useMemo(() => {
    if (colorLight && passesContrast(colorLight, colors.surface1.val, MIN_COLOR_CONTRAST_THRESHOLD)) {
      return colorLight
    }
    return colors.neutral2.val
  }, [colorLight, colors.neutral2, colors.surface1])

  const onLongPressNFTImage = async (): Promise<void> => {
    await setClipboardImage(imageUrl)

    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Image,
      }),
    )
  }

  const rightElement = useMemo(
    () => <RightElement asset={asset} isSpam={isSpam} owner={owner} />,
    [asset, isSpam, owner],
  )

  return (
    <>
      {isIOS ? <StatusBar translucent backgroundColor="transparent" barStyle="light-content" /> : null}
      <Trace
        directFromPage
        logImpression={!!traceProperties}
        properties={traceProperties}
        screen={MobileScreens.NFTItem}
      >
        <ExploreModalAwareView>
          <>
            {isIOS ? (
              <BlurredImageBackground backgroundColor={colorDark ?? colorsDark.surface2} imageUri={imageUrl} />
            ) : (
              <Flex backgroundColor="$surface2" style={StyleSheet.absoluteFill} />
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
                    overflow="hidden"
                  >
                    <NFTViewer autoplay imageDimensions={imageDimensions} uri={imageUrl} />
                  </Flex>
                ) : displayCollectionName ? (
                  <Text color="$neutral1" numberOfLines={1} variant="body1">
                    {displayCollectionName}
                  </Text>
                ) : undefined
              }
              renderedInModal={inModal}
              rightElement={rightElement}
            >
              {/* Content wrapper */}
              <Flex backgroundColor="$transparent" gap="$spacing24" mb="$spacing48" mt="$spacing8" pb="$spacing48">
                <Flex
                  gap="$spacing12"
                  px="$spacing24"
                  shadowColor="$black"
                  shadowOffset={{ width: 0, height: 16 }}
                  shadowOpacity={0.2}
                  shadowRadius={16}
                >
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
                      <Flex centered aspectRatio={1} style={{ backgroundColor: colorsDark.surface2 }} width="100%">
                        {displayCollectionName ? (
                          <Text color="$neutral2" textAlign="center" variant="body2">
                            {displayCollectionName}
                          </Text>
                        ) : (
                          <BaseCard.ErrorState
                            retryButtonLabel={t('common.button.retry')}
                            title={t('tokens.nfts.details.error.load.title')}
                            onRetry={(): Promise<ApolloQueryResult<NftItemScreenQuery>> => refetch?.()}
                          />
                        )}
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
                  ) : displayCollectionName ? (
                    <Text color={colors.neutral1.val} mt="$spacing8" numberOfLines={2} variant="subheading1">
                      {displayCollectionName}
                    </Text>
                  ) : null}
                  <CollectionPreviewCard
                    collection={asset?.collection}
                    fallbackData={fallbackData}
                    loading={nftLoading}
                    shouldDisableLink={chainId !== UniverseChainId.Mainnet} // TODO(MOB-3447): Remove once backend has full L2 collection support
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
                    <LongMarkdownText color={colors.neutral1.val} initialDisplayedLines={3} text={description || '-'} />
                  ) : null}
                </Flex>

                {/* Metadata */}
                <Flex gap="$spacing12" px="$spacing24">
                  {listingPrice?.value ? (
                    <AssetMetadata
                      color={accentTextColor}
                      title={t('tokens.nfts.details.price')}
                      valueComponent={
                        <PriceAmount
                          iconColor="$neutral1"
                          price={listingPrice}
                          textColor={colors.neutral1.val}
                          textVariant="buttonLabel2"
                        />
                      }
                    />
                  ) : null}
                  {chainId && (
                    <AssetMetadata
                      color={colors.neutral2.val}
                      title={t('tokens.nfts.details.network')}
                      valueComponent={
                        <Flex row alignItems="center" gap="$spacing8">
                          <Text color={colors.neutral1.val} variant="buttonLabel2">
                            {getChainLabel(chainId)}
                          </Text>
                          <NetworkLogo chainId={chainId} shape="square" size={iconSizes.icon20} />
                        </Flex>
                      }
                    />
                  )}
                  {lastSaleData?.price?.value ? (
                    <AssetMetadata
                      color={colors.neutral2.val}
                      title={t('tokens.nfts.details.recentPrice')}
                      valueComponent={
                        <PriceAmount
                          iconColor="$neutral1"
                          price={lastSaleData.price}
                          textColor={colors.neutral1.val}
                          textVariant="buttonLabel2"
                        />
                      }
                    />
                  ) : null}

                  {owner && (
                    <AssetMetadata
                      color={colors.neutral2.val}
                      title={t('tokens.nfts.details.owner')}
                      valueComponent={
                        <TouchableArea disabled={disableProfileNavigation} hitSlop={16} onPress={onPressOwner}>
                          <AddressDisplay
                            address={owner}
                            hideAddressInSubtitle={true}
                            horizontalGap="$spacing4"
                            size={iconSizes.icon20}
                            textColor={colors.neutral1.val}
                            variant="buttonLabel2"
                          />
                        </TouchableArea>
                      }
                    />
                  )}
                </Flex>

                {/* Traits */}
                {asset?.traits && asset?.traits?.length > 0 ? (
                  <Flex gap="$spacing12">
                    <Text color={colors.neutral1.val} ml="$spacing24" variant="body2">
                      {t('tokens.nfts.details.traits')}
                    </Text>
                    <NFTTraitList titleTextColor={colors.neutral2.val} traits={asset.traits} />
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
  color,
}: {
  title: string
  valueComponent: JSX.Element
  color: string
}): JSX.Element {
  const colors = useSporeColors()
  return (
    <Flex row alignItems="center" justifyContent="space-between" pl="$spacing2">
      <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start" maxWidth="40%">
        <Text style={{ color: color ?? colors.neutral2.get() }} variant="body2">
          {title}
        </Text>
      </Flex>
      <Flex maxWidth="60%">{valueComponent}</Flex>
    </Flex>
  )
}

function RightElement({ asset, owner, isSpam }: { asset: GQLNftAsset; owner?: string; isSpam?: boolean }): JSX.Element {
  const colors = useSporeColors()

  const { menuActions, onContextMenuPress, onlyShare } = useNFTContextMenu({
    contractAddress: asset?.nftContract?.address,
    tokenId: asset?.tokenId,
    owner,
    showNotification: true,
    isSpam,
    chainId: fromGraphQLChain(asset?.nftContract?.chain) ?? undefined,
  })

  return (
    <Flex alignItems="center" height={iconSizes.icon40} justifyContent="center" width={iconSizes.icon40}>
      {menuActions.length > 0 ? (
        onlyShare ? (
          <TouchableOpacity hitSlop={24} onPress={menuActions[0]?.onPress}>
            <ShareIcon color={colors.neutral1.get()} height={iconSizes.icon24} width={iconSizes.icon24} />
          </TouchableOpacity>
        ) : (
          <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
            <TouchableArea p="$spacing16">
              <EllipsisIcon color={colors.neutral1.get()} height={iconSizes.icon16} width={iconSizes.icon16} />
            </TouchableArea>
          </ContextMenu>
        )
      ) : undefined}
    </Flex>
  )
}
