import { skipToken } from '@reduxjs/toolkit/dist/query'
import { utils } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Masonry } from 'src/components/layout/Masonry'
import { Section } from 'src/components/layout/Section'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { PollingInterval } from 'src/constants/misc'
import { useNftBalancesQuery } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'

const IMAGE_SIZE_RATIO = 2.4

export function PortfolioNFTsSection({ count, owner }: { count?: number; owner?: string }) {
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const { t } = useTranslation()

  const { currentData: nftsByCollection, isLoading: loading } = useNftBalancesQuery(
    activeAddress ? { owner: activeAddress } : skipToken,
    { pollingInterval: PollingInterval.Normal }
  )
  const { nftItems, totalCount } = useMemo(() => {
    const allItems = Object.values(nftsByCollection ?? {}).flat()
    return {
      nftItems: allItems.slice(0, count),
      totalCount: allItems.length,
    }
  }, [count, nftsByCollection])

  const onPressItem = useCallback(
    (asset: NFTAsset.Asset) => {
      navigation.navigate(Screens.NFTItem, {
        owner: activeAddress ?? '',
        address: utils.getAddress(asset.asset_contract.address),
        token_id: asset.token_id,
      })
    },
    [activeAddress, navigation]
  )

  const renderItem = useCallback(
    (asset: NFTAsset.Asset) => {
      return (
        <Button onPress={() => onPressItem(asset)}>
          <NFTAssetItem nft={asset} size={dimensions.fullWidth / IMAGE_SIZE_RATIO} />
        </Button>
      )
    },
    [onPressItem]
  )

  return (
    <Section.Container>
      {nftItems.length === 0 ? (
        <Section.EmptyState
          buttonLabel={t('Explore')}
          description={t(
            'Buy tokens on any Uniswap supported chains to start building your all-in-one portfolio and wallet.'
          )}
          title={t('Explore NFTs')}
          onPress={() => {
            // TODO: figure out how to navigate to explore
          }}
        />
      ) : (
        <Flex gap="xs">
          <Section.Header
            title={t('NFTs ({{totalCount}})', { totalCount })}
            onPress={() => navigation.navigate(Screens.PortfolioNFTs, { owner })}
          />
          <Masonry
            data={nftItems}
            getKey={({ asset_contract, token_id }) =>
              getNFTAssetKey(asset_contract.address, token_id)
            }
            loading={loading}
            renderItem={renderItem}
          />
        </Flex>
      )}
    </Section.Container>
  )
}
