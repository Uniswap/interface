import { sanitizeTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

describe(sanitizeTransactionRequest, () => {
  it('keeps ethers transaction request fields and strips backend metadata', () => {
    const sanitized = sanitizeTransactionRequest({
      to: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      from: '0x8992850c6A7782C4fC57Ef308e734899Be90aeB2',
      data: '0x1234',
      value: '0x00',
      chainId: 1,
      gasLimit: '395265',
      maxFeePerGas: '365377353',
      maxPriorityFeePerGas: '52543745',
      vaultExecutionMetadata: {
        action: 'deposit',
        underlyingAsset: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        destinationGasMode: 'WALLET_BALANCE',
        chainId: 1,
        vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      },
    } as Parameters<typeof sanitizeTransactionRequest>[0])

    expect(sanitized).toEqual({
      to: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      from: '0x8992850c6A7782C4fC57Ef308e734899Be90aeB2',
      data: '0x1234',
      value: '0x00',
      chainId: 1,
      gasLimit: '395265',
      maxFeePerGas: '365377353',
      maxPriorityFeePerGas: '52543745',
    })
    expect(sanitized).not.toHaveProperty('vaultExecutionMetadata')
  })

  it('returns undefined for requests without a destination or chain', () => {
    expect(sanitizeTransactionRequest({ chainId: 1 })).toBeUndefined()
    expect(sanitizeTransactionRequest({ to: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0' })).toBeUndefined()
  })
})
