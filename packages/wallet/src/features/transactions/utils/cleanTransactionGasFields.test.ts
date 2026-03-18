import { providers } from 'ethers'
import {
  cleanTransactionGasFields,
  EthereumTransactionType,
} from 'wallet/src/features/transactions/utils/cleanTransactionGasFields'

describe('cleanTransactionGasFields', () => {
  describe('EIP-1559 transactions', () => {
    it('should remove gasPrice from EIP-1559 transaction', () => {
      const request: providers.TransactionRequest = {
        type: EthereumTransactionType.EIP1559,
        to: '0x123',
        gasPrice: '100',
        maxFeePerGas: '200',
        maxPriorityFeePerGas: '50',
      }

      const cleaned = cleanTransactionGasFields(request)

      expect(cleaned.gasPrice).toBeUndefined()
      expect(cleaned.maxFeePerGas).toBe('200')
      expect(cleaned.maxPriorityFeePerGas).toBe('50')
    })

    it('should not modify EIP-1559 transaction without gasPrice', () => {
      const request: providers.TransactionRequest = {
        type: EthereumTransactionType.EIP1559,
        to: '0x123',
        maxFeePerGas: '200',
        maxPriorityFeePerGas: '50',
      }

      const cleaned = cleanTransactionGasFields(request)

      expect(cleaned).toEqual(request)
    })
  })

  describe('Legacy transactions', () => {
    it('should remove EIP-1559 gas fields from legacy transaction', () => {
      const request: providers.TransactionRequest = {
        type: EthereumTransactionType.Legacy,
        to: '0x123',
        gasPrice: '100',
        maxFeePerGas: '200',
        maxPriorityFeePerGas: '50',
      }

      const cleaned = cleanTransactionGasFields(request)

      expect(cleaned.gasPrice).toBe('100')
      expect(cleaned.maxFeePerGas).toBeUndefined()
      expect(cleaned.maxPriorityFeePerGas).toBeUndefined()
    })

    it('should not modify legacy transaction without EIP-1559 fields', () => {
      const request: providers.TransactionRequest = {
        type: EthereumTransactionType.Legacy,
        to: '0x123',
        gasPrice: '100',
      }

      const cleaned = cleanTransactionGasFields(request)

      expect(cleaned).toEqual(request)
    })

    it('should not modify transaction with undefined type', () => {
      const request: providers.TransactionRequest = {
        to: '0x123',
        gasPrice: '100',
        maxFeePerGas: '200',
      }

      const cleaned = cleanTransactionGasFields(request)

      // When type is undefined, we don't modify the transaction
      // This allows ethers to properly populate it based on network capabilities
      expect(cleaned.gasPrice).toBe('100')
      expect(cleaned.maxFeePerGas).toBe('200')
      expect(cleaned).toEqual(request)
    })
  })

  describe('EIP-2930 transactions', () => {
    it('should remove EIP-1559 gas fields from EIP-2930 transaction', () => {
      const request: providers.TransactionRequest = {
        type: EthereumTransactionType.AccessList,
        to: '0x123',
        gasPrice: '100',
        maxFeePerGas: '200',
      }

      const cleaned = cleanTransactionGasFields(request)

      expect(cleaned.gasPrice).toBe('100')
      expect(cleaned.maxFeePerGas).toBeUndefined()
    })
  })
})
