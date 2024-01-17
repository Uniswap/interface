import { faker } from '@faker-js/faker'
import {
  formatNFTCollectionSearchResults,
  formatTokenSearchResults,
  gqlNFTToNFTCollectionSearchResult,
} from 'src/components/explore/search/utils'
import { SearchResultType } from 'src/features/explore/SearchResult'
import { Chain, ExploreSearchQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { SearchTokens, TopNFTCollections } from 'wallet/src/test/gqlFixtures'

type ExploreSearchResult = NonNullable<ExploreSearchQuery>

describe(formatTokenSearchResults, () => {
  it('returns undefined if there is no data', () => {
    expect(formatTokenSearchResults(null, '')).toEqual(undefined)
  })

  it('filters out duplicate results', () => {
    const data = [SearchTokens[0], SearchTokens[0]] as ExploreSearchResult['searchTokens']

    const result = formatTokenSearchResults(data, '')

    expect(result).toHaveLength(1)
    expect(result?.[0]?.address).toEqual(SearchTokens?.[0]?.address)
  })

  it('uses tokens with highest volume for duplicate results', () => {
    const changedAddress = faker.finance.ethereumAddress()

    const data = [
      SearchTokens[0],
      {
        ...SearchTokens[0],
        address: changedAddress,
        market: {
          volume: {
            value: 100,
          },
        },
      },
    ] as ExploreSearchResult['searchTokens']

    const result = formatTokenSearchResults(data, '')

    // Filters out the first token (both tokens share the same project id)
    expect(result).toHaveLength(1)
    // Uses the token with highest volume
    expect(result?.[0]?.address).toEqual(changedAddress)
  })

  it('sorts results by search query match', () => {
    const data: ExploreSearchResult['searchTokens'] = [
      {
        project: {
          name: 'UniswapStartingName',
          id: '2',
        },
        chain: Chain.Ethereum,
      },
      {
        project: {
          name: 'Uniswap',
          id: '1',
        },
        chain: Chain.Ethereum,
      },
    ]

    const result = formatTokenSearchResults(data, 'uniswap')

    expect(result).toHaveLength(2)
    expect(result?.[0]?.name).toEqual('Uniswap')
    expect(result?.[1]?.name).toEqual('UniswapStartingName')
  })

  it('properly formats token search result', () => {
    const data = [SearchTokens[0]] as ExploreSearchResult['searchTokens']

    const result = formatTokenSearchResults(data, '')

    expect(result).toHaveLength(1)
    expect(result?.[0]?.type).toEqual(SearchResultType.Token)
    expect(result?.[0]?.chainId).toEqual(fromGraphQLChain(SearchTokens[0]?.chain))
    expect(result?.[0]?.address).toEqual(SearchTokens?.[0]?.address)
    expect(result?.[0]?.name).toEqual(SearchTokens?.[0]?.project?.name)
    expect(result?.[0]?.symbol).toEqual(SearchTokens?.[0]?.symbol)
    expect(result?.[0]?.logoUrl).toEqual(SearchTokens?.[0]?.project?.logoUrl)
    expect(result?.[0]?.safetyLevel).toEqual(SearchTokens?.[0]?.project?.safetyLevel)
  })
})

describe(gqlNFTToNFTCollectionSearchResult, () => {
  const node = TopNFTCollections[0]

  it('returns null if required data is missing', () => {
    expect(gqlNFTToNFTCollectionSearchResult({ ...node, name: null })).toEqual(null)
    expect(gqlNFTToNFTCollectionSearchResult({ ...node, nftContracts: undefined })).toEqual(null)
    expect(gqlNFTToNFTCollectionSearchResult({ ...node, nftContracts: [] })).toEqual(null)
  })

  it('properly formats NFT collection search result', () => {
    const result = gqlNFTToNFTCollectionSearchResult(node)

    expect(result?.type).toEqual(SearchResultType.NFTCollection)
    expect(result?.chainId).toEqual(fromGraphQLChain(Chain.Ethereum))
    expect(result?.address).toEqual(node?.nftContracts?.[0]?.address)
    expect(result?.name).toEqual(node?.name)
    expect(result?.imageUrl).toEqual(node?.image?.url)
    expect(result?.isVerified).toEqual(node?.isVerified)
  })
})

describe(formatNFTCollectionSearchResults, () => {
  it('returns undefined if there is no data', () => {
    expect(formatNFTCollectionSearchResults(null)).toEqual(undefined)
  })

  it('filters out nfts that cannot be formatted', () => {
    const nftSearchResult = {
      edges: [
        ...TopNFTCollections.map((nft) => ({ node: nft })),
        { node: { ...TopNFTCollections[0], name: null } },
      ],
    }

    const result = formatNFTCollectionSearchResults(nftSearchResult)

    expect(result).toHaveLength(2)
    expect(result?.[0]?.address).toEqual(TopNFTCollections?.[0]?.nftContracts?.[0]?.address)
    expect(result?.[1]?.address).toEqual(TopNFTCollections?.[1]?.nftContracts?.[0]?.address)
  })
})
