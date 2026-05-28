import { ChainId, Protocols, TransactionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import {
  IncreasePositionRequest,
  IncreasePositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { LPToken } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { V2LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { createIncreasePositionAsyncStep } from 'uniswap/src/features/transactions/liquidity/steps/increasePosition'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

const mockTxResponse = new TransactionRequest({
  to: '0x456',
  from: '0x123',
  data: '0x000',
  value: '0x00',
  chainId: 1,
})

vi.mock('uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient', () => ({
  V2LiquidityServiceClient: {
    increasePosition: vi.fn(),
  },
}))

describe('createIncreasePositionAsyncStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return undefined txRequest when increasePositionRequestArgs is undefined', async () => {
    const step = createIncreasePositionAsyncStep(undefined)
    expect(step.type).toBe(TransactionStepType.IncreasePositionTransactionAsync)
    const result = await step.getTxRequest('0xsignature')
    expect(result.txRequest).toBeUndefined()
  })

  it('should call V2LiquidityServiceClient.increasePosition when given a V2 IncreasePositionRequest', async () => {
    const mockRequest = new IncreasePositionRequest({
      walletAddress: '0x18d058a7E0486E632f7DfC473BC76D72CD201cAd',
      chainId: ChainId.MAINNET,
      protocol: Protocols.V3,
      token0Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      token1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      nftTokenId: '1000000',
      independentToken: new LPToken({ tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: '1000000' }),
    })

    vi.mocked(V2LiquidityServiceClient.increasePosition).mockResolvedValue(
      new IncreasePositionResponse({
        increase: mockTxResponse,
      }),
    )

    const step = createIncreasePositionAsyncStep(mockRequest)
    const result = await step.getTxRequest('0xsignature')

    expect(V2LiquidityServiceClient.increasePosition).toHaveBeenCalledOnce()
    const calledWith = vi.mocked(V2LiquidityServiceClient.increasePosition).mock.calls[0]![0]
    expect(calledWith).toBeInstanceOf(IncreasePositionRequest)
    expect(calledWith.signature).toBe('0xsignature')
    expect(calledWith.simulateTransaction).toBe(true)
    expect(calledWith.walletAddress).toBe('0x18d058a7E0486E632f7DfC473BC76D72CD201cAd')

    expect(result.txRequest).toEqual({
      to: '0x456',
      from: '0x123',
      data: '0x000',
      value: '0x00',
      chainId: 1,
    })
  })

  it('should throw and log error when V2 increasePosition call fails', async () => {
    const mockRequest = new IncreasePositionRequest({
      walletAddress: '0x18d058a7E0486E632f7DfC473BC76D72CD201cAd',
      chainId: ChainId.MAINNET,
      protocol: Protocols.V3,
      token0Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      token1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      nftTokenId: '1000000',
      independentToken: new LPToken({ tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: '1000000' }),
    })

    const error = new Error('RPC error')
    vi.mocked(V2LiquidityServiceClient.increasePosition).mockRejectedValue(error)

    const step = createIncreasePositionAsyncStep(mockRequest)
    await expect(step.getTxRequest('0xsignature')).rejects.toThrow('RPC error')
  })
})
