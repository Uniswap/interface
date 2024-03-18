import { faker } from '@faker-js/faker'
import {
  formatNFTCollectionSearchResults,
  formatTokenSearchResults,
  gqlNFTToNFTCollectionSearchResult,
} from 'src/components/explore/search/utils'
import {
  Chain,
  ExploreSearchQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { SearchResultType } from 'wallet/src/features/search/SearchResult'
import {
  amount,
  ethToken,
  nftCollection,
  nftContract,
  token,
  tokenMarket,
  tokenProject,
} from 'wallet/src/test/fixtures'
import { createArray } from 'wallet/src/test/utils'

type ExploreSearchResult = NonNullable<ExploreSearchQuery>

describe(formatTokenSearchResults, () => {
  it('returns undefined if there is no data', () => {
    expect(formatTokenSearchResults(null, '')).toEqual(undefined)
  })

  it('filters out duplicate results', () => {
    const searchToken = token()
    const data = createArray(2, () => searchToken)

    const result = formatTokenSearchResults(data, '')

    expect(result).toHaveLength(1)
    expect(result?.[0]?.address).toEqual(data[0].address)
  })

  it('uses tokens with highest volume for tokens with the same project id', () => {
    const changedAddress = faker.finance.ethereumAddress()

    const data = [
      // Tokens with the same address and chain will have the same project id
      ethToken({
        market: tokenMarket({ volume: amount({ value: 10 }) }),
      }),
      ethToken({
        address: changedAddress,
        market: tokenMarket({ volume: amount({ value: 100 }) }),
      }),
      ethToken({
        market: tokenMarket({ volume: amount({ value: 20 }) }),
      }),
    ]

    const result = formatTokenSearchResults(data, '')

    // Filters out the first token (both tokens share the same project id)
    expect(result).toHaveLength(1)
    // Uses the token with highest volume
    expect(result?.[0]?.address).toEqual(changedAddress)
  })

  it('sorts results by best search query match', () => {
    const data: ExploreSearchResult['searchTokens'] = [
      ethToken({ project: tokenProject({ name: 'UniswapStartingName' }) }),
      ethToken({ project: tokenProject({ name: 'Uniswap' }) }),
    ]

    const result = formatTokenSearchResults(data, 'uniswap')

    expect(result).toHaveLength(2)
    expect(result?.[0]?.name).toEqual('Uniswap')
    expect(result?.[1]?.name).toEqual('UniswapStartingName')
  })

  it('properly formats token search result', () => {
    const searchToken = token()
    const data = [searchToken]

    const result = formatTokenSearchResults(data, '')

    expect(result).toHaveLength(1)
    expect(result?.[0]?.type).toEqual(SearchResultType.Token)
    expect(result?.[0]?.chainId).toEqual(fromGraphQLChain(searchToken.chain))
    expect(result?.[0]?.address).toEqual(searchToken.address)
    expect(result?.[0]?.name).toEqual(searchToken.project?.name)
    expect(result?.[0]?.symbol).toEqual(searchToken.symbol)
    expect(result?.[0]?.logoUrl).toEqual(searchToken.project?.logoUrl)
    expect(result?.[0]?.safetyLevel).toEqual(searchToken.project?.safetyLevel)
  })

  describe(gqlNFTToNFTCollectionSearchResult, () => {
    const collection = nftCollection({
      nftContracts: [nftContract({ chain: Chain.Ethereum })],
    })

    it('returns null if required data is missing', () => {
      expect(gqlNFTToNFTCollectionSearchResult({ ...collection, name: null })).toEqual(null)
      expect(gqlNFTToNFTCollectionSearchResult({ ...collection, nftContracts: undefined })).toEqual(
        null
      )
      expect(gqlNFTToNFTCollectionSearchResult({ ...collection, nftContracts: [] })).toEqual(null)
    })

    it('properly formats NFT collection search result', () => {
      const result = gqlNFTToNFTCollectionSearchResult(collection)

      expect(result?.type).toEqual(SearchResultType.NFTCollection)
      expect(result?.chainId).toEqual(fromGraphQLChain(Chain.Ethereum))
      expect(result?.address).toEqual(collection.nftContracts[0]?.address)
      expect(result?.name).toEqual(collection?.name)
      expect(result?.imageUrl).toEqual(collection?.image?.url)
      expect(result?.isVerified).toEqual(collection?.isVerified)
    })
  })

  describe(formatNFTCollectionSearchResults, () => {
    it('returns undefined if there is no data', () => {
      expect(formatNFTCollectionSearchResults(null)).toEqual(undefined)
    })

    it('filters out nfts that cannot be formatted', () => {
      const topNFTCollections = createArray(2, nftCollection)
      const nftSearchResult = {
        edges: [
          ...topNFTCollections.map((nft) => ({ node: nft })),
          { node: nftCollection({ name: null }) },
        ],
      }

      const result = formatNFTCollectionSearchResults(nftSearchResult)

      expect(result).toHaveLength(2)
      expect(result?.[0]?.address).toEqual(topNFTCollections[0].nftContracts[0]?.address)
      expect(result?.[1]?.address).toEqual(topNFTCollections[1].nftContracts[0]?.address)
    })
  })
})
