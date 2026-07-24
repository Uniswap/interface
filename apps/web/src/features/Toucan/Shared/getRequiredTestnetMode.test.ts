import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { getRequiredTestnetMode } from '~/features/Toucan/Shared/getRequiredTestnetMode'

describe('getRequiredTestnetMode', () => {
  const baseArgs = {
    isWalletConnected: true,
    isActionAvailable: true,
    isModeMismatch: true,
    chainId: UniverseChainId.Sepolia,
  }

  it('returns true (enable) for a testnet auction when the app is in mainnet mode', () => {
    expect(getRequiredTestnetMode({ ...baseArgs, chainId: UniverseChainId.Sepolia })).toBe(true)
  })

  it('returns false (disable) for a mainnet auction when the app is in testnet mode', () => {
    expect(getRequiredTestnetMode({ ...baseArgs, chainId: UniverseChainId.Mainnet })).toBe(false)
  })

  it('returns undefined when there is no mode mismatch', () => {
    expect(getRequiredTestnetMode({ ...baseArgs, isModeMismatch: false })).toBeUndefined()
  })

  it('returns undefined when the wallet is not connected', () => {
    expect(getRequiredTestnetMode({ ...baseArgs, isWalletConnected: false })).toBeUndefined()
  })

  it('returns undefined when the action is not available', () => {
    expect(getRequiredTestnetMode({ ...baseArgs, isActionAvailable: false })).toBeUndefined()
  })

  it('returns undefined when the chain id is unknown', () => {
    expect(getRequiredTestnetMode({ ...baseArgs, chainId: undefined })).toBeUndefined()
  })
})
