import { ApolloQueryResult } from '@apollo/client'
import { ThemeProvider } from '@shopify/restyle'
import { isAddress } from 'ethers/lib/utils'
import { impactAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, TouchableOpacity } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import Trace from 'src/components/Trace/Trace'
import { selectModalState } from 'src/features/modals/modalSlice'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { GQLNftAsset, useNFTMenu } from 'src/features/nfts/hooks'
import { BlurredImageBackground } from 'src/features/nfts/item/BlurredImageBackground'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { NFTTraitList } from 'src/features/nfts/item/traits'
import { ModalName } from 'src/features/telemetry/constants'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { setClipboardImage } from 'src/utils/clipboard'
import {
  MIN_COLOR_CONTRAST_THRESHOLD,
  passesContrast,
  useNearestThemeColorFromImageUri,
} from 'src/utils/colors'
import EllipsisIcon from 'ui/src/assets/icons/ellipsis.svg'
import ShareIcon from 'ui/src/assets/icons/share.svg'
import { colorsDark, iconSizes } from 'ui/src/theme'
import { darkTheme } from 'ui/src/theme/restyle'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  NftActivityType,
  NftItemScreenQuery,
  useNftItemScreenQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

const MAX_NFT_IMAGE_HEIGHT = 375

export function NFTItemScreen({
  route: {
    // ownerFromProps needed here, when nftBalances GQL query returns a user NFT,
    // but nftAssets query for this NFT returns ownerAddress === null,
    params: { owner: ownerFromProps, address, tokenId, isSpam, fallbackData },
  },
}: AppStackScreenProp<Screens.NFTItem>): JSX.Element {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()

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
      passesContrast(colorLight, darkTheme.colors.sporeBlack, MIN_COLOR_CONTRAST_THRESHOLD)
    ) {
      return colorLight
    }
    return darkTheme.colors.neutral2
  }, [colorLight])

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
    <ThemeProvider theme={darkTheme}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Trace
        directFromPage
        logImpression={!!traceProperties}
        properties={traceProperties}
        screen={Screens.NFTItem}>
        <ExploreModalAwareView>
          <>
            <BlurredImageBackground
              backgroundColor={colorDark ?? colorsDark.surface2}
              imageUri={imageUrl}
            />
            <HeaderScrollScreen
              backButtonColor="sporeWhite"
              backgroundColor="none"
              centerElement={
                imageUrl ? (
                  <Box
                    borderRadius="rounded8"
                    maxHeight={darkTheme.iconSizes.icon40}
                    maxWidth={darkTheme.iconSizes.icon40}
                    ml="spacing16"
                    overflow="hidden">
                    <NFTViewer autoplay uri={imageUrl} />
                  </Box>
                ) : (
                  <Text color="neutral1" numberOfLines={1} variant="bodyLarge">
                    {name}
                  </Text>
                )
              }
              renderedInModal={inModal}
              rightElement={rightElement}>
              {/* Content wrapper */}
              <Flex
                backgroundColor="none"
                gap="spacing24"
                mb="spacing48"
                mt="spacing8"
                pb="spacing48">
                <Flex
                  gap="spacing12"
                  px="spacing24"
                  shadowColor="sporeBlack"
                  shadowOffset={{ width: 0, height: 16 }}
                  shadowOpacity={0.2}
                  shadowRadius={16}>
                  <Flex centered borderRadius="rounded16" overflow="hidden">
                    {nftLoading ? (
                      <Box aspectRatio={1} width="100%">
                        <Loader.Image />
                      </Box>
                    ) : imageUrl ? (
                      <TouchableArea onPress={onLongPressNFTImage}>
                        <NFTViewer autoplay maxHeight={MAX_NFT_IMAGE_HEIGHT} uri={imageUrl} />
                      </TouchableArea>
                    ) : (
                      <Box
                        aspectRatio={1}
                        style={{ backgroundColor: colorsDark.surface2 }}
                        width="100%">
                        <BaseCard.ErrorState
                          retryButtonLabel="Retry"
                          title={t("Couldn't load NFT details")}
                          onRetry={(): Promise<ApolloQueryResult<NftItemScreenQuery>> =>
                            refetch?.()
                          }
                        />
                      </Box>
                    )}
                  </Flex>
                  {nftLoading ? (
                    <Text
                      color="neutral1"
                      loading={nftLoading}
                      loadingPlaceholderText="#0000 NFT Title"
                      mt="spacing4"
                      variant="subheadLarge"
                    />
                  ) : name ? (
                    <Text color="neutral1" mt="spacing4" numberOfLines={2} variant="subheadLarge">
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
                <Flex px="spacing24">
                  {nftLoading ? (
                    <Box mt="spacing12">
                      <Loader.Box
                        height={darkTheme.textVariants.bodySmall.lineHeight}
                        // TODO EXT-259 make work with shortcut props like "mb", etc
                        marginBottom="$spacing4"
                        repeat={3}
                      />
                    </Box>
                  ) : description ? (
                    <LongText
                      renderAsMarkdown
                      color={darkTheme.colors.neutral1}
                      initialDisplayedLines={3}
                      readMoreOrLessColor={accentTextColor}
                      text={description || '-'}
                    />
                  ) : null}
                </Flex>

                {/* Metadata */}
                <Flex gap="spacing12" px="spacing24">
                  {listingPrice?.value ? (
                    <AssetMetadata
                      title={t('Current price')}
                      valueComponent={
                        <PriceAmount
                          iconColor="sporeWhite"
                          price={listingPrice}
                          textColor="sporeWhite"
                          textVariant="buttonLabelSmall"
                        />
                      }
                    />
                  ) : null}
                  {lastSaleData?.price?.value ? (
                    <AssetMetadata
                      title={t('Last sale price')}
                      valueComponent={
                        <PriceAmount
                          iconColor="sporeWhite"
                          price={lastSaleData.price}
                          textColor="sporeWhite"
                          textVariant="buttonLabelSmall"
                        />
                      }
                    />
                  ) : null}

                  {owner && (
                    <AssetMetadata
                      title={t('Owned by')}
                      valueComponent={
                        <TouchableArea disabled={disableProfileNavigation} onPress={onPressOwner}>
                          <AddressDisplay
                            address={owner}
                            hideAddressInSubtitle={true}
                            horizontalGap="spacing4"
                            size={darkTheme.iconSizes.icon20}
                            textColor="neutral1"
                            variant="buttonLabelSmall"
                          />
                        </TouchableArea>
                      }
                    />
                  )}
                </Flex>

                {/* Traits */}
                {asset?.traits && asset?.traits?.length > 0 ? (
                  <Flex gap="spacing12">
                    <Text color="neutral1" ml="spacing24" variant="buttonLabelSmall">
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
    </ThemeProvider>
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
    <Flex row alignItems="center" justifyContent="space-between" paddingLeft="spacing2">
      <Flex row alignItems="center" gap="spacing8" justifyContent="flex-start" maxWidth="40%">
        <Text color="neutral2" variant="bodySmall">
          {title}
        </Text>
      </Flex>
      <Box maxWidth="60%">{valueComponent}</Box>
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
  const { menuActions, onContextMenuPress, onlyShare } = useNFTMenu({
    contractAddress: asset?.nftContract?.address,
    tokenId: asset?.tokenId,
    owner,
    showNotification: true,
    isSpam,
  })

  return (
    <Box
      alignItems="center"
      height={darkTheme.iconSizes.icon40}
      justifyContent="center"
      width={darkTheme.iconSizes.icon40}>
      {menuActions.length > 0 ? (
        onlyShare ? (
          <TouchableOpacity onPress={menuActions[0]?.onPress}>
            <ShareIcon
              color={darkTheme.colors.neutral1}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </TouchableOpacity>
        ) : (
          <ContextMenu dropdownMenuMode actions={menuActions} onPress={onContextMenuPress}>
            <EllipsisIcon
              color={darkTheme.colors.neutral1}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
          </ContextMenu>
        )
      ) : undefined}
    </Box>
  )
}
