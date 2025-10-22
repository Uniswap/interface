import { isNonPollingRequestInFlight } from '@universe/api'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Flex, Loader, View } from 'ui/src'
import { NoNfts } from 'ui/src/components/icons/NoNfts'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { NftsListProps } from 'uniswap/src/components/nfts/NftsList'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { EMPTY_NFT_ITEM, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isExtensionApp } from 'utilities/src/platform'

const AssetsContainer = ({ children, useGrid }: { children: React.ReactNode; useGrid: boolean }): JSX.Element => {
  return (
    <View
      $platform-web={
        useGrid
          ? {
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            }
          : {}
      }
      width="100%"
      gap="$spacing2"
    >
      {children}
    </View>
  )
}

const LOADING_ITEM = 'loading'

const keyExtractor = (item: NFTItem | string): string =>
  typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

export function NftsList({
  owner,
  errorStateStyle,
  emptyStateStyle,
  renderNFTItem,
  skip,
  customEmptyState,
}: NftsListProps): JSX.Element {
  const { t } = useTranslation()

  const {
    nfts,
    numHidden,
    numShown,
    isErrorState,
    hasNextPage,
    shouldAddInLoadingItem,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    networkStatus,
    onListEndReached,
    refetch,
  } = useNftListRenderData({ owner, skip })

  const onHiddenRowPressed = useCallback((): void => {
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, setHiddenNftsExpanded])

  useEffect(() => {
    sendAnalyticsEvent(WalletEventName.NFTsLoaded, {
      shown: numShown,
      hidden: numHidden,
    })
  }, [numHidden, numShown])

  useEffect(() => {
    if (numHidden === 0 && hiddenNftsExpanded) {
      setHiddenNftsExpanded(false)
    }
  }, [hiddenNftsExpanded, numHidden, setHiddenNftsExpanded])

  const renderItem = useCallback(
    (item: string | NFTItem, index: number) => {
      if (typeof item !== 'string') {
        return renderNFTItem(item, index)
      }

      switch (item) {
        case LOADING_ITEM:
          // This case probably never occurs
          return <Loader.NFT />
        case EMPTY_NFT_ITEM:
          return null
        case HIDDEN_NFTS_ROW:
          return (
            <Flex key={keyExtractor(item)} grow gridColumn="span 2">
              <ExpandoRow
                isExpanded={hiddenNftsExpanded}
                data-testid={TestID.HiddenNftsRow}
                label={t('hidden.nfts.info.text.button', { numHidden })}
                mx="$spacing4"
                onPress={onHiddenRowPressed}
              />
              {hiddenNftsExpanded && <ShowNFTModal />}
            </Flex>
          )

        default:
          return null
      }
    },
    [hiddenNftsExpanded, numHidden, onHiddenRowPressed, renderNFTItem, t],
  )

  const onRetry = useCallback(() => refetch(), [refetch])

  const itemsToRender = useMemo(
    () => (shouldAddInLoadingItem ? [...nfts, LOADING_ITEM] : nfts),
    [nfts, shouldAddInLoadingItem],
  )

  const loadingState = useMemo(
    () => (
      <>
        <Flex gap="$spacing2">
          <Loader.NFT />
          <Loader.NFT />
          <Loader.NFT />
        </Flex>
        <Flex gap="$spacing2">
          <Loader.NFT />
          <Loader.NFT />
          <Loader.NFT />
        </Flex>
      </>
    ),
    [],
  )

  const emptyState = useMemo(
    () =>
      customEmptyState ?? (
        <Flex centered pt="$spacing48" px="$spacing36" style={emptyStateStyle}>
          <BaseCard.EmptyState
            buttonLabel={isExtensionApp ? t('tokens.nfts.list.none.button') : undefined}
            description={t('tokens.nfts.list.none.description.default')}
            icon={<NoNfts color="$neutral3" size="$icon.100" />}
            title={t('tokens.nfts.list.none.title')}
          />
        </Flex>
      ),
    [customEmptyState, emptyStateStyle, t],
  )

  const errorState = useMemo(
    () => (
      <Flex centered grow style={errorStateStyle}>
        <BaseCard.ErrorState
          description={t('common.error.general')}
          retryButtonLabel={t('common.button.retry')}
          title={t('tokens.nfts.list.error.load.title')}
          onRetry={onRetry}
        />
      </Flex>
    ),
    [errorStateStyle, onRetry, t],
  )

  const isLoadingState = isNonPollingRequestInFlight(networkStatus)

  const listContent = useMemo(() => {
    if (isLoadingState) {
      return loadingState
    }

    if (isErrorState) {
      return errorState
    }

    if (nfts.length === 0) {
      return emptyState
    }

    return itemsToRender.map(renderItem)
  }, [isLoadingState, nfts.length, itemsToRender, renderItem, errorState, emptyState, loadingState, isErrorState])

  return (
    <>
      <InfiniteScroll
        next={onListEndReached}
        hasMore={hasNextPage}
        loader={loadingState}
        dataLength={shouldAddInLoadingItem ? nfts.length + 1 : nfts.length}
        style={{ overflow: 'unset' }}
        scrollableTarget="wallet-dropdown-scroll-wrapper"
      >
        <AssetsContainer useGrid={isLoadingState || nfts.length > 0}>{listContent}</AssetsContainer>
      </InfiniteScroll>
    </>
  )
}
