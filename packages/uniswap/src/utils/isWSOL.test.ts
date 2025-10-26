import { Currency } from '@uniswap/sdk-core'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SolanaToken } from 'uniswap/src/features/tokens/SolanaToken'
import { isWSOL } from 'uniswap/src/utils/isWSOL'

const SOL = nativeOnChain(UniverseChainId.Solana)
const WSOL = WRAPPED_NATIVE_CURRENCY[UniverseChainId.Solana]!

describe('isWSOL', () => {
  it('should return true for WSOL token', () => {
    expect(isWSOL(WSOL)).toBe(true)
  })

  it('should return false for native SOL', () => {
    expect(isWSOL(SOL)).toBe(false)
  })

  it('should return false for other SPL tokens', () => {
    const otherToken = new SolanaToken(
      UniverseChainId.Solana,
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      6,
      'USDC',
      'USD Coin',
    )
    expect(isWSOL(otherToken)).toBe(false)
  })

  it('should return false for EVM tokens', () => {
    const mockETH = {
      isNative: true,
      chainId: UniverseChainId.Mainnet,
      address: '0x0000000000000000000000000000000000000000',
    } as unknown as Currency
    expect(isWSOL(mockETH)).toBe(false)
  })
})
