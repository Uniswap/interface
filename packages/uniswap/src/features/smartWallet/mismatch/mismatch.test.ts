import type { DelegatedResult } from 'uniswap/src/features/smartWallet/delegation/delegationRepository'
import { createHasMismatchUtil } from 'uniswap/src/features/smartWallet/mismatch/mismatch'

describe('createHasMismatchUtil', () => {
  const mockAddress = '0xMockAddress' as string
  const mockDelegatedAddress = '0xDelegatedAddress' as string

  test.each([
    {
      name: 'returns false when atomic batching is supported and address is delegated',
      isDelegated: true,
      isAtomicSupported: true,
      expected: false,
    },
    {
      name: 'returns false when atomic batching is supported and address is not delegated',
      isDelegated: false,
      isAtomicSupported: true,
      expected: false,
    },
    {
      name: 'returns false when atomic batching is not supported and address is not delegated',
      isDelegated: false,
      isAtomicSupported: false,
      expected: false,
    },
    {
      name: 'returns true when atomic batching is not supported but address is delegated (the mismatch case)',
      isDelegated: true,
      isAtomicSupported: false,
      expected: true,
    },
  ])('$name', async ({ isDelegated, isAtomicSupported, expected }) => {
    const mockOnMismatchDetected = vi.fn()
    const hasMismatch = createHasMismatchUtil({
      delegationService: {
        getIsAddressDelegated: async (): Promise<DelegatedResult> =>
          ({
            isDelegated,
            delegatedAddress: isDelegated ? mockDelegatedAddress : null,
          }) as DelegatedResult,
        getAddressDelegations: async () => ({
          '1': {
            isDelegated,
            delegatedAddress: isDelegated ? mockDelegatedAddress : null,
          } as DelegatedResult,
        }),
      },
      getIsAtomicBatchingSupported: async (): Promise<boolean> => isAtomicSupported,
      onMismatchDetected: mockOnMismatchDetected,
    })

    const result = await hasMismatch({ address: mockAddress, chainIds: [1] })
    expect(result['1']).toBe(expected)

    if (expected) {
      expect(mockOnMismatchDetected).toHaveBeenCalledWith({
        chainId: 1,
        isDelegated,
        delegatedAddress: mockDelegatedAddress,
      })
    } else {
      expect(mockOnMismatchDetected).not.toHaveBeenCalled()
    }
  })

  describe('shouldTreatAsMismatch', () => {
    const createUtil = (input: {
      isDelegated: boolean
      shouldTreatAsMismatch: (delegatedAddress: string) => boolean
      onMismatchDetected: () => void
    }): ReturnType<typeof createHasMismatchUtil> =>
      createHasMismatchUtil({
        delegationService: {
          getIsAddressDelegated: async (): Promise<DelegatedResult> =>
            ({
              isDelegated: input.isDelegated,
              delegatedAddress: input.isDelegated ? mockDelegatedAddress : null,
            }) as DelegatedResult,
          getAddressDelegations: async () => ({
            '1': {
              isDelegated: input.isDelegated,
              delegatedAddress: input.isDelegated ? mockDelegatedAddress : null,
            } as DelegatedResult,
          }),
        },
        getIsAtomicBatchingSupported: async (): Promise<boolean> => false,
        onMismatchDetected: input.onMismatchDetected,
        shouldTreatAsMismatch: input.shouldTreatAsMismatch,
      })

    it('surfaces the mismatch when the predicate accepts the delegate', async () => {
      const shouldTreatAsMismatch = vi.fn().mockReturnValue(true)
      const hasMismatch = createUtil({ isDelegated: true, shouldTreatAsMismatch, onMismatchDetected: vi.fn() })

      const result = await hasMismatch({ address: mockAddress, chainIds: [1] })

      expect(result['1']).toBe(true)
      expect(shouldTreatAsMismatch).toHaveBeenCalledWith(mockDelegatedAddress)
    })

    it('suppresses the mismatch when the predicate rejects the delegate but still reports detection', async () => {
      const mockOnMismatchDetected = vi.fn()
      const hasMismatch = createUtil({
        isDelegated: true,
        shouldTreatAsMismatch: () => false,
        onMismatchDetected: mockOnMismatchDetected,
      })

      const result = await hasMismatch({ address: mockAddress, chainIds: [1] })

      expect(result['1']).toBe(false)
      expect(mockOnMismatchDetected).toHaveBeenCalledWith({
        chainId: 1,
        isDelegated: true,
        delegatedAddress: mockDelegatedAddress,
      })
    })

    it('does not call the predicate when there is no mismatch', async () => {
      const shouldTreatAsMismatch = vi.fn()
      const hasMismatch = createUtil({ isDelegated: false, shouldTreatAsMismatch, onMismatchDetected: vi.fn() })

      const result = await hasMismatch({ address: mockAddress, chainIds: [1] })

      expect(result['1']).toBe(false)
      expect(shouldTreatAsMismatch).not.toHaveBeenCalled()
    })

    it('fails closed when the delegate address is unresolved', async () => {
      const shouldTreatAsMismatch = vi.fn().mockReturnValue(true)
      const hasMismatch = createHasMismatchUtil({
        delegationService: {
          getIsAddressDelegated: async (): Promise<DelegatedResult> =>
            ({ isDelegated: true, delegatedAddress: null }) as unknown as DelegatedResult,
          getAddressDelegations: async () => ({
            '1': { isDelegated: true, delegatedAddress: null } as unknown as DelegatedResult,
          }),
        },
        getIsAtomicBatchingSupported: async (): Promise<boolean> => false,
        shouldTreatAsMismatch,
      })

      const result = await hasMismatch({ address: mockAddress, chainIds: [1] })

      expect(result['1']).toBe(false)
      expect(shouldTreatAsMismatch).not.toHaveBeenCalled()
    })
  })
})
