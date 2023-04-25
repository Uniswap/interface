import { ApolloQueryResult } from '@apollo/client'
import { ThemeProvider } from '@shopify/restyle'
import { isAddress } from 'ethers/lib/utils'
import { impactAsync } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import EllipsisIcon from 'src/assets/icons/ellipsis.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { PollingInterval } from 'src/constants/misc'
import {
  NftActivityType,
  NftItemScreenQuery,
  useNftItemScreenQuery,
} from 'src/data/__generated__/types-and-hooks'
import { selectModalState } from 'src/features/modals/modalSlice'
import { PriceAmount } from 'src/features/nfts/collection/ListPriceCard'
import { useNFTMenu } from 'src/features/nfts/hooks'
import { BlurredImageBackground } from 'src/features/nfts/item/BlurredImageBackground'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { NFTTraitList } from 'src/features/nfts/item/traits'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType, CopyNotificationType } from 'src/features/notifications/types'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { colorsDark } from 'src/styles/color'
import { iconSizes } from 'src/styles/sizing'
import { darkTheme } from 'src/styles/theme'
import { areAddressesEqual } from 'src/utils/addresses'
import { setClipboardImage } from 'src/utils/clipboard'
import {
  MIN_COLOR_CONTRAST_THRESHOLD,
  passesContrast,
  useNearestThemeColorFromImageUri,
} from 'src/utils/colors'

export function NFTItemScreen({
  route: {
    params: { owner, address, tokenId },
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

  const lastSaleData = data?.nftActivity?.edges[0]?.node
  const listingPrice = asset?.listings?.edges?.[0]?.node?.price

  const onPressCollection = (): void => {
    if (asset && asset.collection?.collectionId && asset.nftContract?.address) {
      navigation.navigate(Screens.NFTCollection, {
        collectionAddress: asset.nftContract?.address,
      })
    }
  }

  // Disable navigation to profile if user owns NFT or invalid owner
  const disableProfileNavigation =
    areAddressesEqual(owner, activeAccountAddress) || !isAddress(owner)

  const onPressOwner = (): void => {
    navigation.navigate(Screens.ExternalProfile, {
      address: owner,
    })
  }

  const inModal = useAppSelector(selectModalState(ModalName.Explore)).isOpen

  const traceProperties = useMemo(
    () =>
      asset?.collection?.name
        ? { owner, address, tokenId, collectionName: asset?.collection?.name }
        : undefined,
    [address, asset?.collection?.name, owner, tokenId]
  )

  const { menuActions, onContextMenuPress, onlyShare } = useNFTMenu({
    contractAddress: asset?.nftContract?.address,
    tokenId: asset?.tokenId,
    owner,
    showNotification: true,
  })
  const { colorLight, colorDark } = useNearestThemeColorFromImageUri(asset?.image?.url)
  // check if colorLight passes contrast against card bg color, if not use fallback
  const accentTextColor = useMemo(() => {
    if (
      colorLight &&
      passesContrast(colorLight, darkTheme.colors.textOnDimTertiary, MIN_COLOR_CONTRAST_THRESHOLD)
    ) {
      return colorLight
    }
    return darkTheme.colors.textSecondary
  }, [colorLight])

  const onLongPressNFTImage = async (): Promise<void> => {
    setClipboardImage(asset?.image?.url)
    impactAsync()
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Image,
      })
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Trace
        directFromPage
        logImpression={!!traceProperties}
        properties={traceProperties}
        screen={Screens.NFTItem}>
        <ExploreModalAwareView>
          <>
            <BlurredImageBackground
              backgroundColor={colorDark ?? colorsDark.background3}
              imageUri={asset?.image?.url}
            />
            <HeaderScrollScreen
              backButtonColor="textOnBrightPrimary"
              backgroundColor="none"
              centerElement={
                asset?.image?.url ? (
                  <Box
                    borderRadius="rounded8"
                    maxHeight={darkTheme.iconSizes.icon40}
                    maxWidth={darkTheme.iconSizes.icon40}
                    ml="spacing4"
                    overflow="hidden">
                    <NFTViewer autoplay uri={asset.image.url} />
                  </Box>
                ) : (
                  <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
                    {asset?.name}
                  </Text>
                )
              }
              renderedInModal={inModal}
              rightElement={
                <Box
                  alignItems="center"
                  height={darkTheme.iconSizes.icon40}
                  justifyContent="center"
                  mr="spacing4"
                  width={darkTheme.iconSizes.icon40}>
                  {menuActions.length > 0 ? (
                    onlyShare ? (
                      <TouchableOpacity onPress={menuActions[0]?.onPress}>
                        <ShareIcon
                          color={darkTheme.colors.textPrimary}
                          height={iconSizes.icon24}
                          width={iconSizes.icon24}
                        />
                      </TouchableOpacity>
                    ) : (
                      <ContextMenu
                        dropdownMenuMode
                        actions={menuActions}
                        onPress={onContextMenuPress}>
                        <EllipsisIcon
                          color={darkTheme.colors.textPrimary}
                          height={iconSizes.icon16}
                          width={iconSizes.icon16}
                        />
                      </ContextMenu>
                    )
                  ) : undefined}
                </Box>
              }>
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
                  shadowColor="black"
                  shadowOffset={{ width: 0, height: 16 }}
                  shadowOpacity={0.2}
                  shadowRadius={16}>
                  <Flex centered borderRadius="rounded16" overflow="hidden">
                    {nftLoading ? (
                      <Box aspectRatio={1} width="100%">
                        <Loader.Image />
                      </Box>
                    ) : asset?.image?.url ? (
                      <TouchableArea onPress={onLongPressNFTImage}>
                        <NFTViewer autoplay uri={asset.image.url} />
                      </TouchableArea>
                    ) : (
                      <Box
                        aspectRatio={1}
                        style={{ backgroundColor: colorsDark.background2 }}
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
                      color="textPrimary"
                      loading={nftLoading}
                      loadingPlaceholderText="#0000 NFT Title"
                      mt="spacing4"
                      variant="subheadLarge"
                    />
                  ) : asset?.name ? (
                    <Text
                      color="textPrimary"
                      mt="spacing4"
                      numberOfLines={2}
                      variant="subheadLarge">
                      {asset.name}
                    </Text>
                  ) : null}
                  <CollectionPreviewCard
                    collection={asset?.collection}
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
                        mb="spacing4"
                        repeat={3}
                      />
                    </Box>
                  ) : asset?.description ? (
                    <LongText
                      renderAsMarkdown
                      color={darkTheme.colors.textPrimary}
                      initialDisplayedLines={3}
                      readMoreOrLessColor={accentTextColor}
                      text={asset?.description || '-'}
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
                          iconColor="white"
                          price={listingPrice}
                          textColor="white"
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
                          iconColor="white"
                          price={lastSaleData.price}
                          textColor="white"
                          textVariant="buttonLabelSmall"
                        />
                      }
                    />
                  ) : null}

                  <AssetMetadata
                    title={t('Owned by')}
                    valueComponent={
                      <TouchableArea disabled={disableProfileNavigation} onPress={onPressOwner}>
                        <AddressDisplay
                          address={owner}
                          hideAddressInSubtitle={true}
                          horizontalGap="spacing4"
                          size={darkTheme.iconSizes.icon20}
                          textColor="textPrimary"
                          variant="buttonLabelSmall"
                        />
                      </TouchableArea>
                    }
                  />
                </Flex>

                {/* Traits */}
                {asset?.traits && asset?.traits?.length > 0 ? (
                  <Flex gap="spacing12">
                    <Text color="textPrimary" ml="spacing24" variant="buttonLabelSmall">
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
        <Text color="textSecondary" variant="bodySmall">
          {title}
        </Text>
      </Flex>
      <Box maxWidth="60%">{valueComponent}</Box>
    </Flex>
  )
}
