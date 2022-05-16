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
import { nftCollectionBlurBackgroundImageStyle } from 'src/styles/image'
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
        <Flex m="none">
          <Flex bg="neutralBackground" borderRadius="md" p="md">
            {asset.collection.image_url && (
              <Image
                blurRadius={5}
                source={{ uri: asset.collection.image_url }}
                style={[StyleSheet.absoluteFill, nftCollectionBlurBackgroundImageStyle]}
              />
            )}
            <TextButton p="none" onPress={onPressToggle}>
              <Flex row alignItems="center" justifyContent="space-between" width={'100%'}>
                <Text color="neutralTextSecondary" variant="body2">
                  {'Back'}
                </Text>
                <Chevron
                  color={theme.colors.neutralTextSecondary}
                  direction="s"
                  height={12}
                  width={12}
                />
              </Flex>
            </TextButton>

            <Flex centered>
              <NFTAssetItem
                id={getNFTAssetKey(address, token_id)}
                mx="sm"
                nft={asset}
                size={dimensions.fullWidth}
              />

              <Flex
                alignItems="flex-end"
                justifyContent="space-between"
                mx="none"
                my="lg"
                style={StyleSheet.absoluteFill}>
                <ApplyNFTPaletteButton asset={asset} />
                {isEnabled(TestConfig.DisplayExtractedNFTColors) && <NFTPalette asset={asset} />}
              </Flex>
            </Flex>

            <Flex gap="xs">
              <Text variant="h2">{asset?.name}</Text>
              <Flex row alignItems="center" gap="xxs">
                {asset.collection.image_url ? (
                  <RemoteImage
                    borderRadius={theme.borderRadii.full}
                    height={16}
                    imageUrl={asset.collection.image_url}
                    width={16}
                  />
                ) : null}
                <Text color="neutralTextSecondary" ml="xs" variant="subHead2">
                  {asset.collection.name}
                </Text>
                {asset.collection.safelist_request_status === 'verified' && (
                  <VerifiedIcon height={25} width={25} />
                )}
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
              <Flex gap="md">
                <Text color="neutralTextSecondary" variant="subHead1">{t`About this NFT`}</Text>
                <Text color="neutralTextSecondary" variant="caption">
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
