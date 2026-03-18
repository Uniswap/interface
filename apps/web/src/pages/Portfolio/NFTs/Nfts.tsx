import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, useMedia } from 'ui/src'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NftsListEmptyState } from 'uniswap/src/components/nfts/NftsListEmptyState'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PortfolioExpandoRow } from '~/pages/Portfolio/components/PortfolioExpandoRow'
import { SearchInput } from '~/pages/Portfolio/components/SearchInput'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { NFTCard, setOpenNftPopoverId } from '~/pages/Portfolio/NFTs/NFTCard'
import { NFTCardSkeleton } from '~/pages/Portfolio/NFTs/NFTCardSkeleton'
import { assume0xAddress } from '~/utils/wagmi'

const LOADING_SKELETON_COUNT = 10

// Memoized wrapper component to avoid recreating Flex structure on every render
const NFTItemWrapper = memo(function NFTItemWrapper({ item, owner }: { item: NFTItem; owner: Address }): JSX.Element {
  return (
    <Flex centered>
      <Flex m="$spacing4" maxWidth={200} width="100%">
        <NFTCard id={item.tokenId ?? ''} walletAddresses={[owner]} item={item} owner={owner} />
      </Flex>
    </Flex>
  )
})

export function PortfolioNfts(): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const navigate = useNavigate()
  const { evmAddress, svmAddress } = usePortfolioAddresses()
  const { chainId: selectedChainId, isExternalWallet } = usePortfolioRoutes()
  const nftsContainerRef = useRef<HTMLDivElement>(null)
  const owner = assume0xAddress(evmAddress) ?? ''
  const isSolanaOnlyWallet = Boolean(svmAddress && !evmAddress)

  useEffect(() => {
    // Reset popover state when component unmounts
    return () => {
      setOpenNftPopoverId(null)
    }
  }, [])

  // renderNFTItem uses memoized wrapper component to avoid recreating Flex structure
  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      return <NFTItemWrapper item={item} owner={owner} />
    },
    [owner],
  )

  // Custom loading state with Portfolio-specific skeleton
  const customLoadingState = useMemo(
    () => (
      <>
        {Array.from({ length: LOADING_SKELETON_COUNT }, (_, i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </>
    ),
    [],
  )

  // Memoize renderExpandoRow to avoid recreating the function on every render
  const renderExpandoRow = useCallback(
    ({ isExpanded, label, onPress }: { isExpanded: boolean; label: string; onPress: () => void }) => (
      <PortfolioExpandoRow isExpanded={isExpanded} label={label} onPress={onPress} />
    ),
    [],
  )

  // Handler to clear chain filter and show all networks
  const handleShowAllNetworks = useCallback(() => {
    navigate('/portfolio/nfts')
  }, [navigate])

  // Custom empty state for chain filtering
  const chainFilterEmptyState = useMemo(() => {
    if (!selectedChainId) {
      if (isSolanaOnlyWallet) {
        const solanaChainName = getChainLabel(UniverseChainId.Solana)
        const title = t('tokens.nfts.list.notSupported.title', { chainName: solanaChainName })
        return <NftsListEmptyState dataTestId={TestID.PortfolioNftsEmptyState} description={null} title={title} />
      }
      return undefined
    }
    const chainName = getChainLabel(selectedChainId)
    const chainInfo = getChainInfo(selectedChainId)
    const hasNFTSupport = chainInfo.supportsNFTs === true
    const title = hasNFTSupport
      ? t('tokens.nfts.list.noneOnChain.title', { chainName })
      : t('tokens.nfts.list.notSupported.title', { chainName })
    return (
      <NftsListEmptyState
        buttonDataTestId={TestID.PortfolioNftsSeeAllNetworksButton}
        description={null}
        dataTestId={TestID.PortfolioNftsEmptyState}
        onPress={handleShowAllNetworks}
        title={title}
        buttonLabel={t('portfolio.networkFilter.seeAllNetworks')}
      />
    )
  }, [handleShowAllNetworks, selectedChainId, t, isSolanaOnlyWallet])

  const externalWalletEmptyState = useMemo(() => {
    if (!isExternalWallet) {
      return undefined
    }
    return (
      <NftsListEmptyState
        dataTestId={TestID.PortfolioNftsEmptyState}
        description={t('tokens.nfts.list.none.description.external')}
      />
    )
  }, [isExternalWallet, t])

  return (
    <Trace logImpression page={InterfacePageName.PortfolioNftsPage} properties={{ isExternal: isExternalWallet }}>
      <Flex gap="$spacing24" mt="$spacing12">
        <Trace section={SectionName.PortfolioNftsTab} element={ElementName.NftsList}>
          <Flex ref={nftsContainerRef}>
            <NftsList
              owner={owner}
              renderNFTItem={renderNFTItem}
              autoColumns={!media.md}
              loadingSkeletonCount={LOADING_SKELETON_COUNT}
              customLoadingState={customLoadingState}
              chainsFilter={selectedChainId ? [selectedChainId] : undefined}
              skip={!owner}
              renderExpandoRow={renderExpandoRow}
              customEmptyState={
                selectedChainId || isSolanaOnlyWallet ? chainFilterEmptyState : externalWalletEmptyState
              }
              nextFetchPolicy="cache-first"
              showHeader
              SearchInputComponent={SearchInput}
              searchInputTestId={TestID.PortfolioNftsSearchInput}
              headerTestId={TestID.PortfolioNftsHeader}
              noResultsTestId={TestID.PortfolioNftsNoResults}
              emptyStateTestId={TestID.PortfolioNftsEmptyState}
              pollInterval={PollingInterval.Slow}
            />
          </Flex>
        </Trace>
      </Flex>
    </Trace>
  )
}
