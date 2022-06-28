import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp } from 'src/app/navigation/types'
import SendIcon from 'src/assets/icons/send.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import OpenSeaIcon from 'src/assets/logos/opensea.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { ScrollDetailScreen } from 'src/components/layout/ScrollDetailScreen'
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
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
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
    navigation.push(Screens.Transfer, { transferFormState })
  }

  const isMyNFT = owner && owner === accountAddress

  return (
    <ScrollDetailScreen>
      <Flex borderRadius="md" p="md">
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

        {/* Collection info */}
        <Flex gap="xs">
          <Text variant="headlineMedium">{asset?.name}</Text>
          <Flex row alignItems="center" gap="xxs">
            {asset.collection.image_url ? (
              <RemoteImage
                borderRadius={theme.borderRadii.full}
                height={16}
                imageUrl={asset.collection.image_url}
                width={16}
              />
            ) : null}
            <Text color="textSecondary" ml="xs" variant="subheadSmall">
              {asset.collection.name}
            </Text>
            {asset.collection.safelist_request_status === 'verified' && (
              <VerifiedIcon height={25} width={25} />
            )}
          </Flex>
        </Flex>

        {/* Action buttons */}
        <Flex centered row>
          <PrimaryButton
            borderColor="backgroundOutline"
            borderWidth={1}
            flex={1}
            icon={<OpenSeaIcon color={theme.colors.white} height={20} width={20} />}
            label="OpenSea"
            name={ElementName.NFTAssetViewOnOpensea}
            testID={ElementName.NFTAssetViewOnOpensea}
            variant="black"
            onPress={() => openUri(asset.permalink)}
          />
          {isMyNFT && (
            <PrimaryButton
              borderColor="backgroundOutline"
              borderWidth={1}
              flex={1}
              icon={<SendIcon height={20} stroke={theme.colors.white} strokeWidth={2} width={20} />}
              label={t('Send')}
              name={ElementName.Send}
              testID={ElementName.Send}
              variant="black"
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
    </ScrollDetailScreen>
  )
}
