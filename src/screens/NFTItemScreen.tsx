import { ApolloQueryResult } from '@apollo/client'
import { isAddress } from 'ethers/lib/utils'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import ShareIcon from 'src/assets/icons/share.svg'
import EthereumLogo from 'src/assets/logos/ethereum.svg'
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
import { uniswapUrls } from 'src/constants/urls'
import {
  Currency,
  NftActivityType,
  NftItemScreenQuery,
  useNftItemScreenQuery,
} from 'src/data/__generated__/types-and-hooks'
import { selectModalState } from 'src/features/modals/modalSlice'
import { BlurredImageBackground } from 'src/features/nfts/item/BlurredImageBackground'
import { CollectionPreviewCard } from 'src/features/nfts/item/CollectionPreviewCard'
import { NFTTraitList } from 'src/features/nfts/item/traits'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'src/features/wallet/hooks'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { colorsDark } from 'src/styles/color'
import { iconSizes } from 'src/styles/sizing'
import { areAddressesEqual } from 'src/utils/addresses'
import {
  MIN_COLOR_CONTRAST_THRESHOLD,
  passesContrast,
  useNearestThemeColorFromImageUri,
} from 'src/utils/colors'
import { formatNumber, NumberType } from 'src/utils/format'
import { logger } from 'src/utils/logger'

export function NFTItemScreen({
  route: {
    params: { owner, address, tokenId },
  },
}: AppStackScreenProp<Screens.NFTItem>): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

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

  const ownerDisplayName = useDisplayName(owner)

  const isSharable = asset?.nftContract?.address && asset?.tokenId

  const onShare = useCallback(async () => {
    if (!isSharable) return
    try {
      await Share.share({
        message: `${uniswapUrls.nftUrl}/asset/${asset.nftContract?.address}/${asset.tokenId}`,
      })
    } catch (e) {
      logger.error('NFTItemScreen', 'onShare', (e as unknown as Error).message)
    }
  }, [asset?.nftContract?.address, asset?.tokenId, isSharable])

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

  const { colorLight, colorDark } = useNearestThemeColorFromImageUri(asset?.image?.url)
  // check if colorLight passes contrast against card bg color, if not use fallback
  const accentTextColor = useMemo(() => {
    if (
      colorLight &&
      passesContrast(colorLight, theme.colors.textOnDimTertiary, MIN_COLOR_CONTRAST_THRESHOLD)
    ) {
      return colorLight
    }
    return theme.colors.textOnBrightTertiary
  }, [colorLight, theme])

  return (
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
                  maxHeight={theme.iconSizes.icon40}
                  maxWidth={theme.iconSizes.icon40}
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
              <Flex
                alignItems="center"
                height={iconSizes.icon40}
                justifyContent="center"
                pr="spacing4"
                width={iconSizes.icon40}>
                {isSharable && (
                  <TouchableOpacity onPress={onShare}>
                    <ShareIcon
                      color={theme.colors.textOnBrightPrimary}
                      height={iconSizes.icon24}
                      width={iconSizes.icon24}
                    />
                  </TouchableOpacity>
                )}
              </Flex>
            }>
            {/* Content wrapper */}
            <Flex
              backgroundColor="none"
              gap="spacing24"
              mb="spacing48"
              mt="spacing8"
              pb="spacing48"
              px="spacing24">
              <Flex
                gap="spacing12"
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
                    <NFTViewer autoplay uri={asset.image.url} />
                  ) : (
                    <Box
                      aspectRatio={1}
                      style={{ backgroundColor: colorsDark.background2 }}
                      width="100%">
                      <BaseCard.ErrorState
                        retryButtonLabel="Retry"
                        title={t("Couldn't load NFT details")}
                        onRetry={(): Promise<ApolloQueryResult<NftItemScreenQuery>> => refetch?.()}
                      />
                    </Box>
                  )}
                </Flex>
                {nftLoading ? (
                  <Text
                    color="textOnBrightPrimary"
                    loading={nftLoading}
                    loadingPlaceholderText="#0000 NFT Title"
                    mt="spacing4"
                    variant="subheadLarge"
                  />
                ) : asset?.name ? (
                  <Text
                    color="textOnBrightPrimary"
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
              {nftLoading ? (
                <Box mt="spacing12">
                  <Loader.Box
                    height={theme.textVariants.bodySmall.lineHeight}
                    mb="spacing4"
                    repeat={3}
                  />
                </Box>
              ) : asset?.description ? (
                <LongText
                  renderAsMarkdown
                  color={theme.colors.textOnBrightPrimary}
                  initialDisplayedLines={3}
                  readMoreOrLessColor={accentTextColor}
                  text={asset?.description || '-'}
                />
              ) : null}

              {/* Metadata */}
              <Flex gap="spacing12">
                {lastSaleData?.price?.value ? (
                  <AssetMetadata
                    title={t('Last sale price')}
                    valueComponent={
                      lastSaleData.price.currency === Currency.Eth ? (
                        <Flex row alignItems="center" gap="spacing2">
                          <Text
                            color="textOnBrightPrimary"
                            variant="buttonLabelSmall">{`${formatNumber(
                            lastSaleData.price.value,
                            NumberType.NFTTokenFloorPrice
                          )}`}</Text>
                          <EthereumLogo color={theme.colors.textOnBrightPrimary} />
                        </Flex>
                      ) : (
                        <Flex row alignItems="center" gap="spacing2">
                          <Text variant="buttonLabelSmall">
                            $
                            {`${formatNumber(
                              lastSaleData.price.value,
                              NumberType.NFTTokenFloorPrice
                            )} `}
                          </Text>
                        </Flex>
                      )
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
                        size={theme.iconSizes.icon20}
                        textColor="textOnBrightPrimary"
                        variant="buttonLabelSmall"
                      />
                    </TouchableArea>
                  }
                />
              </Flex>

              {/* Traits */}
              {asset?.traits && asset?.traits?.length > 0 ? (
                <Flex gap="spacing12">
                  <Text color="textOnBrightPrimary" variant="buttonLabelSmall">
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
        <Text color="textOnBrightTertiary" variant="bodySmall">
          {title}
        </Text>
      </Flex>
      <Box maxWidth="60%">{valueComponent}</Box>
    </Flex>
  )
}
