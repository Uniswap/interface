import { renderHook } from '@testing-library/react'
import { SigningCapability, Wallet } from 'uniswap/src/features/accounts/store/types/Wallet'
import { useShallowWalletComparison } from 'uniswap/src/features/accounts/store/utils/wallets'

describe('Wallet Shallow Comparison', () => {
  const createTestWallet = (overrides: Partial<Wallet> = {}): Wallet => ({
    id: 'test-wallet',
    signingCapability: SigningCapability.Interactive,
    addresses: [
      {
        evm: '0x1234567890123456789012345678901234567890',
        svm: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      },
      {
        evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      },
    ],
    name: 'Test Wallet',
    icon: 'test-icon',
    ...overrides,
  })

  describe('useShallowWalletComparison', () => {
    it('should return the same reference when wallet content is equivalent', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet()
      const state1 = { wallet: wallet1 }
      const state2 = { wallet: createTestWallet() } // Same content, different reference

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      // Should return the same reference (prev.current) when content is equivalent
      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet1) // Should return the cached reference
    })

    it('should return new reference when wallet content changes', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({ id: 'wallet-1' })
      const wallet2 = createTestWallet({ id: 'wallet-2' })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet2) // Should return new reference when content differs
    })

    it('should handle undefined wallet values', () => {
      const selector = (state: { wallet?: Wallet }): Wallet | undefined => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const state1 = { wallet: undefined }
      const state2 = { wallet: undefined }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBeUndefined()
      expect(result2).toBeUndefined()
    })

    it('should handle transition from undefined to defined wallet', () => {
      const selector = (state: { wallet?: Wallet }): Wallet | undefined => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet = createTestWallet()
      const state1 = { wallet: undefined }
      const state2 = { wallet }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBeUndefined()
      expect(result2).toBe(wallet)
    })

    it('should handle transition from defined to undefined wallet', () => {
      const selector = (state: { wallet?: Wallet }): Wallet | undefined => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet = createTestWallet()
      const state1 = { wallet }
      const state2 = { wallet: undefined }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet)
      expect(result2).toBeUndefined()
    })

    it('should maintain reference stability across multiple calls with same content', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet = createTestWallet()
      const state = { wallet }

      const result1 = comparisonFn.current(state)
      const result2 = comparisonFn.current(state)
      const result3 = comparisonFn.current(state)

      expect(result1).toBe(wallet)
      expect(result2).toBe(wallet)
      expect(result3).toBe(wallet)
    })

    it('should handle wallets with different IDs', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({ id: 'wallet-1' })
      const wallet2 = createTestWallet({ id: 'wallet-2' })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet2)
    })

    it('should handle wallets with different signing capabilities', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({ signingCapability: SigningCapability.Interactive })
      const wallet2 = createTestWallet({ signingCapability: SigningCapability.Immediate })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet2)
    })

    it('should handle wallets with different addresses', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({
        addresses: [{ evm: '0x1234567890123456789012345678901234567890' }],
      })
      const wallet2 = createTestWallet({
        addresses: [{ evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' }],
      })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet2)
    })

    it('should handle wallets with different number of addresses', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({
        addresses: [{ evm: '0x1234567890123456789012345678901234567890' }],
      })
      const wallet2 = createTestWallet({
        addresses: [
          { evm: '0x1234567890123456789012345678901234567890' },
          { evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
        ],
      })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet2)
    })

    it('should handle wallets with complex nested address structures', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({
        addresses: [
          {
            evm: '0x1234567890123456789012345678901234567890',
            svm: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          },
          {
            evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
          {
            svm: 'AnotherSolanaAddress123456789012345678901234567890',
          },
        ],
      })
      const wallet2 = createTestWallet({
        addresses: [
          {
            evm: '0x1234567890123456789012345678901234567890',
            svm: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          },
          {
            evm: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
          {
            svm: 'AnotherSolanaAddress123456789012345678901234567890',
          },
        ],
      })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      // Should return the same reference since content is identical
      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet1) // Should return cached reference
    })

    it('should handle wallets with missing optional fields', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({ name: undefined, icon: undefined })
      const wallet2 = createTestWallet({ name: undefined, icon: undefined })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet1) // Should return cached reference
    })

    it('should handle wallets with mixed optional fields', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({ name: 'Test', icon: undefined })
      const wallet2 = createTestWallet({ name: 'Test', icon: undefined })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet1) // Should return cached reference
    })

    it('should handle wallets with different optional fields', () => {
      const selector = (state: { wallet: Wallet }): Wallet => state.wallet

      const { result: comparisonFn } = renderHook(() => useShallowWalletComparison(selector))

      const wallet1 = createTestWallet({ name: 'Test' })
      const wallet2 = createTestWallet({ name: undefined })

      const state1 = { wallet: wallet1 }
      const state2 = { wallet: wallet2 }

      const result1 = comparisonFn.current(state1)
      const result2 = comparisonFn.current(state2)

      expect(result1).toBe(wallet1)
      expect(result2).toBe(wallet2)
    })
  })
})
