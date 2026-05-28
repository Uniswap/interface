import { providers } from 'ethers'
import { hexlifyTransaction } from 'wallet/src/utils/transaction'

describe('hexlifyTransaction', () => {
  it('should hexlify all fields correctly', () => {
    const transferTxRequest: providers.TransactionRequest = {
      nonce: 1,
      value: 1000,
      gasLimit: 21000,
      gasPrice: 20000000000,
    }

    const result = hexlifyTransaction(transferTxRequest)

    expect(result).toEqual({
      ...transferTxRequest,
      nonce: '0x01',
      value: '0x03e8',
      gasLimit: '0x5208',
      gasPrice: '0x04a817c800',
    })
  })

  it('should handle EIP-1559 transaction fields', () => {
    const transferTxRequest: providers.TransactionRequest = {
      nonce: 1,
      value: 1000,
      gasLimit: 21000,
      maxPriorityFeePerGas: 1000000000,
      maxFeePerGas: 2000000000,
    }

    const result = hexlifyTransaction(transferTxRequest)

    expect(result).toEqual({
      ...transferTxRequest,
      nonce: '0x01',
      value: '0x03e8',
      gasLimit: '0x5208',
      maxPriorityFeePerGas: '0x3b9aca00',
      maxFeePerGas: '0x77359400',
    })
  })

  it('should return undefined for undefined fields', () => {
    const transferTxRequest: providers.TransactionRequest = {}

    const result = hexlifyTransaction(transferTxRequest)

    expect(result).toEqual({})
  })
})
