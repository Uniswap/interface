import { BigNumber } from '@ethersproject/bignumber'
import { providers } from 'ethers/lib/ethers'
import { receiptFromEthersReceipt, receiptFromViemReceipt } from 'uniswap/src/features/transactions/utils/receipt'
import { TransactionReceipt as ViemTransactionReceipt } from 'viem'

describe('receipt conversion helpers', () => {
  test('receiptFromEthersReceipt converts ethers receipt correctly', () => {
    const ethersReceipt: providers.TransactionReceipt = {
      to: '0x0',
      from: '0x0',
      contractAddress: '',
      transactionIndex: 1,
      gasUsed: BigNumber.from(21_000),
      logsBloom: '',
      blockHash: '0xabc',
      transactionHash: '0x123',
      logs: [],
      blockNumber: 100,
      cumulativeGasUsed: BigNumber.from(21_000),
      effectiveGasPrice: BigNumber.from(1_000_000_000),
      byzantium: true,
      type: 2,
      status: 1,
      confirmations: 5,
    }

    const adapted = receiptFromEthersReceipt(ethersReceipt)!

    expect(adapted.blockHash).toBe('0xabc')
    expect(adapted.blockNumber).toBe(100)
    expect(adapted.transactionIndex).toBe(1)
    expect(adapted.gasUsed).toBe(21_000)
    expect(adapted.effectiveGasPrice).toBe(1_000_000_000)
    expect(typeof adapted.confirmedTime).toBe('number')
  })

  test('receiptFromViemReceipt converts viem receipt correctly', () => {
    const viemReceipt: ViemTransactionReceipt = {
      blockHash: '0xdef',
      blockNumber: BigInt(200),
      contractAddress: null,
      cumulativeGasUsed: BigInt(30_000),
      effectiveGasPrice: BigInt(2_000_000_000),
      from: '0x0',
      gasUsed: BigInt(30_000),
      logs: [],
      logsBloom: '0x0',
      status: 'success',
      to: '0x0',
      transactionHash: '0x456',
      transactionIndex: 2,
      type: 'eip1559',
    }

    const adapted = receiptFromViemReceipt(viemReceipt)!

    expect(adapted.blockHash).toBe('0xdef')
    expect(adapted.blockNumber).toBe(200)
    expect(adapted.transactionIndex).toBe(2)
    expect(adapted.gasUsed).toBe(30_000)
    expect(adapted.effectiveGasPrice).toBe(2_000_000_000)
    expect(typeof adapted.confirmedTime).toBe('number')
  })
})
