/* eslint-disable complexity, max-lines */
import { ApolloQueryResult } from '@apollo/client'
import { GraphQLApi } from '@universe/api'
import { isAddress } from 'ethers/lib/utils'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, StatusBar, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading/loaders'
import { useIsInModal } from 'src/components/modals/useIsInModal'
import { LongMarkdownText } from 'src/components/text/LongMarkdownText'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { BlurredImageBackground } from 'src/features/nfts/item/BlurredImageBackground'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { NFTTraitList } from 'src/features/nfts/item/traits'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import {
  Flex,
  getTokenValue,
  MIN_COLOR_CONTRAST_THRESHOLD,
  passesContrast,
  Text,
  Theme,
  TouchableArea,
  useSporeColors,
} from 'ui/src'
import { CopyAlt, Ellipsis } from 'ui/src/components/icons'
import { colorsDark, fonts, iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { NFTViewer } from 'uniswap/src/components/nfts/images/NFTViewer'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, getChainLabel } from 'uniswap/src/features/chains/utils'
import { useNFTContextMenuItems } from 'uniswap/src/features/nfts/hooks/useNftContextMenuItems'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { setClipboard, setClipboardImage } from 'uniswap/src/utils/clipboard'
import { useNearestThemeColorFromImageUri } from 'uniswap/src/utils/colors'
import { shortenAddress } from 'utilities/src/addresses'
import { isAndroid, isIOS } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useAccounts, useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

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
  } = GraphQLApi.useNftItemScreenQuery({
    variables: {
      contractAddress: address,
      filter: { tokenIds: [tokenId] },
      activityFilter: {
        address,
        tokenId,
        activityTypes: [GraphQLApi.NftActivityType.Sale],
      },
    },
    pollInterval: PollingInterval.Slow,
  })
  const asset = data?.nftAssets?.edges[0]?.node
  const owner = (ownerFromProps || asset?.ownerAddress) ?? undefined
  const chainId = fromGraphQLChain(fallbackData?.chain) ?? undefined
  const contractAddress = address || asset?.nftContract?.address || fallbackData?.contractAddress

  const lastSaleData = data?.nftActivity?.edges[0]?.node
  const listingPrice = asset?.listings?.edges[0]?.node.price

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
    if (contractAddress) {
      navigation.navigate(MobileScreens.NFTCollection, { collectionAddress: contractAddress })
    }
  }

  // Disable navigation to profile if user owns NFT or invalid owner
  const platform = chainId ? chainIdToPlatform(chainId) : Platform.EVM
  const disableProfileNavigation = Boolean(
    owner &&
      (areAddressesEqual({
        addressInput1: { address: owner, platform },
        addressInput2: { address: activeAccountAddress, platform },
      }) ||
        !isAddress(owner)),
  )

  const onPressOwner = (): void => {
    if (owner) {
      navigation.navigate(MobileScreens.ExternalProfile, {
        address: owner,
      })
    }
  }

  const inModal = useIsInModal(ModalName.Explore)

  const traceProperties: Record<string, Maybe<string | boolean>> = useMemo(() => {
    const baseProps = {
      owner,
      address,
      tokenId,
    }

    if (asset?.collection?.name) {
      return {
        ...baseProps,
        collectionName: asset.collection.name,
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
    if (
      colorLight &&
      passesContrast({
        color: colorLight,
        backgroundColor: colors.surface1.val,
        contrastThreshold: MIN_COLOR_CONTRAST_THRESHOLD,
      })
    ) {
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
    () => (
      <RightElement
        chainId={chainId}
        contractAddress={contractAddress}
        isSpam={isSpam}
        owner={owner}
        tokenId={tokenId}
      />
    ),
    [chainId, contractAddress, isSpam, owner, tokenId],
  )

  const onPressCopyAddress = useCallback(
    async (_: GestureResponderEvent) => {
      if (contractAddress) {
        await setClipboard(contractAddress)
        dispatch(
          pushNotification({
            type: AppNotificationType.Copied,
            copyType: CopyNotificationType.Address,
          }),
        )
      }
    },
    [contractAddress, dispatch],
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
                            onRetry={(): Promise<ApolloQueryResult<GraphQLApi.NftItemScreenQuery>> => refetch()}
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

                  {contractAddress ? (
                    <AssetMetadata
                      color={colors.neutral2.val}
                      title={t('tokens.nfts.details.contract.address')}
                      valueComponent={
                        <TouchableArea
                          alignItems="center"
                          flexDirection="row"
                          gap="$spacing6"
                          justifyContent="center"
                          onPress={onPressCopyAddress}
                        >
                          <Text variant="body2">{shortenAddress({ address: contractAddress })}</Text>
                          <CopyAlt color="$neutral3" size="$icon.16" />
                        </TouchableArea>
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
                {asset?.traits && asset.traits.length > 0 ? (
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
  return (
    <Flex row alignItems="center" justifyContent="space-between" pl="$spacing2">
      <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start" maxWidth="40%">
        <Text style={{ color }} variant="body2">
          {title}
        </Text>
      </Flex>
      <Flex maxWidth="60%">{valueComponent}</Flex>
    </Flex>
  )
}

function RightElement({
  chainId,
  contractAddress,
  tokenId,
  owner,
  isSpam,
}: {
  chainId?: UniverseChainId
  contractAddress?: string
  tokenId?: string
  owner?: string
  isSpam?: boolean
}): JSX.Element {
  const accounts = useAccounts()

  const { value: contextMenuIsOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)

  const menuItems = useNFTContextMenuItems({
    contractAddress,
    tokenId,
    owner,
    walletAddresses: Object.keys(accounts),
    showNotification: true,
    isSpam,
    chainId,
  })

  return (
    <Flex alignItems="center" height={iconSizes.icon40} justifyContent="center" width={iconSizes.icon40}>
      {menuItems.length > 0 && (
        <ContextMenu
          menuItems={menuItems}
          triggerMode={ContextMenuTriggerMode.Primary}
          isOpen={contextMenuIsOpen}
          closeMenu={closeContextMenu}
          openMenu={openContextMenu}
        >
          <TouchableArea p="$spacing16" onPress={openContextMenu}>
            <Ellipsis color="$neutral1" size="$icon.16" />
          </TouchableArea>
        </ContextMenu>
      )}
    </Flex>
  )
}
