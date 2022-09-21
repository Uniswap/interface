import clsx from 'clsx'
import useDebounce from 'hooks/useDebounce'
import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionSearch, FilterButton } from 'nft/components/collection'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Center } from 'nft/components/Flex'
import { Row } from 'nft/components/Flex'
import { NonRarityIcon, RarityIcon } from 'nft/components/icons'
import { bodySmall, buttonTextMedium, header2 } from 'nft/css/common.css'
import { vars } from 'nft/css/sprinkles.css'
import {
  CollectionFilters,
  initialCollectionFilterState,
  useCollectionFilters,
  useFiltersExpanded,
  useIsMobile,
} from 'nft/hooks'
import { SortBy, SortByPointers, Trait } from 'nft/hooks/useCollectionFilters'
import { AssetsFetcher } from 'nft/queries'
import { DropDownOption, GenieAsset, GenieCollection, UniformHeight, UniformHeights } from 'nft/types'
import qs from 'query-string'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'
import { useLocation } from 'react-router-dom'

const rarityStatusCache = new Map<string, boolean>()
function getRarityStatus(id: string, assets?: (GenieAsset | undefined)[]) {
  if (rarityStatusCache.has(id)) {
    return rarityStatusCache.get(id)
  }
  let hasRarity = false
  assets &&
    Array.from(assets).forEach((asset) => {
      if (hasRarity) {
        return
      }
      if (asset?.rarity) {
        hasRarity = true
      }
    })
  if (hasRarity) {
    rarityStatusCache.set(id, hasRarity)
  }

  return hasRarity
}

const urlParamsUtils = {
  removeDefaults: (query: any) => {
    const clonedQuery: Record<string, any> = { ...query }

    // Leveraging default values & not showing them on URL
    for (const key in clonedQuery) {
      const valueInQuery = clonedQuery[key]
      const initialValue = initialCollectionFilterState[key as keyof typeof initialCollectionFilterState]

      if (JSON.stringify(valueInQuery) === JSON.stringify(initialValue)) {
        delete clonedQuery[key]
      }
    }

    // Doing this one manually due to name mismatch - "all" in url, "buyNow" in state
    if (clonedQuery['all'] !== initialCollectionFilterState.buyNow) {
      delete clonedQuery['all']
    }

    const defaultSortByPointer = SortByPointers[initialCollectionFilterState.sortBy]
    if (clonedQuery['sort'] === defaultSortByPointer) {
      delete clonedQuery['sort']
    }

    return clonedQuery
  },

  // Making values in our URL more state-friendly
  buildQuery: (query: any, collectionStats: GenieCollection) => {
    const clonedQuery: Record<string, any> = { ...query }

    ;['traits', 'markets'].forEach((key) => {
      if (!clonedQuery[key]) {
        clonedQuery[key] = []
      }

      /* 
        query-string package treats arrays with one value as a string.
        Here we're making sure that we have an array, not a string. Example:
          const foo = 'hey' // => ['hey']
      */
      if (clonedQuery[key] && typeof clonedQuery[key] === 'string') {
        clonedQuery[key] = [clonedQuery[key]]
      }
    })

    try {
      const { buyNow: initialBuyNow, search: initialSearchText } = initialCollectionFilterState

      Object.entries(SortByPointers).forEach(([key, value]) => {
        if (value === clonedQuery['sort']) {
          clonedQuery['sortBy'] = Number(key)
        }
      })

      clonedQuery['buyNow'] = !(clonedQuery['all'] === undefined ? !initialBuyNow : clonedQuery['all'])
      clonedQuery['search'] = clonedQuery['search'] === undefined ? initialSearchText : String(clonedQuery['search'])

      /*
        Handling an edge case caused by query-string's bad array parsing, when user
        only selects one trait and reloads the page.
        Here's the general data-structure for our traits in URL: 
          `traits=("trait_type","trait_value"),("trait_type","trait_value")`

        Expected behavior: When user selects one trait, there should be an array
        containing one element.

        Actual behavior: It creates an array with two elements, first element being
        trait_type & the other trait_value. This causes confusion since we don't know
        whether user has selected two traits (cause we have two elements in our array)
        or it's only one.

        Using this block of code, we'll identify if that's the case.
      */

      if (clonedQuery['traits'].length === 2) {
        const [trait_type, trait_value] = clonedQuery['traits'] as [string, string]
        const fullTrait = `${trait_type}${trait_value}`
        if (!fullTrait.includes(',')) {
          if (
            trait_type.startsWith('(') &&
            !trait_type.endsWith(')') &&
            trait_value.endsWith(')') &&
            !trait_value.startsWith('(')
          )
            clonedQuery['traits'] = [`${trait_type},${trait_value}`]
        }
      }

      clonedQuery['traits'] = clonedQuery['traits'].map((queryTrait: string) => {
        const modifiedTrait = trimTraitStr(queryTrait.replace(/(")/g, ''))
        const [trait_type, trait_value] = modifiedTrait.split(',')
        const traitInStats = collectionStats.traits.find(
          (item) => item.trait_type === trait_type && item.trait_value === trait_value
        )

        /*
          For most cases, `traitInStats` is assigned. In case the trait
          does not exist in our store, e.g "Number of traits", we have to
          manually create an object for it.
        */
        const trait = traitInStats || { trait_type, trait_value, trait_count: 0 }

        return trait as Trait
      })
    } catch (err) {
      clonedQuery['traits'] = []
    }

    return clonedQuery
  },
}

const trimTraitStr = (trait: string) => {
  return trait.substring(1, trait.length - 1)
}

interface CollectionNftsProps {
  contractAddress: string
  collectionStats: GenieCollection
}

export const CollectionNfts = ({ contractAddress, collectionStats }: CollectionNftsProps) => {
  const traits = useCollectionFilters((state) => state.traits)
  const minPrice = useCollectionFilters((state) => state.minPrice)
  const maxPrice = useCollectionFilters((state) => state.maxPrice)
  const markets = useCollectionFilters((state) => state.markets)
  const sortBy = useCollectionFilters((state) => state.sortBy)
  const searchByNameText = useCollectionFilters((state) => state.search)
  const setSortBy = useCollectionFilters((state) => state.setSortBy)

  const debouncedMinPrice = useDebounce(minPrice, 500)
  const debouncedMaxPrice = useDebounce(maxPrice, 500)
  const buyNow = useCollectionFilters((state) => state.buyNow)
  const {
    data: collectionAssets,
    isSuccess: AssetsFetchSuccess,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    [
      'collectionNfts',
      {
        traits,
        contractAddress,
        markets,
        notForSale: !buyNow,
        sortBy,
        searchByNameText,
        debouncedMinPrice,
        debouncedMaxPrice,
      },
    ],
    async ({ pageParam = 0 }) => {
      let sort = null
      switch (sortBy) {
        case SortBy.HighToLow: {
          sort = { currentEthPrice: 'desc' }
          break
        }
        case SortBy.RareToCommon: {
          sort = { 'rarity.providers.0.rank': 1 }
          break
        }
        case SortBy.CommonToRare: {
          sort = { 'rarity.providers.0.rank': -1 }
          break
        }
        default:
      }

      return await AssetsFetcher({
        contractAddress,
        sort: sort ?? undefined,
        markets,
        notForSale: !buyNow,
        searchText: searchByNameText,
        pageParam,
        traits,
        price: {
          low: debouncedMinPrice,
          high: debouncedMaxPrice,
          symbol: 'ETH',
        },
      })
    },
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage?.flat().length === 25 ? pages.length : null
      },
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: 5000,
    }
  )

  const syncLocalFiltersWithURL = useCallback((state: CollectionFilters) => {
    const urlFilterItems = [
      'markets',
      'maxPrice',
      'maxRarity',
      'minPrice',
      'minRarity',
      'traits',
      'all',
      'search',
      'sort',
    ] as const

    const query: Record<string, any> = {}
    urlFilterItems.forEach((key) => {
      switch (key) {
        case 'traits':
          const traits = state.traits.map(({ trait_type, trait_value }) => `("${trait_type}","${trait_value}")`)

          query['traits'] = traits
          break

        case 'all':
          query['all'] = !state.buyNow
          break

        case 'sort':
          query['sort'] = SortByPointers[state.sortBy]
          break

        default:
          query[key] = state[key]
          break
      }
    })

    const modifiedQuery = urlParamsUtils.removeDefaults(query)

    // Applying local state changes to URL
    const url = window.location.href.split('?')[0]
    const stringifiedQuery = qs.stringify(modifiedQuery, { arrayFormat: 'comma' })

    // Using pushState on purpose here. router.push() will trigger re-renders & API calls.
    window.history.pushState({}, ``, `${url}${stringifiedQuery && `?${stringifiedQuery}`}`)
  }, [])

  const location = useLocation()

  const applyFiltersFromURL = useCallback(() => {
    if (!location.search) return

    const query = qs.parse(location.search, {
      arrayFormat: 'comma',
      parseNumbers: true,
      parseBooleans: true,
    }) as {
      maxPrice: string
      maxRarity: string
      minPrice: string
      minRarity: string
      search: string
      sort: string
      sortBy: number
      all: boolean
      buyNow: boolean
      traits: string[]
      markets: string[]
    }
    const modifiedQuery = urlParamsUtils.buildQuery(query, collectionStats)

    requestAnimationFrame(() => {
      useCollectionFilters.setState(modifiedQuery as any)
    })
  }, [collectionStats, location.search])
  const [uniformHeight, setUniformHeight] = useState<UniformHeight>(UniformHeights.unset)
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()
  const oldStateRef = useRef<CollectionFilters | null>(null)
  const isMobile = useIsMobile()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()

  const collectionNfts = useMemo(() => {
    if (!collectionAssets || !AssetsFetchSuccess) return undefined

    return collectionAssets.pages.flat()
  }, [collectionAssets, AssetsFetchSuccess])

  const hasRarity = getRarityStatus(collectionStats?.address, collectionNfts)

  const sortDropDownOptions: DropDownOption[] = useMemo(
    () =>
      hasRarity
        ? [
            {
              displayText: 'Low to High',
              onClick: () => setSortBy(SortBy.LowToHigh),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 2,
            },
            {
              displayText: 'High to Low',
              onClick: () => setSortBy(SortBy.HighToLow),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 1,
            },
            {
              displayText: 'Rare to Common',
              onClick: () => setSortBy(SortBy.RareToCommon),
              icon: <RarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 4,
            },
            {
              displayText: 'Common to Rare',
              onClick: () => setSortBy(SortBy.CommonToRare),
              icon: <RarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 3,
            },
          ]
        : [
            {
              displayText: 'Low to High',
              onClick: () => setSortBy(SortBy.LowToHigh),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 2,
            },
            {
              displayText: 'High to Low',
              onClick: () => setSortBy(SortBy.HighToLow),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 1,
            },
          ],
    [hasRarity, setSortBy]
  )

  useEffect(() => {
    setUniformHeight(UniformHeights.unset)
  }, [contractAddress])

  // Applying filters from URL to local state
  useEffect(() => {
    collectionStats?.traits && applyFiltersFromURL()

    collectionStats?.traits &&
      useCollectionFilters.subscribe((state) => {
        if (JSON.stringify(oldStateRef.current) !== JSON.stringify(state)) {
          syncLocalFiltersWithURL(state)
          oldStateRef.current = state
        }
      })
  }, [applyFiltersFromURL, collectionStats?.traits, syncLocalFiltersWithURL])

  return (
    <>
      <AnimatedBox position="sticky" top="72" width="full" zIndex="3">
        <Box backgroundColor="white08" width="full" paddingBottom="8" style={{ backdropFilter: 'blur(24px)' }}>
          <Row marginTop="12" gap="12">
            <FilterButton
              isMobile={isMobile}
              isFiltersExpanded={isFiltersExpanded}
              onClick={() => setFiltersExpanded(!isFiltersExpanded)}
              collectionCount={collectionNfts?.[0]?.totalCount ?? 0}
            />
            <SortDropdown dropDownOptions={sortDropDownOptions} />
            <CollectionSearch />
          </Row>
        </Box>
      </AnimatedBox>
      <InfiniteScroll
        next={fetchNextPage}
        hasMore={hasNextPage ?? false}
        loader={hasNextPage ? <p>Loading from scroll...</p> : null}
        dataLength={collectionNfts?.length ?? 0}
        style={{ overflow: 'unset' }}
      >
        {collectionNfts && collectionNfts.length > 0 ? (
          <div className={styles.assetList}>
            {collectionNfts.map((asset) => {
              return asset ? (
                <CollectionAsset
                  key={asset.address + asset.tokenId}
                  asset={asset}
                  uniformHeight={uniformHeight}
                  setUniformHeight={setUniformHeight}
                  mediaShouldBePlaying={asset.tokenId === currentTokenPlayingMedia}
                  setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
                />
              ) : null
            })}
          </div>
        ) : (
          <Center width="full" color="darkGray" style={{ height: '60vh' }}>
            <div style={{ display: 'block', textAlign: 'center' }}>
              <p className={header2}>No NFTS found</p>
              <Box className={clsx(bodySmall, buttonTextMedium)} color="blue" cursor="pointer">
                View full collection
              </Box>
            </div>
          </Center>
        )}
      </InfiniteScroll>
    </>
  )
}
