import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp } from 'src/app/navigation/types'
import SendIcon from 'src/assets/icons/send.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { ApplyNFTPaletteButton, NFTPalette } from 'src/components/NFT/NFTPalette'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { openModal } from 'src/features/modals/modalSlice'
import { useNFT } from 'src/features/nfts/hooks'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'

const MAX_NFT_IMAGE_SIZE = 512

export function NFTItemScreen({
  route: {
    params: { owner, address, token_id },
  },
}: HomeStackScreenProp<Screens.NFTItem>) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const { asset } = useNFT(owner, address, token_id)
  const accountAddress = useActiveAccountAddress()

  // TODO: better handle error / loading states
  if (!asset) return null

  const onPressSend = () => {
    const transferFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: {
        chainId: ChainId.Mainnet,
        address: asset.asset_contract.address,
        tokenId: asset.token_id,
        type: asset.asset_contract.schema_name === 'ERC1155' ? AssetType.ERC1155 : AssetType.ERC721,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Send, initialState: transferFormState }))
  }

  const isMyNFT = owner && owner === accountAddress

  return (
    <HeaderScrollScreen
      contentHeader={<BackButton showButtonLabel />}
      fixedHeader={<BackButton showButtonLabel />}>
      <Flex my="sm">
        <Flex centered>
          <NFTAssetItem autoplay maxHeight={MAX_NFT_IMAGE_SIZE} nft={asset} />

          <DevelopmentOnly>
            <Flex
              alignItems="flex-end"
              justifyContent="space-between"
              mx="none"
              my="lg"
              style={StyleSheet.absoluteFill}>
              <ApplyNFTPaletteButton asset={asset} />
              {isEnabled(TestConfig.DisplayExtractedNFTColors) && <NFTPalette asset={asset} />}
            </Flex>
          </DevelopmentOnly>
        </Flex>

        <Flex mx="md">
          {/* Collection info */}
          <Flex gap="xs">
            <Text variant="headlineSmall">{asset?.name}</Text>
            <Flex
              row
              alignItems="center"
              borderColor="backgroundOutline"
              borderRadius="md"
              borderWidth={1}
              gap="sm"
              p="md">
              {asset.collection.image_url ? (
                <Box borderRadius="full" height={32} overflow="hidden" width={32}>
                  <NFTViewer uri={asset.collection.image_url} />
                </Box>
              ) : null}
              <Flex centered row gap="xs">
                <Text color="textPrimary" variant="subhead">
                  {asset.collection.name}
                </Text>
                {asset.collection.safelist_request_status === 'verified' && (
                  <VerifiedIcon height={16} width={16} />
                )}
              </Flex>
            </Flex>
          </Flex>

          {/* Action buttons */}
          <Flex centered row gap="xs">
            <PrimaryButton
              flex={1}
              icon={<OpenSeaIcon color={theme.colors.textPrimary} height={20} width={20} />}
              label="OpenSea"
              name={ElementName.NFTAssetViewOnOpensea}
              testID={ElementName.NFTAssetViewOnOpensea}
              variant="transparent"
              onPress={() => openUri(asset.permalink)}
            />
            {isMyNFT && (
              <PrimaryButton
                flex={1}
                icon={
                  <SendIcon
                    height={20}
                    stroke={theme.colors.textPrimary}
                    strokeWidth={2}
                    width={20}
                  />
                }
                label={t('Send')}
                name={ElementName.Send}
                testID={ElementName.Send}
                variant="transparent"
                onPress={onPressSend}
              />
            )}
          </Flex>

          {/* Metadata */}
          <Flex gap="sm">
            <Flex gap="sm">
              <Text color="textSecondary" variant="headlineSmall">
                {t('Description')}
              </Text>
              <Text color="textPrimary" variant="bodySmall">
                {asset.collection.description}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </HeaderScrollScreen>
  )
}
