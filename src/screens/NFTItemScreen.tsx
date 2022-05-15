import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp } from 'src/app/navigation/types'
import SendIcon from 'src/assets/icons/send.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Chevron } from 'src/components/icons/Chevron'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box, Flex } from 'src/components/layout'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { ApplyNFTPaletteButton, NFTPalette } from 'src/components/NFT/NFTPalette'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useNFT } from 'src/features/nfts/hooks'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { ElementName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { nftCollectionBlurImageStyle } from 'src/styles/image'
import { dimensions } from 'src/styles/sizing'
import { openUri } from 'src/utils/linking'

export function NFTItemScreen({
  route: {
    params: { owner, address, token_id },
  },
  navigation,
}: HomeStackScreenProp<Screens.NFTItem>) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  // avoid relayouts which causes an jitter with shared elements
  const insets = useSafeAreaInsets()

  const onPressToggle = () => {
    navigation.goBack()
  }

  const { asset } = useNFT(owner, address, token_id)

  // TODO: better handle error / loading states
  if (!asset) return null

  const onPressSend = () => {
    const transferFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmount: '',
      [CurrencyField.INPUT]: {
        chainId: ChainId.Mainnet,
        address: asset.asset_contract.address,
        tokenId: asset.token_id,
        type: asset.asset_contract.schema_name === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721,
      },
      [CurrencyField.OUTPUT]: null,
    }
    navigation.push(Screens.Transfer, { transferFormState })
  }

  return (
    <Box
      bg="mainBackground"
      flex={1}
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex m="sm">
          <Flex bg="deprecated_gray50" borderRadius="md" p="md">
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex gap="xs">
                <Text variant="body2">{asset?.name}</Text>
                <Text color="deprecated_gray400" variant="caption">
                  {asset?.collection.name}
                </Text>
              </Flex>
              <TextButton onPress={onPressToggle}>
                <Chevron color={theme.colors.mainForeground} direction="s" height={15} width={15} />
              </TextButton>
            </Flex>

            <Flex centered>
              <NFTAssetItem
                id={getNFTAssetKey(address, token_id)}
                mx="sm"
                nft={asset}
                size={dimensions.fullWidth - theme.spacing.lg * 2}
              />

              <Flex
                alignItems="flex-end"
                justifyContent="space-between"
                mx="sm"
                my="lg"
                style={StyleSheet.absoluteFill}>
                <ApplyNFTPaletteButton asset={asset} />
                {isEnabled(TestConfig.DisplayExtractedNFTColors) && <NFTPalette asset={asset} />}
              </Flex>
            </Flex>

            <Flex centered row>
              <PrimaryButton
                flex={1}
                icon={<OpenSeaIcon color={theme.colors.white} height={20} width={20} />}
                label={t('View')}
                name={ElementName.NFTAssetViewOnOpensea}
                testID={ElementName.NFTAssetViewOnOpensea}
                variant="black"
                onPress={() => openUri(asset.permalink)}
              />
              <PrimaryButton
                flex={1}
                icon={
                  <SendIcon height={20} stroke={theme.colors.white} strokeWidth={2} width={20} />
                }
                label={t('Send')}
                name={ElementName.Send}
                testID={ElementName.Send}
                variant="black"
                onPress={onPressSend}
              />
            </Flex>

            <Flex gap="sm">
              <Box borderColor="deprecated_gray100" borderRadius="md" borderWidth={1}>
                {asset.collection.image_url && (
                  <Image
                    blurRadius={5}
                    source={{ uri: asset.collection.image_url }}
                    style={[StyleSheet.absoluteFill, nftCollectionBlurImageStyle]}
                  />
                )}
                <Flex
                  bg={asset.collection.image_url ? 'imageTintBackground' : 'tabBackground'}
                  borderColor="deprecated_gray100"
                  borderRadius="md"
                  borderWidth={1}
                  gap="sm"
                  p="md">
                  <Text
                    color="deprecated_gray400"
                    style={flex.fill}
                    variant="body2">{t`From the Collection`}</Text>
                  <Flex row alignItems="center" gap="xs">
                    {asset.collection.image_url ? (
                      <RemoteImage
                        borderRadius={theme.borderRadii.full}
                        height={20}
                        imageUrl={asset.collection.image_url}
                        width={20}
                      />
                    ) : null}
                    <Text ml="xs" variant="body1">
                      {asset.collection.name}
                    </Text>
                    {asset.collection.safelist_request_status === 'verified' && (
                      <VerifiedIcon height={25} width={25} />
                    )}
                  </Flex>
                </Flex>
              </Box>
              <Flex gap="md" mt="sm">
                <Text color="deprecated_gray400" variant="subHead1">{t`About this NFT`}</Text>
                <Text lineHeight={18} variant="body2">
                  {asset.collection.description}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </ScrollView>
    </Box>
  )
}
