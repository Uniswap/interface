import { ApolloQueryResult } from '@apollo/client'
import { isAddress } from 'ethers/lib/utils'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import ShareIcon from 'src/assets/icons/share.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { CHAIN_INFO } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import { uniswapUrls } from 'src/constants/urls'
import { NftItemScreenQuery, useNftItemScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { selectModalState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'src/features/wallet/hooks'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { iconSizes, imageSizes } from 'src/styles/sizing'
import { areAddressesEqual, shortenAddress } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { formatNumber, NumberType } from 'src/utils/format'
import { ExplorerDataType, getExplorerLink } from 'src/utils/linking'
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
    variables: { contractAddress: address, filter: { tokenIds: [tokenId] } },
    pollInterval: PollingInterval.Slow,
  })
  const asset = data?.nftAssets?.edges[0]?.node
  const assetChainId = fromGraphQLChain(asset?.nftContract?.chain)

  const ownerDisplayName = useDisplayName(owner)

  const onShare = useCallback(async () => {
    if (!asset?.nftContract || !asset.tokenId) return
    try {
      await Share.share({
        message: `${uniswapUrls.nftUrl}/asset/${asset.nftContract.address}/${asset.tokenId}`,
      })
    } catch (e) {
      logger.error('NFTItemScreen', 'onShare', (e as unknown as Error).message)
    }
  }, [asset?.nftContract, asset?.tokenId])

  const creatorInfo = useMemo(() => {
    const creator = asset?.creator

    if (!creator) return null

    return {
      value: creator.username || shortenAddress(creator.address),
      link: assetChainId
        ? getExplorerLink(assetChainId, creator.address, ExplorerDataType.ADDRESS)
        : undefined,
    }
  }, [asset, assetChainId])

  const contractAddressInfo = useMemo(() => {
    if (!asset?.nftContract?.address) return null

    const contractAddress = asset.nftContract.address
    return {
      value: shortenAddress(contractAddress),
      link: assetChainId
        ? getExplorerLink(assetChainId, contractAddress, ExplorerDataType.ADDRESS)
        : undefined,
    }
  }, [asset, assetChainId])

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
    navigation.navigate(Screens.ExternalProfile, { address: owner })
  }

  const inModal = useAppSelector(selectModalState(ModalName.Explore)).isOpen

  return (
    <ExploreModalAwareView>
      <HeaderScrollScreen
        centerElement={
          <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
            {asset?.name}
          </Text>
        }
        renderedInModal={inModal}
        rightElement={
          <Box mr="spacing4">
            <TouchableOpacity onPress={onShare}>
              <ShareIcon
                color={theme.colors.textTertiary}
                height={iconSizes.icon24}
                width={iconSizes.icon24}
              />
            </TouchableOpacity>
          </Box>
        }>
        <Flex gap="spacing24" mb="spacing48" mt="spacing16" mx="spacing24" pb="spacing48">
          <Flex
            gap="spacing24"
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
                <Box aspectRatio={1} bg="background2" width="100%">
                  <BaseCard.ErrorState
                    retryButtonLabel="Retry"
                    title={t("Couldn't load NFT details")}
                    onRetry={(): Promise<ApolloQueryResult<NftItemScreenQuery>> => refetch?.()}
                  />
                </Box>
              )}
            </Flex>

            <Flex gap="spacing4">
              <Text
                loading={nftLoading}
                loadingPlaceholderText="#0000 NFT Title"
                numberOfLines={2}
                variant="subheadLarge">
                {asset?.name || '-'}
              </Text>
              <TouchableArea disabled={disableProfileNavigation} onPress={onPressOwner}>
                <Text color="textSecondary" variant="subheadSmall">
                  {t('Owned by {{owner}}', { owner: ownerDisplayName?.name })}
                </Text>
              </TouchableArea>
            </Flex>
          </Flex>

          {/* Collection info */}
          <TouchableArea hapticFeedback disabled={!asset?.collection} onPress={onPressCollection}>
            {nftLoading ? (
              <Loader.Box borderRadius="rounded16" height={64} />
            ) : (
              <Flex
                row
                alignItems="center"
                backgroundColor="background2"
                borderRadius="rounded16"
                gap="spacing8"
                px="spacing12"
                py="spacing12">
                {nftLoading ? (
                  <Loader.Box height={40} />
                ) : (
                  <Flex row alignItems="center" gap="spacing12" overflow="hidden">
                    {asset?.collection?.image?.url ? (
                      <Box
                        borderRadius="roundedFull"
                        height={imageSizes.image40}
                        overflow="hidden"
                        width={imageSizes.image40}>
                        <NFTViewer squareGridView maxHeight={60} uri={asset.collection.image.url} />
                      </Box>
                    ) : null}
                    <Flex grow gap="none">
                      <Flex row alignItems="center" gap="spacing8">
                        {/* Width chosen to ensure truncation of collection name on both small
                        and large screens with sufficient padding */}
                        <Box flexShrink={1} maxWidth="82%">
                          <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
                            {asset?.collection?.name || '-'}
                          </Text>
                        </Box>
                        {asset?.collection?.isVerified && (
                          <VerifiedIcon
                            color={theme.colors.userThemeMagenta}
                            height={iconSizes.icon16}
                            width={iconSizes.icon16}
                          />
                        )}
                      </Flex>
                      {asset?.collection?.markets?.[0]?.floorPrice?.value && (
                        <Text color="textSecondary" numberOfLines={1} variant="subheadSmall">
                          {t('Floor: {{floorPrice}} ETH', {
                            floorPrice: formatNumber(
                              asset.collection.markets?.[0].floorPrice?.value,
                              NumberType.NFTTokenFloorPrice
                            ),
                          })}
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                )}
              </Flex>
            )}
          </TouchableArea>

          {/* Action buttons */}
          {/* TODO(MOB-2841): add back SendButton when we fix Send NFT flow */}

          {/* Metadata */}
          <Flex gap="spacing4">
            <Text color="textTertiary" variant="subheadSmall">
              {t('Description')}
            </Text>
            {nftLoading ? (
              <Box mt="spacing12">
                <Loader.Box
                  height={theme.textVariants.bodySmall.lineHeight}
                  mb="spacing4"
                  repeat={6}
                />
              </Box>
            ) : asset?.description ? (
              <LongText
                renderAsMarkdown
                initialDisplayedLines={12}
                text={asset?.description || '-'}
              />
            ) : (
              <Text>-</Text>
            )}
          </Flex>

          <Flex gap="spacing8">
            <AssetMetadata
              header={t('Creator')}
              link={creatorInfo?.link}
              value={creatorInfo?.value}
            />
            <AssetMetadata
              header={t('Contract address')}
              link={contractAddressInfo?.link}
              value={contractAddressInfo?.value}
            />
            <AssetMetadata header={t('Token ID')} value={asset?.tokenId} />
            <AssetMetadata
              header={t('Token standard')}
              value={asset?.nftContract?.standard ?? t('Unknown')}
            />
            <AssetMetadata
              header={t('Network')}
              value={assetChainId ? CHAIN_INFO[assetChainId].label : t('Unknown')}
            />
          </Flex>
        </Flex>
      </HeaderScrollScreen>
    </ExploreModalAwareView>
  )
}

function AssetMetadata({
  header,
  value,
  link,
}: {
  header: string
  value?: string
  link?: string
}): JSX.Element {
  const theme = useAppTheme()
  return (
    <Flex row alignItems="center" justifyContent="space-between" paddingLeft="spacing2">
      <Flex row alignItems="center" gap="spacing8" justifyContent="flex-start" maxWidth="40%">
        <Text color="textPrimary" variant="bodySmall">
          {header}
        </Text>
      </Flex>
      {link && value ? (
        <LinkButton
          iconColor={theme.colors.textTertiary}
          justifyContent="flex-start"
          label={value}
          mx="none"
          px="none"
          size={iconSizes.icon16}
          textVariant="buttonLabelSmall"
          url={link}
        />
      ) : (
        <Box maxWidth="60%">
          <Text numberOfLines={1} variant="buttonLabelSmall">
            {value || '-'}
          </Text>
        </Box>
      )}
    </Flex>
  )
}
