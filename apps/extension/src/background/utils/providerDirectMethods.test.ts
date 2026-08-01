import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  executeProviderDirectMethod,
  isProviderDirectExecutableMethod,
} from 'src/background/utils/providerDirectMethods'

describe('providerDirectMethods', () => {
  describe('isProviderDirectExecutableMethod', () => {
    it('accepts known read methods', () => {
      expect(isProviderDirectExecutableMethod('eth_blockNumber')).toBe(true)
      expect(isProviderDirectExecutableMethod('eth_call')).toBe(true)
      expect(isProviderDirectExecutableMethod('eth_estimateGas')).toBe(true)
    })

    it('rejects unknown / non-read methods', () => {
      expect(isProviderDirectExecutableMethod('eth_sendTransaction')).toBe(false)
      expect(isProviderDirectExecutableMethod('personal_sign')).toBe(false)
      expect(isProviderDirectExecutableMethod('not_a_method')).toBe(false)
    })
  })

  describe('executeProviderDirectMethod', () => {
    it('maps eth_blockNumber to provider.getBlockNumber and returns its result', async () => {
      const provider = { getBlockNumber: vi.fn().mockResolvedValue(123) } as unknown as JsonRpcProvider
      const result = await executeProviderDirectMethod({ provider, method: 'eth_blockNumber', params: [] })
      expect(provider.getBlockNumber).toHaveBeenCalledTimes(1)
      expect(result).toBe(123)
    })

    it('serializes BigNumber results to hex strings', async () => {
      const provider = {
        getBalance: vi.fn().mockResolvedValue(BigNumber.from('0x1f4')),
      } as unknown as JsonRpcProvider
      const result = await executeProviderDirectMethod({ provider, method: 'eth_getBalance', params: ['0xabc'] })
      expect(provider.getBalance).toHaveBeenCalledWith('0xabc')
      expect(result).toBe('0x01f4')
    })

    it('forwards params to eth_call', async () => {
      const tx = { to: '0xabc', data: '0x1' }
      const provider = { call: vi.fn().mockResolvedValue('0xdead') } as unknown as JsonRpcProvider
      const result = await executeProviderDirectMethod({ provider, method: 'eth_call', params: [tx] })
      expect(provider.call).toHaveBeenCalledWith(tx)
      expect(result).toBe('0xdead')
    })

    it('throws for unsupported methods', async () => {
      const provider = {} as unknown as JsonRpcProvider
      await expect(
        executeProviderDirectMethod({ provider, method: 'eth_sendTransaction', params: [] }),
      ).rejects.toThrow('Unsupported provider-direct method: eth_sendTransaction')
    })

    it('propagates provider errors', async () => {
      const provider = {
        estimateGas: vi.fn().mockRejectedValue(new Error('execution reverted')),
      } as unknown as JsonRpcProvider
      await expect(executeProviderDirectMethod({ provider, method: 'eth_estimateGas', params: [{}] })).rejects.toThrow(
        'execution reverted',
      )
    })
  })
})
