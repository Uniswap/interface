import { UniverseChainId } from '@universe/chains'
import { OnchainItemListOptionType, type MultichainTokenOption } from 'uniswap/src/components/lists/items/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  addressSearchMatchesMultipleChains,
  RECENT_SEARCH_PILL_ROW_KEY,
  searchModalListOptionKey,
  searchModalOptionKey,
  tdpChainFilterForTokenRow,
} from 'uniswap/src/features/search/SearchModal/utils/searchModalListItem'

// Same CREATE2 address on several chains (the shape of the ticket's WBTC search).
const SHARED_ADDRESS = '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'
const OTHER_ADDRESS = '0x1111111111111111111111111111111111111111'

function createMultichainOption({
  id,
  chainId,
  currencyId,
  tdpChainFilter,
}: {
  id: string
  chainId: UniverseChainId
  currencyId: string
  tdpChainFilter?: UniverseChainId
}): MultichainTokenOption {
  const primaryCurrencyInfo = {
    currency: { chainId },
    currencyId,
  } as CurrencyInfo

  return {
    type: OnchainItemListOptionType.MultichainToken,
    multichainResult: {
      id,
      name: 'Test token',
      symbol: 'TEST',
      logoUrl: null,
      tokens: [primaryCurrencyInfo],
    },
    primaryCurrencyInfo,
    tdpChainFilter,
  }
}

describe('searchModalOptionKey', () => {
  it('preserves a nonempty multichain ID', () => {
    const option = createMultichainOption({
      id: 'multichain-id',
      chainId: UniverseChainId.Mainnet,
      currencyId: '1-0xabc',
    })

    expect(searchModalOptionKey(option)).toBe('multichain-multichain-id')
  })

  it('uses distinct primary deployment keys for empty multichain IDs', () => {
    const first = createMultichainOption({
      id: '',
      chainId: UniverseChainId.Mainnet,
      currencyId: '1-0xabc',
    })
    const second = createMultichainOption({
      id: '   ',
      chainId: UniverseChainId.ArbitrumOne,
      currencyId: '42161-0xdef',
    })

    expect(searchModalOptionKey(first)).toBe('multichain-fallback-1-1-0xabc')
    expect(searchModalOptionKey(second)).toBe('multichain-fallback-42161-42161-0xdef')
    expect(searchModalOptionKey(first)).not.toBe(searchModalOptionKey(second))
  })

  it('distinguishes the same multichain token recorded with and without a TDP chain filter', () => {
    const unfiltered = createMultichainOption({
      id: 'multichain-id',
      chainId: UniverseChainId.Mainnet,
      currencyId: '1-0xabc',
    })
    const filtered = createMultichainOption({
      id: 'multichain-id',
      chainId: UniverseChainId.Mainnet,
      currencyId: '1-0xabc',
      tdpChainFilter: UniverseChainId.ArbitrumOne,
    })

    expect(searchModalOptionKey(filtered)).toBe(`multichain-multichain-id-${UniverseChainId.ArbitrumOne}`)
    expect(searchModalOptionKey(filtered)).not.toBe(searchModalOptionKey(unfiltered))
  })
})

describe('searchModalListOptionKey', () => {
  it('keys a pill row on a stable key regardless of its members', () => {
    const first = createMultichainOption({ id: 'a', chainId: UniverseChainId.Mainnet, currencyId: '1-0xa' })
    const second = createMultichainOption({ id: 'b', chainId: UniverseChainId.Mainnet, currencyId: '1-0xb' })

    expect(searchModalListOptionKey([first])).toBe(RECENT_SEARCH_PILL_ROW_KEY)
    expect(searchModalListOptionKey([second, first])).toBe(RECENT_SEARCH_PILL_ROW_KEY)
  })

  it('keys a single option on its option key', () => {
    const option = createMultichainOption({ id: 'a', chainId: UniverseChainId.Mainnet, currencyId: '1-0xa' })
    expect(searchModalListOptionKey(option)).toBe(searchModalOptionKey(option))
  })
})

describe('addressSearchMatchesMultipleChains', () => {
  const deployments = [
    { chainId: UniverseChainId.Mainnet, address: SHARED_ADDRESS },
    { chainId: UniverseChainId.Base, address: SHARED_ADDRESS },
    { chainId: UniverseChainId.ArbitrumOne, address: OTHER_ADDRESS },
  ]

  it('is true when the query address is deployed on more than one chain, ignoring case', () => {
    expect(addressSearchMatchesMultipleChains({ searchQuery: SHARED_ADDRESS, deployments })).toBe(true)
    expect(addressSearchMatchesMultipleChains({ searchQuery: ` ${SHARED_ADDRESS.toLowerCase()} `, deployments })).toBe(
      true,
    )
  })

  it('is false for a single match, no match, or an empty query', () => {
    expect(addressSearchMatchesMultipleChains({ searchQuery: OTHER_ADDRESS, deployments })).toBe(false)
    expect(addressSearchMatchesMultipleChains({ searchQuery: 'WBTC', deployments })).toBe(false)
    expect(addressSearchMatchesMultipleChains({ searchQuery: undefined, deployments })).toBe(false)
    expect(addressSearchMatchesMultipleChains({ searchQuery: '', deployments })).toBe(false)
  })

  it('ignores deployments on unsupported chains', () => {
    const withUnsupported = [{ chainId: 999_999, address: SHARED_ADDRESS }, deployments[0]!]
    expect(addressSearchMatchesMultipleChains({ searchQuery: SHARED_ADDRESS, deployments: withUnsupported })).toBe(
      false,
    )
  })
})

describe('tdpChainFilterForTokenRow', () => {
  const base = { searchChainFilter: null, rowChainId: UniverseChainId.Mainnet, allowAggregate: true }

  it('prefers the explicit recents chain, then the search chain filter', () => {
    expect(
      tdpChainFilterForTokenRow({
        ...base,
        explicitTdpChain: UniverseChainId.Base,
        searchChainFilter: UniverseChainId.ArbitrumOne,
      }),
    ).toBe(UniverseChainId.Base)
    expect(tdpChainFilterForTokenRow({ ...base, searchChainFilter: UniverseChainId.ArbitrumOne })).toBe(
      UniverseChainId.ArbitrumOne,
    )
  })

  it('filters an address search to the row chain when the address is on one chain', () => {
    expect(tdpChainFilterForTokenRow({ ...base, searchQuery: SHARED_ADDRESS })).toBe(UniverseChainId.Mainnet)
  })

  it('opens the aggregate view when the searched address is on several of the row chains', () => {
    expect(
      tdpChainFilterForTokenRow({ ...base, searchQuery: SHARED_ADDRESS, addressMatchesMultipleChains: true }),
    ).toBeNull()
  })

  it('leaves a single-chain row on its own chain even when the address is on several chains', () => {
    expect(
      tdpChainFilterForTokenRow({
        ...base,
        allowAggregate: false,
        searchQuery: SHARED_ADDRESS,
        addressMatchesMultipleChains: true,
      }),
    ).toBeUndefined()
  })

  it('opens the aggregate view for symbol searches on multichain rows only', () => {
    expect(tdpChainFilterForTokenRow({ ...base, searchQuery: 'WBTC' })).toBeNull()
    expect(tdpChainFilterForTokenRow({ ...base, allowAggregate: false, searchQuery: 'WBTC' })).toBeUndefined()
  })
})
