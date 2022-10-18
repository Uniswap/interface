import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import ShareIcon from 'src/assets/icons/share.svg'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { useNFT } from 'src/features/nfts/hooks'
import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { iconSizes } from 'src/styles/sizing'

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
            {/* TODO(MOB-2841): add back SendButton when we fix Send NFT flow */}

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
    </>
  )
}
