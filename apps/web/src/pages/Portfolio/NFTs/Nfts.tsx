import { SearchInput } from 'pages/Portfolio/components/SearchInput'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useFilteredNfts } from 'pages/Portfolio/NFTs/hooks/useFilteredNfts'
import { NFTCard } from 'pages/Portfolio/NFTs/NFTCard'
import { NFTCardSkeleton } from 'pages/Portfolio/NFTs/NFTCardSkeleton'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { assume0xAddress } from 'utils/wagmi'

const LOADING_SKELETON_COUNT = 10
const DEFAULT_SEARCH_INPUT_WIDTH = 320

export function PortfolioNfts(): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  // TODO(PORT-485): Solana NFTs are not supported yet, add empty state for NFTs when connected to a Solana wallet only
  const { evmAddress } = usePortfolioAddresses()
  const { chainId: selectedChainId } = usePortfolioRoutes()
  const nftsContainerRef = useRef<HTMLDivElement>(null)
  const owner = assume0xAddress(evmAddress) ?? ''

  const [search, setSearch] = useState('')

  const { shownNfts, hiddenNfts } = useNftListRenderData({
    owner,
    skip: !owner,
    chainsFilter: selectedChainId ? [selectedChainId] : undefined,
  })

  // Filter NFTs by search string
  const { nfts: filteredShownNfts, count: filteredShownCount } = useFilteredNfts({
    nfts: shownNfts,
    search,
  })
  const { nfts: filteredHiddenNfts, count: filteredHiddenCount } = useFilteredNfts({
    nfts: hiddenNfts,
    search,
  })

  // Create a Set for O(1) lookup of filtered NFT keys
  const filteredNftKeys = useMemo(() => {
    const keys = new Set<string>()
    const allNfts = [...filteredShownNfts, ...filteredHiddenNfts]
    allNfts.forEach((item) => {
      keys.add(getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? ''))
    })
    return keys
  }, [filteredShownNfts, filteredHiddenNfts])

  // renderNFTItem now only handles rendering - no filtering
  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      // Quick check: if this item isn't in our filtered set, don't render
      const itemKey = getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')
      if (!filteredNftKeys.has(itemKey)) {
        return <></>
      }

      return (
        <Flex centered>
          <Flex m="$spacing4" maxWidth={200} width="100%">
            <NFTCard id={item.tokenId ?? ''} walletAddresses={[owner]} item={item} owner={owner} />
          </Flex>
        </Flex>
      )
    },
    [filteredNftKeys, owner],
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

  return (
    <Trace logImpression page={InterfacePageName.PortfolioNftsPage}>
      <Flex gap="$spacing40" mt="$spacing12">
        <Flex
          row
          alignItems="flex-end"
          justifyContent="space-between"
          $md={{ flexDirection: 'column', alignItems: 'flex-start', gap: '$spacing24' }}
        >
          <Text variant="body2" color="$neutral2">
            {filteredShownCount ? `${filteredShownCount}` : ''} {t('portfolio.nfts.title')}
          </Text>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('portfolio.nfts.search.placeholder')}
            width={media.md ? '100%' : DEFAULT_SEARCH_INPUT_WIDTH}
          />
        </Flex>

        {filteredHiddenCount > 0 && (
          <Flex ref={nftsContainerRef}>
            <NftsList
              owner={owner}
              renderNFTItem={renderNFTItem}
              autoColumns={!media.md}
              loadingSkeletonCount={LOADING_SKELETON_COUNT}
              customLoadingState={customLoadingState}
              filteredNumHidden={filteredHiddenCount}
              chainsFilter={selectedChainId ? [selectedChainId] : undefined}
            />
          </Flex>
        )}
      </Flex>
    </Trace>
  )
}
