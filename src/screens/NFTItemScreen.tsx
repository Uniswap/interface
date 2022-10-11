import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { LinkButton } from 'src/components/buttons/LinkButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Chevron } from 'src/components/icons/Chevron'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useNFT } from 'src/features/nfts/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { iconSizes } from 'src/styles/sizing'
import { openUri } from 'src/utils/linking'

const MAX_NFT_IMAGE_SIZE = 512

// TODO {MOB-2827}: replace with `uniswapAppUrl` const when NFT feature is moved off vercel
export const UNISWAP_NFT_BASE_URL = 'https://interface-6y0ofdy69-uniswap.vercel.app/#'

export function NFTItemScreen({
  navigation,
  route: {
    params: { owner, address, token_id },
  },
}: AppStackScreenProp<Screens.NFTItem>) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const { asset } = useNFT(owner, address, token_id)
  const accountAddress = useActiveAccountAddress()

  const initialSendState = useMemo(() => {
    return asset
      ? {
          exactCurrencyField: CurrencyField.INPUT,
          exactAmountToken: '',
          [CurrencyField.INPUT]: {
            chainId: ChainId.Mainnet,
            address: asset.asset_contract.address,
            tokenId: asset.token_id,
            type:
              asset.asset_contract.schema_name === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721,
          },
          [CurrencyField.OUTPUT]: null,
        }
      : undefined
  }, [asset])

  // TODO: better handle error / loading states
  if (!asset) {
    return null
  }

  const onPressCollection = () =>
    navigation.navigate(Screens.NFTCollection, {
      collectionAddress: asset.asset_contract.address,
      owner,
      slug: asset.collection.slug,
    })

  const isMyNFT = owner && owner === accountAddress

  const assetUrl = `${UNISWAP_NFT_BASE_URL}/nfts/asset/${asset.asset_contract.address}/${asset.token_id}`

  return (
    <>
      <HeaderScrollScreen contentHeader={<BackButton px="md" />} fixedHeader={<BackButton />}>
        <Flex mb="xxl" mt="md" pb="xxl">
          <Flex centered>
            <NFTViewer autoplay maxHeight={MAX_NFT_IMAGE_SIZE} uri={asset.image_url} />
          </Flex>

          <Flex mx="md">
            <Flex gap="xs">
              <Text numberOfLines={2} variant="headlineSmall">
                {asset.name}
              </Text>

              {/* Collection info */}
              <Button onPress={onPressCollection}>
                <Flex
                  row
                  alignItems="center"
                  borderColor="backgroundOutline"
                  borderRadius="md"
                  borderWidth={1}
                  gap="xs"
                  px="md"
                  py="sm">
                  <Flex grow row flexBasis={0} gap="sm">
                    {asset.collection.image_url ? (
                      <Box borderRadius="full" height={32} overflow="hidden" width={32}>
                        <NFTViewer uri={asset.collection.image_url} />
                      </Box>
                    ) : null}
                    <Flex grow row alignItems="center" flexBasis={0} gap="xs">
                      <Text color="textPrimary" numberOfLines={1} variant="subhead">
                        {asset.collection.name}
                      </Text>
                      {asset.collection.safelist_request_status === 'verified' && (
                        <VerifiedIcon height={16} width={16} />
                      )}
                    </Flex>
                  </Flex>
                  <Chevron color={theme.colors.textSecondary} direction="e" />
                </Flex>
              </Button>
            </Flex>

            {/* Action buttons */}
            {isMyNFT && <SendButton flex={1} initialState={initialSendState} />}

            {/* Metadata */}
            {asset.collection.description && (
              <Flex gap="sm">
                <Text color="textSecondary" variant="headlineSmall">
                  {t('Description')}
                </Text>
                <LongText
                  renderAsMarkdown
                  color="textPrimary"
                  initialDisplayedLines={5}
                  text={asset.collection.description}
                />
              </Flex>
            )}
          </Flex>
        </Flex>
      </HeaderScrollScreen>
      <Flex
        row
        alignItems="center"
        bg="backgroundBackdrop"
        borderTopColor="backgroundOutline"
        borderTopWidth={1}
        bottom={0}
        gap="none"
        justifyContent="space-between"
        pb="xl"
        position="absolute"
        pt="sm"
        px="xl">
        <Flex fill row gap="sm">
          <Flex centered>
            <NFTViewer autoplay maxHeight={36} uri={asset.image_url} />
          </Flex>
          <Flex gap="none" justifyContent="center">
            <Text variant="subhead">{asset.name}</Text>
            <TextButton
              name={ElementName.NFTAssetViewOnUniswap}
              testID={ElementName.NFTAssetViewOnUniswap}
              textColor="textSecondary"
              textVariant="caption"
              onPress={() => openUri(assetUrl)}>
              {t('View on Uniswap.com')}
            </TextButton>
          </Flex>
        </Flex>
        <LinkButton label="" size={iconSizes.md} url={assetUrl} />
      </Flex>
    </>
  )
}
