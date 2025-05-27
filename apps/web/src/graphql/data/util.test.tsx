import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChain } from 'uniswap/src/features/chains/utils'

describe('fromGraphQLChain', () => {
  it('should return the corresponding chain ID for supported chains', () => {
    expect(supportedChainIdFromGQLChain(Chain.Ethereum)).toBe(UniverseChainId.Mainnet)

    for (const chain of Object.values(Chain)) {
      if (!isBackendSupportedChain(chain)) {
        continue
      }
      expect(supportedChainIdFromGQLChain(chain)).not.toBe(undefined)
    }
  })

  it('should return undefined for unsupported chains', () => {
    expect(supportedChainIdFromGQLChain(Chain.UnknownChain)).toBe(undefined)

    Object.values(Chain)
      .filter((c) => !isBackendSupportedChain(c))
      .forEach((chain) => {
        expect(supportedChainIdFromGQLChain(chain)).toBe(undefined)
      })
  })

  it('should not crash when a new BE chain is added', () => {
    enum NewChain {
      NewChain = 'NEW_CHAIN',
    }
    const ExpandedChainList = [...Object.values(Chain), NewChain.NewChain as unknown as Chain]

    for (const chain of ExpandedChainList) {
      if (isBackendSupportedChain(chain)) {
        continue
      }
      expect(supportedChainIdFromGQLChain(chain)).toBe(undefined)
    }
  })
})
