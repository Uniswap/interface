import { TradingApi } from '@universe/api'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { generateBatchId, transformCallsToTransactionRequests } from 'wallet/src/features/batchedTransactions/utils'

describe(generateBatchId, () => {
  it('generates a batch ID with correct format', () => {
    const batchId = generateBatchId()

    // Should start with 0x
    expect(batchId.startsWith('0x')).toBe(true)

    // Should be 66 characters long (0x + 64 hex chars)
    expect(batchId.length).toBe(66)

    // Should only contain valid hex characters after 0x
    const hexPart = batchId.slice(2)
    expect(/^[0-9a-f]+$/.test(hexPart)).toBe(true)
  })

  it('generates different IDs on each call', () => {
    const id1 = generateBatchId()
    const id2 = generateBatchId()
    expect(id1).not.toBe(id2)
  })
})

describe(transformCallsToTransactionRequests, () => {
  const mockChainId = 1
  const mockAccountAddress: Address = '0x123'

  const validCall1: EthTransaction = {
    to: '0xdef',
    data: '0xabc',
    value: '0x1',
    from: '0x789', // This should be overwritten
  }

  const validCall2: EthTransaction = {
    to: '0xghi',
    data: '0x123',
    value: '0x2',
    // `from` is optional in EthTransaction, should still work
  }

  const invalidCallMissingTo: EthTransaction = {
    data: '0x456',
    value: '0x3',
  }

  const invalidCallMissingData: EthTransaction = {
    to: '0xjkl',
    value: '0x4',
  }

  it('should transform valid calls correctly', () => {
    const calls = [validCall1, validCall2]
    const expected: TradingApi.TransactionRequest[] = [
      {
        to: validCall1.to!,
        data: validCall1.data!,
        value: validCall1.value!,
        from: mockAccountAddress,
        chainId: mockChainId,
      },
      {
        to: validCall2.to!,
        data: validCall2.data!,
        value: validCall2.value!,
        from: mockAccountAddress,
        chainId: mockChainId,
      },
    ]

    const result = transformCallsToTransactionRequests({
      calls,
      chainId: mockChainId,
      accountAddress: mockAccountAddress,
    })
    expect(result).toEqual(expected)
  })

  it('should filter out invalid calls', () => {
    const calls = [validCall1, invalidCallMissingTo, validCall2, invalidCallMissingData]
    const expected: TradingApi.TransactionRequest[] = [
      {
        to: validCall1.to!,
        data: validCall1.data!,
        value: validCall1.value!,
        from: mockAccountAddress,
        chainId: mockChainId,
      },
      {
        to: validCall2.to!,
        data: validCall2.data!,
        value: validCall2.value!,
        from: mockAccountAddress,
        chainId: mockChainId,
      },
    ]

    const result = transformCallsToTransactionRequests({
      calls,
      chainId: mockChainId,
      accountAddress: mockAccountAddress,
    })
    expect(result).toEqual(expected)
  })

  it('should return an empty array if all calls are invalid', () => {
    const calls = [invalidCallMissingTo, invalidCallMissingData]
    const result = transformCallsToTransactionRequests({
      calls,
      chainId: mockChainId,
      accountAddress: mockAccountAddress,
    })
    expect(result).toEqual([])
  })

  it('should return an empty array if input calls array is empty', () => {
    const calls: EthTransaction[] = []
    const result = transformCallsToTransactionRequests({
      calls,
      chainId: mockChainId,
      accountAddress: mockAccountAddress,
    })
    expect(result).toEqual([])
  })
})
