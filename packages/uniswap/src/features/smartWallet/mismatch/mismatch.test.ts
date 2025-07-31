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
    const mockOnMismatchDetected = jest.fn()
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
})
