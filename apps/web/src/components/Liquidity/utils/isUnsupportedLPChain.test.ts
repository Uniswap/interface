import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { isUnsupportedLPChain } from '~/components/Liquidity/utils/isUnsupportedLPChain'

describe('isUnsupportedLPChain', () => {
  describe('SVM chains', () => {
    it('returns true for SVM chains regardless of protocol version', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Solana, ProtocolVersion.V2)).toBe(true)
      expect(isUnsupportedLPChain(UniverseChainId.Solana, ProtocolVersion.V3)).toBe(true)
      expect(isUnsupportedLPChain(UniverseChainId.Solana, ProtocolVersion.V4)).toBe(true)
    })
  })

  describe('V2 protocol', () => {
    it('returns false for supported V2 chains', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Mainnet, ProtocolVersion.V2)).toBe(false)
      expect(isUnsupportedLPChain(UniverseChainId.ArbitrumOne, ProtocolVersion.V2)).toBe(false)
      expect(isUnsupportedLPChain(UniverseChainId.Base, ProtocolVersion.V2)).toBe(false)
    })

    it('returns true for unsupported V2 chains', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Zora, ProtocolVersion.V2)).toBe(true)
      expect(isUnsupportedLPChain(UniverseChainId.Zksync, ProtocolVersion.V2)).toBe(true)
    })

    it('returns false when chainId is undefined', () => {
      expect(isUnsupportedLPChain(undefined, ProtocolVersion.V2)).toBe(false)
    })
  })

  describe('V3 protocol', () => {
    it('returns false for any EVM chain with V3 protocol', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Mainnet, ProtocolVersion.V3)).toBe(false)
      expect(isUnsupportedLPChain(UniverseChainId.Optimism, ProtocolVersion.V3)).toBe(false)
      expect(isUnsupportedLPChain(UniverseChainId.Blast, ProtocolVersion.V3)).toBe(false)
      expect(isUnsupportedLPChain(UniverseChainId.Zora, ProtocolVersion.V3)).toBe(false)
    })

    it('returns false when chainId is undefined', () => {
      expect(isUnsupportedLPChain(undefined, ProtocolVersion.V3)).toBe(false)
    })
  })

  describe('V4 protocol', () => {
    it('returns false for supported V4 chains', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Mainnet, ProtocolVersion.V4)).toBe(false)
      expect(isUnsupportedLPChain(UniverseChainId.Sepolia, ProtocolVersion.V4)).toBe(false)
    })

    it('returns true for unsupported V4 chains', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Zksync, ProtocolVersion.V4)).toBe(true)
    })

    it('returns false when chainId is undefined', () => {
      expect(isUnsupportedLPChain(undefined, ProtocolVersion.V4)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false for unknown protocol versions', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Mainnet, 999 as ProtocolVersion)).toBe(false)
    })

    it('handles UNSPECIFIED protocol version', () => {
      expect(isUnsupportedLPChain(UniverseChainId.Mainnet, ProtocolVersion.UNSPECIFIED)).toBe(false)
    })
  })
})
