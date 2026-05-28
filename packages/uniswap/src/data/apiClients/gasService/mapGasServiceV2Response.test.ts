import { FeeType } from '@universe/api'
import { mapGasServiceV2Response } from 'uniswap/src/data/apiClients/gasService/mapGasServiceV2Response'
import { describe, expect, it } from 'vitest'

const CLIENT_STRATEGY = {
  limitInflationFactor: 1.15,
  displayLimitInflationFactor: 1.0,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
}

// Using `as any` because constructing a full proto EstimateGasFeeResponse instance
// requires the proto library. The plain objects match the shape the mapping reads.
const makeResponse = (estimate: Record<string, unknown>): any => ({ gasEstimates: [estimate] }) as any

describe('mapGasServiceV2Response', () => {
  it('maps an EIP-1559 response', () => {
    const result = mapGasServiceV2Response({
      response: makeResponse({
        type: 'eip1559',
        gasLimit: '21000',
        gasFee: '42000000000000',
        maxFeePerGas: '2000000000',
        maxPriorityFeePerGas: '1000000000',
        strategy: {
          limitInflationFactor: 1.15,
          priceInflationFactor: 1.5,
          percentileThresholdFor1559Fee: 75,
        },
      }),
      gasStrategy: CLIENT_STRATEGY,
    })

    expect(result.value).toBe('42000000000000')
    expect(result.displayValue).toBeDefined()
    expect(result.gasEstimate?.type).toBe(FeeType.EIP1559)
    expect(result.gasEstimate?.gasLimit).toBe('21000')
    expect(result.params && 'maxFeePerGas' in result.params && result.params.maxFeePerGas).toBe('2000000000')
    expect(result.gasEstimate?.strategy.displayLimitInflationFactor).toBe(1.0)
  })

  it('maps a legacy response', () => {
    const result = mapGasServiceV2Response({
      response: makeResponse({
        type: 'legacy',
        gasLimit: '21000',
        gasFee: '42000000000000',
        gasPrice: '2000000000',
        strategy: {
          limitInflationFactor: 1.15,
          priceInflationFactor: 1.5,
          percentileThresholdFor1559Fee: 75,
        },
      }),
      gasStrategy: CLIENT_STRATEGY,
    })

    expect(result.gasEstimate?.type).toBe(FeeType.LEGACY)
    expect(result.params && 'gasPrice' in result.params && result.params.gasPrice).toBe('2000000000')
    expect(result.gasEstimate?.strategy.displayLimitInflationFactor).toBe(1.0)
  })

  it('throws when gasEstimates is empty', () => {
    expect(() =>
      mapGasServiceV2Response({
        response: { gasEstimates: [] } as any,
        gasStrategy: CLIENT_STRATEGY,
      }),
    ).toThrow('Gas service v2: no gas estimate returned')
  })

  it('throws when gasLimit is missing', () => {
    expect(() =>
      mapGasServiceV2Response({
        response: makeResponse({ type: 'eip1559', gasFee: '100' }),
        gasStrategy: CLIENT_STRATEGY,
      }),
    ).toThrow('Gas service v2: missing gasLimit or gasFee in estimate')
  })

  it('throws when EIP-1559 fee params are missing', () => {
    expect(() =>
      mapGasServiceV2Response({
        response: makeResponse({ type: 'eip1559', gasLimit: '21000', gasFee: '100' }),
        gasStrategy: CLIENT_STRATEGY,
      }),
    ).toThrow('Gas service v2: missing fee params in EIP-1559 estimate')
  })

  it('throws when legacy gasPrice is missing', () => {
    expect(() =>
      mapGasServiceV2Response({
        response: makeResponse({ type: 'legacy', gasLimit: '21000', gasFee: '100' }),
        gasStrategy: CLIENT_STRATEGY,
      }),
    ).toThrow('Gas service v2: missing gasPrice in legacy estimate')
  })
})
