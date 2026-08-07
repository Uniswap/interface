import {
  ChainTokenRankStats,
  MultichainToken,
  RankedMultichainToken,
  TokenRankStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { ALL_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { TimePeriod } from '~/data/util'
import {
  getChainIdsByVolume,
  pickAllowedPrimaryDeployment,
} from '~/features/Explore/state/listTokens/utils/multichainVolume'

const chainStat = (chainId: number, volume1d: number): ChainTokenRankStats =>
  new ChainTokenRankStats({ chainId, stats: new TokenRankStats({ volume1d }) })

describe('getChainIdsByVolume', () => {
  it('returns undefined for an undefined token', () => {
    expect(
      getChainIdsByVolume({ rankedToken: undefined, timePeriod: TimePeriod.DAY, allowedChainIds: ALL_CHAIN_IDS }),
    ).toBeUndefined()
  })

  it('sorts stats-bearing chains by volume descending', () => {
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:eth',
        addresses: { '1': '0xa', '10': '0xb' },
      }),
      chainStats: [chainStat(10, 5), chainStat(1, 100)],
    })
    expect(
      getChainIdsByVolume({ rankedToken: token, timePeriod: TimePeriod.DAY, allowedChainIds: ALL_CHAIN_IDS }),
    ).toEqual([1, 10])
  })

  it('appends networks that exist in addresses but have no chainStats entry (ETH-on-Ink shape)', () => {
    // The backend deliberately omits stats-less chains from chainStats while
    // still listing them in addresses. Ink is a registered chain, so when it is
    // enabled the network list must include it, matching the TDP dropdown.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:eth',
        addresses: { '1': '0xa', '10': '0xb', '57073': '0x0000000000000000000000000000000000000000' },
      }),
      chainStats: [chainStat(10, 5), chainStat(1, 100)],
    })
    expect(
      getChainIdsByVolume({ rankedToken: token, timePeriod: TimePeriod.DAY, allowedChainIds: ALL_CHAIN_IDS }),
    ).toEqual([1, 10, 57073])
  })

  it('never duplicates a chain present in both chainStats and addresses', () => {
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa' },
      }),
      chainStats: [chainStat(1, 100)],
    })
    expect(
      getChainIdsByVolume({ rankedToken: token, timePeriod: TimePeriod.DAY, allowedChainIds: ALL_CHAIN_IDS }),
    ).toEqual([1])
  })

  it('excludes a chainStats entry for a chain absent from addresses', () => {
    // A chainStats leg with no matching addresses entry must not inflate the network count
    // above what the TDP (which counts addresses) shows: the inverse of the under-count bug.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa' },
      }),
      chainStats: [chainStat(1, 100), chainStat(10, 5)],
    })
    expect(
      getChainIdsByVolume({ rankedToken: token, timePeriod: TimePeriod.DAY, allowedChainIds: ALL_CHAIN_IDS }),
    ).toEqual([1])
  })

  it('excludes an addresses entry for a chain id the web client does not recognize', () => {
    // Even with every registered chain enabled, a backend-added chain id that has not
    // shipped in the web client's chain registry must not reach chain-typed consumers.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '999999999': '0xb' },
      }),
      chainStats: [chainStat(1, 100)],
    })
    expect(
      getChainIdsByVolume({ rankedToken: token, timePeriod: TimePeriod.DAY, allowedChainIds: ALL_CHAIN_IDS }),
    ).toEqual([1])
  })

  it('collapses to one network when the only other leg is flag-disabled (single-chain link shape)', () => {
    // One enabled leg plus one flag-disabled leg. TokensTable derives the "N networks" label,
    // chainCount, and the TDP link mode from this single output, so a length of 1 means the row
    // reads as single-chain everywhere: a single-chain TDP link (no multichain query param) and
    // no breakdown affordance, even though the disabled leg has stats.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '57073': '0xb' },
      }),
      chainStats: [chainStat(1, 100), chainStat(57073, 5)],
    })
    const result = getChainIdsByVolume({
      rankedToken: token,
      timePeriod: TimePeriod.DAY,
      allowedChainIds: [UniverseChainId.Mainnet],
    })
    expect(result).toEqual([UniverseChainId.Mainnet])
    expect(result).toHaveLength(1)
  })

  it('collapses to an empty list when every leg is outside the allowed list (row is hidden upstream)', () => {
    // processMultichainTokensForDisplay drops tokens whose filtered set is empty before ranking,
    // so this shape never reaches the table. Impossible for well-formed data; defensive only.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '57073': '0xa', '999999999': '0xb' },
      }),
      chainStats: [chainStat(57073, 100)],
    })
    const result = getChainIdsByVolume({
      rankedToken: token,
      timePeriod: TimePeriod.DAY,
      allowedChainIds: [UniverseChainId.Mainnet],
    })
    expect(result).toEqual([])
  })

  it('excludes registered but flag-disabled chains, matching the TDP count (cbBTC shape)', () => {
    // cbBTC in prod: 6 addresses (Mainnet, Unichain, Monad, Base, Arbitrum, Solana) but the TDP
    // dropdown renders only the chains in the feature-flagged allowed list. With Monad and Solana
    // absent from that list the count must be 4, not 6.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:cbbtc',
        addresses: {
          '1': '0xa',
          '130': '0xb',
          '143': '0xc',
          '8453': '0xd',
          '42161': '0xe',
          '501000101': 'So11111111111111111111111111111111111111112',
        },
      }),
      chainStats: [chainStat(8453, 400), chainStat(1, 300), chainStat(42161, 200), chainStat(130, 100)],
    })
    const allowedChainIds = [
      UniverseChainId.Mainnet,
      UniverseChainId.Unichain,
      UniverseChainId.Base,
      UniverseChainId.ArbitrumOne,
    ]
    const result = getChainIdsByVolume({ rankedToken: token, timePeriod: TimePeriod.DAY, allowedChainIds })
    expect(result).toEqual([
      UniverseChainId.Base,
      UniverseChainId.Mainnet,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Unichain,
    ])
    expect(result).toHaveLength(4)
  })

  it('yields a single occurrence for duplicate chainStats entries on one chain', () => {
    // Malformed-data hardening: two stats legs for the same chain must not double the network.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '10': '0xb' },
      }),
      chainStats: [chainStat(1, 100), chainStat(1, 50), chainStat(10, 5)],
    })
    expect(
      getChainIdsByVolume({ rankedToken: token, timePeriod: TimePeriod.DAY, allowedChainIds: ALL_CHAIN_IDS }),
    ).toEqual([1, 10])
  })
})

describe('pickAllowedPrimaryDeployment', () => {
  it('resolves to the best allowed leg when the highest-volume leg is outside the allowed set', () => {
    // Stale cached response shape: stats fetched while a rollout flag was on outrank every
    // allowed leg. The row identity (chain, address, TDP link target) must still come from the
    // filtered set, so the pick falls to the highest-volume ALLOWED leg.
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '143': '0xb' },
      }),
      chainStats: [chainStat(143, 1000), chainStat(1, 100)],
    })
    expect(
      pickAllowedPrimaryDeployment({
        rankedToken: token,
        chainId: undefined,
        allowedChainIds: [UniverseChainId.Mainnet],
      }),
    ).toEqual({ chainId: 1, address: '0xa' })
  })

  it('returns undefined when no leg is allowed, so the row guard drops it', () => {
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '143': '0xb' },
      }),
      chainStats: [chainStat(143, 1000)],
    })
    expect(
      pickAllowedPrimaryDeployment({
        rankedToken: token,
        chainId: undefined,
        allowedChainIds: [UniverseChainId.Mainnet],
      }),
    ).toBeUndefined()
  })

  it('keeps the explicit chain filter precedence within the allowed set', () => {
    const token = new RankedMultichainToken({
      multichainToken: new MultichainToken({
        multichainId: 'mc:x',
        addresses: { '1': '0xa', '10': '0xb' },
      }),
      chainStats: [chainStat(10, 1000), chainStat(1, 100)],
    })
    expect(
      pickAllowedPrimaryDeployment({
        rankedToken: token,
        chainId: UniverseChainId.Mainnet,
        allowedChainIds: [UniverseChainId.Mainnet, UniverseChainId.Optimism],
      }),
    ).toEqual({ chainId: 1, address: '0xa' })
  })
})
