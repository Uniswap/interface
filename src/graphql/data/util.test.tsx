import { ChainId } from '@uniswap/sdk-core'

import { Chain } from './__generated__/types-and-hooks'
import { isSupportedGQLChain, isValidUrlChainParam, supportedChainIdFromGQLChain } from './util'

describe('fromGraphQLChain', () => {
  it('should return the corresponding chain ID for supported chains', () => {
    expect(supportedChainIdFromGQLChain(Chain.Ethereum)).toBe(ChainId.MAINNET)

    for (const chain of Object.values(Chain)) {
      if (!isSupportedGQLChain(chain)) continue
      expect(supportedChainIdFromGQLChain(chain)).not.toBe(undefined)
    }
  })

  it('should return undefined for unsupported chains', () => {
    expect(supportedChainIdFromGQLChain(Chain.UnknownChain)).toBe(undefined)

    for (const chain of Object.values(Chain)) {
      if (isSupportedGQLChain(chain)) continue
      expect(supportedChainIdFromGQLChain(chain)).toBe(undefined)
    }
  })

  it('should not crash when a new BE chain is added', () => {
    enum NewChain {
      NewChain = 'NEW_CHAIN',
    }
    const ExpandedChainList = [...Object.values(Chain), NewChain.NewChain as unknown as Chain]

    for (const chain of ExpandedChainList) {
      if (isSupportedGQLChain(chain)) continue
      expect(supportedChainIdFromGQLChain(chain)).toBe(undefined)
    }
  })
})

describe('isValidUrlChainParam', () => {
  it('should return true for valid chain name', () => {
    const validChainName = 'ethereum'
    expect(isValidUrlChainParam(validChainName)).toBe(true)
  })

  it('should return false for undefined chain name', () => {
    const undefinedChainName = undefined
    expect(isValidUrlChainParam(undefinedChainName)).toBe(false)
  })

  it('should return false for invalid chain name', () => {
    const invalidChainName = 'invalidchain'
    expect(isValidUrlChainParam(invalidChainName)).toBe(false)
  })

  it('should return false for a misconfigured chain name', () => {
    const invalidChainName = 'eThErEuM'
    expect(isValidUrlChainParam(invalidChainName)).toBe(false)
  })
})
