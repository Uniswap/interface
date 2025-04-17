import { waitFor } from '@testing-library/react-native'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { ethToken, removeSafetyInfo, token, usdcArbitrumToken } from 'uniswap/src/test/fixtures'
import { renderHook } from 'uniswap/src/test/test-utils'
import { createArray, queryResolvers } from 'uniswap/src/test/utils'

describe(useSearchTokens, () => {
  it('returns undefined when there is no data', async () => {
    const { resolvers } = queryResolvers({
      searchTokens: () => undefined,
    })
    const { result } = renderHook(() => useSearchTokens('', null, false), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current.loading).toEqual(false)
      expect(result.current.data).toBe(undefined)
    })
  })

  it('renders without error', async () => {
    const { resolvers, resolved } = queryResolvers({
      searchTokens: () => createArray(5, token),
    })
    const { result } = renderHook(() => useSearchTokens('hi', null, false), {
      resolvers,
    })

    await waitFor(async () => {
      const expectedData = (await resolved.searchTokens)
        .map(gqlTokenToCurrencyInfo)
        .map(removeSafetyInfo)
        .map((item) => ({ ...item, isFromOtherNetwork: false }))
      const actualData = result.current.data?.map(removeSafetyInfo)

      expect(actualData).toEqual(expectedData)
    })
  })

  it('searches all networks for address search with no chain filter', async () => {
    const { resolvers } = queryResolvers({
      searchTokens: () => createArray(5, token),
    })
    const { result } = renderHook(() => useSearchTokens('0x1234567890123456789012345678901234567890', null, false), {
      resolvers,
    })

    await waitFor(async () => {
      expect(result.current.loading).toEqual(false)
      // All tokens should have isFromOtherNetwork: false since no chain filter is provided
      expect(result.current.data?.every((item) => item.isFromOtherNetwork === false)).toBe(true)
    })
  })

  it('separates tokens by network for address search with chain filter', async () => {
    // Create tokens from different chains

    const allTokens = [ethToken(), usdcArbitrumToken()]

    const { resolvers } = queryResolvers({
      searchTokens: () => allTokens,
    })

    // Search with Ethereum chain filter
    const { result } = renderHook(
      () => useSearchTokens('0x1234567890123456789012345678901234567890', UniverseChainId.Mainnet, false),
      {
        resolvers,
      },
    )

    await waitFor(async () => {
      expect(result.current.loading).toEqual(false)
      expect(result.current.data).toBeDefined()

      if (result.current.data) {
        // Check that we get the right count of tokens
        expect(result.current.data.length).toBe(allTokens.length)

        // Check that Ethereum tokens have isFromOtherNetwork: false
        const ethereumResults = result.current.data.filter(
          (item) => item.currency.chainId === Number(UniverseChainId.Mainnet),
        )
        expect(ethereumResults.length).toBe(1)
        expect(ethereumResults.every((item) => item.isFromOtherNetwork === false)).toBe(true)

        // Check that non-Ethereum tokens have isFromOtherNetwork: true
        const otherNetworkResults = result.current.data.filter(
          (item) => item.currency.chainId !== Number(UniverseChainId.Mainnet),
        )
        expect(otherNetworkResults.length).toBe(1)
        expect(otherNetworkResults.every((item) => item.isFromOtherNetwork === true)).toBe(true)
      }
    })
  })

  it('processes tokens for non-address searches', async () => {
    // Create tokens from different chains
    const allTokens = [ethToken(), usdcArbitrumToken()]

    const { resolvers } = queryResolvers({
      searchTokens: () => allTokens,
    })

    // Search with a term that's not an address
    const { result } = renderHook(() => useSearchTokens('not an address', UniverseChainId.Mainnet, false), {
      resolvers,
    })

    await waitFor(() => {
      // For non-address searches, all tokens should have isFromOtherNetwork: false
      expect(result.current.data?.every((item) => item.isFromOtherNetwork === false)).toBe(true)
    })
  })
})
