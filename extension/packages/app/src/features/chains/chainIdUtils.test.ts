import { PollingInterval } from 'app/src/constants/misc'
import {
  isTestnet,
  parseActiveChains,
  toSupportedChainId,
} from 'app/src/utils/chainId'
import { BigNumber } from 'ethers'
import { getPollingIntervalByBlocktime } from './chainIdUtils'
import { ChainId, TESTNET_CHAIN_IDS } from './chains'

describe(toSupportedChainId, () => {
  it('handles undefined input', () => {
    expect(toSupportedChainId(undefined)).toEqual(null)
  })

  it('handles unsupported chain ID', () => {
    expect(toSupportedChainId(BigNumber.from(6767))).toEqual(null)
  })

  it('handles supported chain ID', () => {
    expect(toSupportedChainId(ChainId.Polygon)).toEqual(137)
  })
})

describe(parseActiveChains, () => {
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

describe(isTestnet, () => {
  it('handles non-testnet', () => {
    expect(isTestnet(ChainId.Mainnet)).toEqual(false)
  })

  it('handles testnet', () => {
    expect(isTestnet(TESTNET_CHAIN_IDS[0])).toEqual(true)
  })
})

describe(getPollingIntervalByBlocktime, () => {
  it('returns the correct value for L1', () => {
    expect(getPollingIntervalByBlocktime(ChainId.Mainnet)).toEqual(
      PollingInterval.Fast
    )
  })

  it('returns the correct value for L2', () => {
    expect(getPollingIntervalByBlocktime(ChainId.Polygon)).toEqual(
      PollingInterval.LightningMcQueen
    )
  })
})
