import { SupportedChainId } from 'constants/chains'

import { Chain } from './__generated__/types-and-hooks'
import { fromGraphQLChain, isSupportedGQLChain } from './util'

describe('fromGraphQLChain', () => {
  it('should return the corresponding chain ID for supported chains', () => {
    expect(fromGraphQLChain(Chain.Ethereum)).toBe(SupportedChainId.MAINNET)

    for (const chain of Object.values(Chain)) {
      if (!isSupportedGQLChain(chain)) continue
      expect(fromGraphQLChain(chain)).not.toBe(undefined)
    }
  })

  it('should return undefined for unsupported chains', () => {
    expect(fromGraphQLChain(Chain.UnknownChain)).toBe(undefined)

    for (const chain of Object.values(Chain)) {
      if (isSupportedGQLChain(chain)) continue
      expect(fromGraphQLChain(chain)).toBe(undefined)
    }
  })
})
