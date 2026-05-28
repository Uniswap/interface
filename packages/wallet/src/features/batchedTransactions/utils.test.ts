import { TradingApi } from '@universe/api'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import {
  generateBatchId,
  transformCallsToTransactionRequests,
  transformTradingApiUserOpToRpcUserOp,
} from 'wallet/src/features/batchedTransactions/utils'

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

describe(transformTradingApiUserOpToRpcUserOp, () => {
  const validUserOp: TradingApi.UserOperation = {
    sender: '0xabc',
    nonce: '0x01',
    callData: '0xdeadbeef',
    callGasLimit: '0x5208',
    verificationGasLimit: '0x9c40',
    preVerificationGas: '0x4e20',
    maxFeePerGas: '0x59682f00',
    maxPriorityFeePerGas: '0x3b9aca00',
    signature: '0x00',
  }

  it('maps every required and optional field, including eip7702Auth', () => {
    const userOp: TradingApi.UserOperation = {
      ...validUserOp,
      factory: '0xfac',
      factoryData: '0xfaca',
      paymaster: '0xfa11',
      paymasterVerificationGasLimit: '0x2710',
      paymasterPostOpGasLimit: '0x1388',
      paymasterData: '0xab',
      eip7702Auth: {
        address: '0xde1',
        chainId: '0x1',
        nonce: '0x2',
        r: '0xab',
        s: '0xcd',
        yParity: '0x0',
      },
    }

    expect(transformTradingApiUserOpToRpcUserOp(userOp)).toEqual(userOp)
  })

  it('leaves optional fields and eip7702Auth as undefined when absent', () => {
    const result = transformTradingApiUserOpToRpcUserOp(validUserOp)

    expect(result.factory).toBeUndefined()
    expect(result.factoryData).toBeUndefined()
    expect(result.paymaster).toBeUndefined()
    expect(result.paymasterVerificationGasLimit).toBeUndefined()
    expect(result.paymasterPostOpGasLimit).toBeUndefined()
    expect(result.paymasterData).toBeUndefined()
    expect(result.eip7702Auth).toBeUndefined()
  })

  it('throws when any field is not a 0x-prefixed hex string', () => {
    // Bare "10" is ambiguous between decimal 10 and 0x10 (= 16) — reject rather than silently corrupt.
    const userOp: TradingApi.UserOperation = { ...validUserOp, nonce: '10' }

    expect(() => transformTradingApiUserOpToRpcUserOp(userOp)).toThrow(/Invalid hex string: "10"/)
  })

  it('throws when a nested eip7702Auth field is malformed', () => {
    const userOp: TradingApi.UserOperation = {
      ...validUserOp,
      eip7702Auth: {
        address: '0xde1',
        chainId: 'not-hex',
        nonce: '0x2',
        r: '0xab',
        s: '0xcd',
        yParity: '0x0',
      },
    }

    expect(() => transformTradingApiUserOpToRpcUserOp(userOp)).toThrow(/Invalid hex string: "not-hex"/)
  })
})
