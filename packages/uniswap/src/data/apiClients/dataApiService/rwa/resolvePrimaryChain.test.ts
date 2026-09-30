import { UniverseChainId } from '@universe/chains'
import { resolvePrimaryChain } from 'uniswap/src/data/apiClients/dataApiService/rwa/resolvePrimaryChain'
import type { IssuerToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { logger } from 'utilities/src/logger/logger'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base]

const issuer: IssuerToken = {
  symbol: 'AAPLon',
  name: 'Apple (Ondo)',
  logoUrl: '',
  issuer: 'ondo',
  priceUsd: 1,
  volume24hUsd: 1,
  sparkline1d: { points: [] },
  chainTokens: [
    { chainId: UniverseChainId.Mainnet, address: '0x000000000000000000000000000000000000e001' },
    { chainId: UniverseChainId.Base, address: '0x000000000000000000000000000000000000ba5e' },
  ],
}

describe('resolvePrimaryChain', () => {
  it('resolves the mainnet-first enabled deployment without a chain filter', () => {
    expect(resolvePrimaryChain({ issuer, enabledChainIds: ENABLED_CHAINS })).toEqual({
      chainId: UniverseChainId.Mainnet,
      chainToken: issuer.chainTokens[0],
    })
  })

  it('resolves the filtered deployment when a chain filter is active', () => {
    expect(resolvePrimaryChain({ issuer, enabledChainIds: ENABLED_CHAINS, chainFilter: UniverseChainId.Base })).toEqual(
      { chainId: UniverseChainId.Base, chainToken: issuer.chainTokens[1] },
    )
  })

  it('falls back to the primary pick when the issuer is not deployed on the filtered chain', () => {
    expect(
      resolvePrimaryChain({ issuer, enabledChainIds: ENABLED_CHAINS, chainFilter: UniverseChainId.ArbitrumOne }),
    ).toEqual({ chainId: UniverseChainId.Mainnet, chainToken: issuer.chainTokens[0] })
  })

  it('ignores a chain filter that is not enabled', () => {
    expect(
      resolvePrimaryChain({ issuer, enabledChainIds: [UniverseChainId.Mainnet], chainFilter: UniverseChainId.Base }),
    ).toEqual({ chainId: UniverseChainId.Mainnet, chainToken: issuer.chainTokens[0] })
  })

  it('returns undefined when no deployment is on an enabled chain', () => {
    expect(resolvePrimaryChain({ issuer, enabledChainIds: [UniverseChainId.ArbitrumOne] })).toBeUndefined()
  })

  it('returns undefined and warns when the resolved deployment address is truncated', () => {
    const truncated: IssuerToken = {
      ...issuer,
      chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0x7c8d5502b544ddaf8852fc46d1174e34876d545' }],
    }
    expect(resolvePrimaryChain({ issuer: truncated, enabledChainIds: ENABLED_CHAINS })).toBeUndefined()
    expect(logger.warn).toHaveBeenCalledOnce()
  })

  it('returns undefined when the resolved deployment address is not hex', () => {
    const nonHex: IssuerToken = {
      ...issuer,
      chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0x00000000000000000000000000000000000aap01' }],
    }
    expect(resolvePrimaryChain({ issuer: nonHex, enabledChainIds: ENABLED_CHAINS })).toBeUndefined()
  })

  it('keeps mixed-case hex addresses even when the casing is not a valid EIP-55 checksum', () => {
    const mixedCase: IssuerToken = {
      ...issuer,
      chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0x000000000000000000000000000000000000AbCd' }],
    }
    expect(resolvePrimaryChain({ issuer: mixedCase, enabledChainIds: ENABLED_CHAINS })).toEqual({
      chainId: UniverseChainId.Mainnet,
      chainToken: mixedCase.chainTokens[0],
    })
  })
})
