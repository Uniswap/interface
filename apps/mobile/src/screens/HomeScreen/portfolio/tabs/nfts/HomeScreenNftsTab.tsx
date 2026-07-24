import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { useScrollWindow } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useScrollWindow'
import { useWalletTabEmptyStyle } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useWalletTabEmptyStyle'
import { TabMeasuredLayout } from 'src/screens/HomeScreen/portfolio/tabs/common/TabMeasuredLayout'
import { EmptyNftsCard } from 'src/screens/HomeScreen/portfolio/tabs/nfts/empty/EmptyNftsCard'
import { MOBILE_NFT_LOADING_ITEM, NftPairRow, NftSpecialRow } from 'src/screens/HomeScreen/portfolio/tabs/nfts/NftRows'
import type { NftTabRenderData } from 'src/screens/HomeScreen/portfolio/types'
import { Flex, Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import type { NFTItem } from 'uniswap/src/features/nfts/types'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'

type NftRowDescriptor =
  | { kind: 'pair'; key: string; left: NFTItem; right?: NFTItem }
  | { kind: 'special'; key: string; value: string }

interface HomeScreenNftsTabProps {
  testID?: string
  owner: string
  shouldLoadNfts: boolean
  nftListRenderData: NftTabRenderData
  onHeightChange: (height: number) => void
  /** Outer FlatList scroll offset; used to derive which pair rows are within the visible window. */
  feedScrollValue: SharedValue<number>
  /** Outer FlatList viewport height, approximately device height. */
  viewportHeight: number
  /** Y-offset of the NFT tab's first row inside the outer FlatList content. */
  bodyOffsetY: number
  /** Computed height of one `NftPairRow`, used for placeholder style and windowing math. */
  pairRowHeight: number
}

export const HomeScreenNftsTab = memo(function HomeScreenNftsTabInner({
  testID,
  owner,
  shouldLoadNfts,
  nftListRenderData,
  onHeightChange,
  feedScrollValue,
  viewportHeight,
  bodyOffsetY,
  pairRowHeight,
}: HomeScreenNftsTabProps): JSX.Element {
  const emptyComponentStyle = useWalletTabEmptyStyle()
  const { t } = useTranslation()
  const {
    nfts,
    isPending,
    isErrorState,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    shouldAddInLoadingItem,
    refetch: refetchNfts,
    numHidden,
    isFetchingMore,
  } = nftListRenderData

  const setNftHiddenExpandedBool = useCallback(
    (value: boolean) => {
      setHiddenNftsExpanded(value)
    },
    [setHiddenNftsExpanded],
  )

  const handleRetryNfts = useCallback(() => {
    refetchNfts()
  }, [refetchNfts])

  const rowDescriptors = useMemo<NftRowDescriptor[]>(() => {
    const out: NftRowDescriptor[] = []
    let i = 0
    while (i < nfts.length) {
      const el = nfts[i]
      if (el === undefined) {
        i += 1
        continue
      }
      if (typeof el === 'string') {
        out.push({ kind: 'special', key: `nft-sp-${el}-${i}`, value: el })
        i += 1
        continue
      }
      const next = nfts[i + 1]
      if (next === undefined || typeof next === 'string') {
        out.push({
          kind: 'pair',
          key: `nft-pair-${getNFTAssetKey(el.contractAddress ?? '', el.tokenId ?? '')}-e`,
          left: el,
        })
        i += 1
      } else {
        out.push({
          kind: 'pair',
          key: `nft-pair-${getNFTAssetKey(el.contractAddress ?? '', el.tokenId ?? '')}-${getNFTAssetKey(next.contractAddress ?? '', next.tokenId ?? '')}`,
          left: el,
          right: next,
        })
        i += 2
      }
    }
    return out
  }, [nfts])

  const isRowVisible = useScrollWindow({
    feedScrollValue,
    viewportHeight,
    bodyOffsetY,
    numRows: rowDescriptors.length,
    rowHeight: pairRowHeight,
  })

  if (!shouldLoadNfts) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex />
      </TabMeasuredLayout>
    )
  }

  if (nfts.length === 0 && isPending) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex px="$spacing12">
          <Loader.NFT repeat={6} />
        </Flex>
      </TabMeasuredLayout>
    )
  }

  if (nfts.length === 0 && isErrorState) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex centered px="$spacing12" style={emptyComponentStyle}>
          <BaseCard.ErrorState
            description={t('common.error.general')}
            retryButtonLabel={t('common.button.retry')}
            title={t('tokens.nfts.list.error.load.title')}
            onRetry={handleRetryNfts}
          />
        </Flex>
      </TabMeasuredLayout>
    )
  }

  if (nfts.length === 0) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex centered pt="$spacing48" px="$spacing36" style={emptyComponentStyle}>
          <EmptyNftsCard />
        </Flex>
      </TabMeasuredLayout>
    )
  }

  const placeholderStyle: ViewStyle = { height: pairRowHeight, width: '100%' }

  return (
    <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
      {rowDescriptors.map((row, i) => {
        if (row.kind === 'special') {
          return (
            <NftSpecialRow
              key={row.key}
              value={row.value}
              hiddenNftsExpanded={hiddenNftsExpanded}
              numHidden={numHidden}
              setHiddenNftsExpanded={setNftHiddenExpandedBool}
            />
          )
        }
        if (!isRowVisible(i)) {
          return <View key={row.key} style={placeholderStyle} />
        }
        return <NftPairRow key={row.key} left={row.left} right={row.right} owner={owner} />
      })}
      {shouldAddInLoadingItem && (
        <NftSpecialRow
          value={MOBILE_NFT_LOADING_ITEM}
          hiddenNftsExpanded={hiddenNftsExpanded}
          numHidden={numHidden}
          setHiddenNftsExpanded={setNftHiddenExpandedBool}
        />
      )}
      {nfts.length > 0 && isFetchingMore && (
        <Flex px="$spacing12">
          <Loader.NFT repeat={6} />
        </Flex>
      )}
    </TabMeasuredLayout>
  )
})
