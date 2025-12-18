import type { TransactionRequest } from '@ethersproject/abstract-provider'
import { hexlifyTransaction } from 'utilities/src/transactions/hexlifyTransaction'

describe('hexlifyTransaction', () => {
  it('should hexlify all fields correctly', () => {
    const transferTxRequest: TransactionRequest = {
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
    const transferTxRequest: TransactionRequest = {
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
    const transferTxRequest: TransactionRequest = {}

    const result = hexlifyTransaction(transferTxRequest)

    expect(result).toEqual({})
  })

  it('handle zero values', () => {
    const transferTxRequest: TransactionRequest = {
      nonce: 0,
      value: 0,
      gasLimit: 0,
      maxPriorityFeePerGas: 0,
      maxFeePerGas: 0,
    }

    const result = hexlifyTransaction(transferTxRequest)

    expect(result).toEqual({
      ...transferTxRequest,
      nonce: '0x00',
      value: '0x00',
      gasLimit: '0x00',
      maxPriorityFeePerGas: '0x00',
      maxFeePerGas: '0x00',
    })
  })
})
