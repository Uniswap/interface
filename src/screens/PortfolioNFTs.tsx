import { skipToken } from '@reduxjs/toolkit/dist/query'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SharedElement } from 'react-navigation-shared-element'
import { useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Masonry } from 'src/components/layout/Masonry'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { Text } from 'src/components/Text'
import { useNftBalancesQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'

export function PortfolioNFTsScreen({}: HomeStackScreenProp<Screens.PortfolioNFTs>) {
  // avoid relayouts which causes an jitter with shared elements
  const insets = useSafeAreaInsets()

  return (
    <Box
      bg="mainBackground"
      flex={1}
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <NFTMasonry expanded count={4} />
    </Box>
  )
}
export function NFTMasonry({ expanded, count }: { count: number; expanded?: boolean }) {
  const navigation = useHomeStackNavigation()
  const activeAddress = useActiveAccount()?.address
  const theme = useAppTheme()
  const { t } = useTranslation()

  const { currentData: nftsByCollection, isLoading: loading } = useNftBalancesQuery(
    activeAddress ? { owner: activeAddress } : skipToken
  )
  const nftItems = Object.values(nftsByCollection ?? {})
    .slice(0, count)
    .flat()

  const onPressToggle = () => {
    if (expanded) {
      navigation.goBack()
    } else {
      navigation.navigate(Screens.PortfolioNFTs)
    }
  }

  const onPressItem = (asset: NFTAsset.Asset) => {
    navigation.navigate(Screens.NFTItem, {
      owner: activeAddress ?? '',
      address: asset.asset_contract.address,
      token_id: asset.token_id,
    })
  }

  const renderItem = (asset: NFTAsset.Asset) => {
    const key = getNFTAssetKey(asset.asset_contract.address, asset.token_id)
    return (
      <Button onPress={() => onPressItem(asset)}>
        <NFTAssetItem id={key} nft={asset} size={dimensions.fullWidth / 2.6} />
      </Button>
    )
  }

  return (
    <Flex m="sm">
      <SharedElement id="portfolio-nfts-header">
        <Flex bg="tabBackground" borderRadius="md">
          <Flex row justifyContent="space-between" p="md">
            <Flex gap="xs">
              <Text color="deprecated_gray400" variant="body2">
                {t('NFTs')}
              </Text>
            </Flex>
            {expanded ? (
              <IconButton
                icon={
                  <Chevron
                    color={theme.colors.neutralAction}
                    direction="s"
                    height={16}
                    width={16}
                  />
                }
                p="none"
                onPress={onPressToggle}
              />
            ) : (
              <TextButton onPress={onPressToggle}>
                <Flex row gap="xs">
                  <Text color="deprecated_gray400" variant="body2">
                    {t('View all')}
                  </Text>
                  <Chevron
                    color={theme.colors.deprecated_gray400}
                    direction="e"
                    height={10}
                    width={10}
                  />
                </Flex>
              </TextButton>
            )}
          </Flex>
          <Masonry
            data={nftItems}
            getKey={({ asset_contract }) => asset_contract.toString()}
            loading={loading}
            renderItem={renderItem}
          />
        </Flex>
      </SharedElement>
    </Flex>
  )
}
