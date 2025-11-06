import { SearchInput } from 'pages/Portfolio/components/SearchInput'
import { usePortfolioAddress } from 'pages/Portfolio/hooks/usePortfolioAddress'
import { NFTCard } from 'pages/Portfolio/NFTs/NFTCard'
import { NFTCardSkeleton } from 'pages/Portfolio/NFTs/NFTCardSkeleton'
import { filterNft } from 'pages/Portfolio/NFTs/utils/filterNfts'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { NftsList } from 'uniswap/src/components/nfts/NftsList'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { assume0xAddress } from 'utils/wagmi'

const LOADING_SKELETON_COUNT = 10

export function PortfolioNfts(): JSX.Element {
  const { t } = useTranslation()
  const owner = usePortfolioAddress()
  const nftsContainerRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const lowercaseSearch = useMemo(() => search.trim().toLowerCase(), [search])

  const { numShown } = useNftListRenderData({ owner: assume0xAddress(owner), skip: !owner })

  const renderNFTItem = useCallback(
    (item: NFTItem) => {
      if (!filterNft(item, lowercaseSearch)) {
        return <Flex display="none" />
      }

      return (
        <Flex centered>
          <Flex m="$spacing4" maxWidth={200} width="100%">
            <NFTCard
              id={item.tokenId ?? ''}
              walletAddresses={[assume0xAddress(owner)]}
              item={item}
              owner={assume0xAddress(owner)}
            />
          </Flex>
        </Flex>
      )
    },
    [lowercaseSearch, owner],
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
        <Flex row alignItems="flex-end" justifyContent="space-between">
          <Text variant="body2" color="$neutral2">
            {numShown ? `${numShown}` : ''} {t('portfolio.nfts.title')}
          </Text>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('portfolio.nfts.search.placeholder')}
            width={320}
          />
        </Flex>

        <Flex ref={nftsContainerRef}>
          <NftsList
            owner={owner}
            renderNFTItem={renderNFTItem}
            autoColumns
            loadingSkeletonCount={LOADING_SKELETON_COUNT}
            customLoadingState={customLoadingState}
          />
        </Flex>
      </Flex>
    </Trace>
  )
}
