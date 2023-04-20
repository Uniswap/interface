import { ChainId, TESTNET_CHAIN_IDS } from '../features/chains/chains'
import { isTestnet, parseActiveChains } from './chainId'

describe('parseActiveChains', () => {
  it('handles empty string', () => {
    expect(parseActiveChains('')).toEqual([])
  })

  it('handles single chain ID', () => {
    expect(parseActiveChains('1')).toEqual([1])
  })

  it('handles multiple chain IDs', () => {
    expect(parseActiveChains('1,137')).toEqual([1, 137])
  })

  it('handles invalid characters', () => {
    expect(parseActiveChains('1,test')).toEqual([1])
  })
})

describe('isTestnet', () => {
  it('handles non-testnet', () => {
    expect(isTestnet(ChainId.Mainnet)).toEqual(false)
  })

  it('handles testnet', () => {
    expect(isTestnet(TESTNET_CHAIN_IDS[0])).toEqual(true)
  })
})
