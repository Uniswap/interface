import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import ShareIcon from 'src/assets/icons/share.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { Button } from 'src/components/buttons/Button'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { CHAIN_INFO } from 'src/constants/chains'
import { useNFT } from 'src/features/nfts/hooks'
import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { iconSizes } from 'src/styles/sizing'
import { shortenAddress } from 'src/utils/addresses'

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
  const ownerDisplayName = useDisplayName(owner)

  const onShare = useCallback(async () => {
    if (!asset?.asset_contract.address || !asset?.token_id) return
    try {
      await Share.share({
        message: `${UNISWAP_NFT_BASE_URL}/nfts/asset/${asset.asset_contract.address}/${asset.token_id}`,
      })
    } catch (e) {
      logMessage(LogContext.Share, (e as any as Error).message, { screen: 'NFTItemScreen' })
    }
  }, [asset?.asset_contract.address, asset?.token_id])

  const Header = useMemo(
    () => (
      <BackHeader
        endAdornment={
          <TouchableOpacity onPress={onShare}>
            <ShareIcon
              color={theme.colors.textSecondary}
              height={iconSizes.lg}
              width={iconSizes.lg}
            />
          </TouchableOpacity>
        }
        pt="xxs"
        px="xs"
      />
    ),
    [theme.colors.textSecondary, onShare]
  )

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

  return (
    <>
      <HeaderScrollScreen contentHeader={<Box px="md">{Header}</Box>} fixedHeader={Header}>
        <Flex mb="xxl" mt="md" mx="lg" pb="xxl">
          <Flex centered borderRadius="lg" overflow="hidden">
            <NFTViewer autoplay uri={asset.image_url} />
          </Flex>

          <Flex gap="none">
            <Text numberOfLines={2} variant="subheadLarge">
              {asset.name}
            </Text>
            <Text color="textSecondary" variant="subheadSmall">
              {t('Owned by {{owner}}', {
                owner:
                  ownerDisplayName?.type === 'address'
                    ? shortenAddress(ownerDisplayName.name)
                    : ownerDisplayName?.name,
              })}
            </Text>
          </Flex>

          {/* Collection info */}
          <Button onPress={onPressCollection}>
            <Flex
              row
              alignItems="center"
              backgroundColor="backgroundContainer"
              borderRadius="lg"
              gap="xs"
              px="md"
              py="sm">
              <Flex row alignItems="center" gap="sm" overflow="hidden">
                {asset.collection.image_url ? (
                  <Box
                    borderRadius="full"
                    height={theme.iconSizes.xl}
                    overflow="hidden"
                    width={theme.iconSizes.xl}>
                    <NFTViewer uri={asset.collection.image_url} />
                  </Box>
                ) : null}
                <Box flexShrink={1}>
                  <Text color="textTertiary" variant="badge_deprecated">
                    {t('Collection')}
                  </Text>
                  <Flex row alignItems="center" gap="xs">
                    <Box flexShrink={1}>
                      <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
                        {asset.collection.name}
                        {asset.collection.name}
                      </Text>
                    </Box>
                    {asset.collection.safelist_request_status === 'verified' && (
                      <VerifiedIcon color={theme.colors.userThemeMagenta} height={16} width={16} />
                    )}
                  </Flex>
                </Box>
                {/* TODO(MOB-2788): add floor price */}
              </Flex>
            </Flex>
          </Button>

          {/* Action buttons */}
          {/* TODO(MOB-2841): add back SendButton when we fix Send NFT flow */}

          {/* Metadata */}
          {asset.collection.description && (
            <Box>
              <Text color="textTertiary" variant="subheadSmall">
                {t('Description')}
              </Text>
              <LongText
                renderAsMarkdown
                color="textPrimary"
                initialDisplayedLines={12}
                text={asset.collection.description}
              />
            </Box>
          )}

          <Flex row flexWrap="wrap">
            <AssetMetadata
              header={t('Creator')}
              value={asset.creator.user?.username || shortenAddress(asset.creator.address)}
            />
            <AssetMetadata
              header={t('Contract address')}
              value={shortenAddress(asset.asset_contract.address)}
            />
            <AssetMetadata header={t('Token ID')} value={asset.token_id} />
            <AssetMetadata header={t('Token standard')} value={asset.asset_contract.schema_name} />
            <AssetMetadata header={t('Network')} value={CHAIN_INFO[asset.chainId].label} />
          </Flex>
        </Flex>
      </HeaderScrollScreen>
    </>
  )
}

function AssetMetadata({ header, value }: { header: string; value: string }) {
  const itemWidth = '45%' // works with flexWrap to make 2 columns. It needs to be slightly less than 50% to account for padding on the entire section

  return (
    <Flex gap="xxs" mb="lg" width={itemWidth}>
      <Text color="textTertiary" variant="subheadSmall">
        {header}
      </Text>
      <Text numberOfLines={1} variant="bodyLarge">
        {value}
      </Text>
    </Flex>
  )
}
