import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { Flex, Loader } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { NftViewWithContextMenu } from 'uniswap/src/components/nfts/NftViewWithContextMenu'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EMPTY_NFT_ITEM, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import type { NFTItem } from 'uniswap/src/features/nfts/types'
import { getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export const MOBILE_NFT_LOADING_ITEM = 'loading'

/** Natural NftPairRow height for a given page width. Cells are 50/50 with padding 4 + row padding 12. */
export function computeNftPairRowHeight(pageWidth: number): number {
  const NFT_ROW_HORIZONTAL_PADDING = spacing.spacing12 * 2
  return (pageWidth - NFT_ROW_HORIZONTAL_PADDING) / 2
}

/** Explicit 50/50 row; Tamagui `Flex` + `grow` can collapse to one full-width column once content lays out. */
const nftPairStyles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingHorizontal: spacing.spacing12,
    width: '100%',
  },
  cell: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
    padding: spacing.spacing4,
  },
})

export const NftPairRow = memo(function NftPairRowInner({
  left,
  right,
  owner,
}: {
  left: NFTItem
  right?: NFTItem
  owner: string
}): JSX.Element {
  const accounts = useAccounts()
  const { defaultChainId } = useEnabledChains()
  const navigateToNftExplorerLink = useNavigateToNftExplorerLink()

  const renderOne = useCallback(
    (nft: NFTItem, index: number): JSX.Element => {
      const onPressNft = async (): Promise<void> => {
        const nftDetails = {
          chainId: nft.chainId ?? defaultChainId,
          contractAddress: nft.contractAddress ?? '',
          tokenId: nft.tokenId ?? '',
        }
        const openseaUrl = getOpenseaLink(nftDetails)

        if (openseaUrl) {
          await openUri({ uri: openseaUrl })
        } else {
          navigateToNftExplorerLink(nftDetails)
        }
      }

      return (
        <NftViewWithContextMenu
          index={index}
          item={nft}
          owner={owner}
          walletAddresses={Object.keys(accounts)}
          onPress={onPressNft}
        />
      )
    },
    [accounts, defaultChainId, navigateToNftExplorerLink, owner],
  )

  return (
    <View style={nftPairStyles.row}>
      <View style={nftPairStyles.cell}>{renderOne(left, 0)}</View>
      <View style={nftPairStyles.cell}>{right ? renderOne(right, 1) : null}</View>
    </View>
  )
})

interface NftSpecialRowProps {
  value: string
  hiddenNftsExpanded: boolean
  numHidden: number
  setHiddenNftsExpanded: (value: boolean) => void
}

export const NftSpecialRow = memo(function NftSpecialRowInner({
  value,
  hiddenNftsExpanded,
  numHidden,
  setHiddenNftsExpanded,
}: NftSpecialRowProps): JSX.Element | null {
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const footerHeight = useSharedValue(fullHeight)

  const onHiddenRowPressed = useCallback((): void => {
    if (hiddenNftsExpanded) {
      footerHeight.value = fullHeight
    }
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [footerHeight, fullHeight, hiddenNftsExpanded, setHiddenNftsExpanded])

  if (value === EMPTY_NFT_ITEM) {
    return null
  }

  if (value === MOBILE_NFT_LOADING_ITEM) {
    return (
      <Flex px="$spacing12">
        <Loader.NFT />
      </Flex>
    )
  }

  if (value === HIDDEN_NFTS_ROW) {
    return (
      <Flex grow px="$spacing12">
        <ExpandoRow
          isExpanded={hiddenNftsExpanded}
          label={t('hidden.nfts.info.text.button', { numHidden })}
          mx="$spacing4"
          onPress={onHiddenRowPressed}
        />
        {hiddenNftsExpanded && <ShowNFTModal />}
      </Flex>
    )
  }

  return null
})
