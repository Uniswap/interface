import { ApolloQueryResult } from '@apollo/client'
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
import { useDisplayName } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { iconSizes, imageSizes } from 'src/styles/sizing'
import { shortenAddress } from 'src/utils/addresses'
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

  const onPressCollection = useCallback(() => {
    if (asset && asset.collection?.collectionId && asset.nftContract?.address) {
      navigation.navigate(Screens.NFTCollection, {
        collectionAddress: asset.nftContract?.address,
      })
    }
  }, [asset, navigation])

  const inModal = useAppSelector(selectModalState(ModalName.Explore)).isOpen

  return (
    <>
      <HeaderScrollScreen
        centerElement={
          <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
            {asset?.name}
          </Text>
        }
        renderedInModal={inModal}
        rightElement={
          <TouchableOpacity onPress={onShare}>
            <ShareIcon
              color={theme.colors.textSecondary}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </TouchableOpacity>
        }>
        <Flex gap="spacing24" mb="spacing48" mt="spacing16" mx="spacing24" pb="spacing48">
          <Flex gap="spacing24">
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
              <Text color="textSecondary" variant="subheadSmall">
                {t('Owned by {{owner}}', { owner: ownerDisplayName?.name })}
              </Text>
            </Flex>
          </Flex>

          {/* Collection info */}
          <TouchableArea disabled={!asset?.collection} onPress={onPressCollection}>
            {nftLoading ? (
              <Loader.Box borderRadius="rounded16" height={64} />
            ) : (
              <Flex
                row
                alignItems="center"
                backgroundColor="background2"
                borderRadius="rounded16"
                gap="spacing8"
                px="spacing16"
                py="spacing12">
                {nftLoading ? (
                  <Loader.Box height={40} />
                ) : (
                  <Flex row alignItems="center" gap="spacing12" overflow="hidden">
                    {asset?.collection?.image?.url ? (
                      <Box
                        borderRadius="roundedFull"
                        height={imageSizes.image32}
                        overflow="hidden"
                        width={imageSizes.image32}>
                        <NFTViewer squareGridView maxHeight={60} uri={asset.collection.image.url} />
                      </Box>
                    ) : null}
                    <Box flexShrink={1}>
                      <Text color="textTertiary" variant="buttonLabelMicro">
                        {t('Collection')}
                      </Text>
                      <Flex row alignItems="center" gap="spacing8">
                        <Box flexShrink={1}>
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
                    </Box>
                    {asset?.collection?.markets?.[0]?.floorPrice?.value && (
                      <Box flexGrow={1}>
                        <Text
                          color="textSecondary"
                          numberOfLines={1}
                          textAlign="right"
                          variant="buttonLabelMicro">
                          {t('Floor: {{floorPrice}} ETH', {
                            floorPrice: formatNumber(
                              asset.collection.markets?.[0].floorPrice?.value,
                              NumberType.NFTTokenFloorPrice
                            ),
                          })}
                        </Text>
                      </Box>
                    )}
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

          <Flex row flexWrap="wrap">
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
    </>
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
  const itemWidth = '45%' // works with flexWrap to make 2 columns. It needs to be slightly less than 50% to account for padding on the entire section

  return (
    <Flex gap="spacing4" mb="spacing24" width={itemWidth}>
      <Text color="textTertiary" variant="subheadSmall">
        {header}
      </Text>
      {link && value ? (
        <LinkButton
          justifyContent="flex-start"
          label={value}
          mx="none"
          px="none"
          textVariant="bodyLarge"
          url={link}
        />
      ) : (
        <Text numberOfLines={1} variant="bodyLarge">
          {value || '-'}
        </Text>
      )}
    </Flex>
  )
}
