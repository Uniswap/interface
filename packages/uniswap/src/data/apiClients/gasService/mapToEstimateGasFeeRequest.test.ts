import { type TransactionRequest } from '@ethersproject/providers'
import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { type GasStrategy } from '@universe/api'
import { BigNumber } from 'ethers/lib/ethers'
import { mapToEstimateGasFeeRequest } from 'uniswap/src/data/apiClients/gasService/mapToEstimateGasFeeRequest'
import { describe, expect, it } from 'vitest'

const BASE_STRATEGY = {
  limitInflationFactor: 1.15,
  displayLimitInflationFactor: 1.0,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
}

describe('mapToEstimateGasFeeRequest', () => {
  it('maps basic transaction fields', () => {
    const result = mapToEstimateGasFeeRequest({
      tx: {
        chainId: 1,
        from: '0xabc',
        to: '0xdef',
        data: '0x1234',
        value: '1000',
      },
      gasStrategy: BASE_STRATEGY,
      shouldUseUrgency: false,
    })

    expect(result.chainId).toBe(1)
    expect(result.from).toBe('0xabc')
    expect(result.to).toBe('0xdef')
    expect(result.data).toBe('0x1234')
    expect(result.value).toBe('1000')
  })

  it('serializes BigNumber value and gasLimit to string', () => {
    const result = mapToEstimateGasFeeRequest({
      tx: {
        chainId: 1,
        value: BigNumber.from('999'),
        gasLimit: BigNumber.from('21000'),
      },
      gasStrategy: BASE_STRATEGY,
      shouldUseUrgency: false,
    })

    expect(result.value).toBe('999')
    expect(result.gasLimit).toBe('21000')
  })

  it('maps gas strategy fields, omitting displayLimitInflationFactor', () => {
    const strategy = {
      ...BASE_STRATEGY,
      thresholdToInflateLastBlockBaseFee: 0.9,
      baseFeeMultiplier: 1.05,
      baseFeeHistoryWindow: 100,
      minPriorityFeeRatioOfBaseFee: 0.1,
      minPriorityFeeGwei: 1.0,
      maxPriorityFeeGwei: 9.0,
    }

    const result = mapToEstimateGasFeeRequest({
      tx: { chainId: 1 },
      gasStrategy: strategy,
      shouldUseUrgency: false,
    })

    const protoStrategy = result.gasStrategies?.[0]
    expect(protoStrategy).toBeDefined()
    expect(protoStrategy?.limitInflationFactor).toBe(1.15)
    expect(protoStrategy?.priceInflationFactor).toBe(1.5)
    expect(protoStrategy?.percentileThresholdFor1559Fee).toBe(75)
    expect(protoStrategy?.baseFeeMultiplier).toBe(1.05)
    expect(protoStrategy?.baseFeeHistoryWindow).toBe(100)
    // displayLimitInflationFactor should NOT be present
    expect(protoStrategy).not.toHaveProperty('displayLimitInflationFactor')
  })

  it('converts null optional strategy fields to undefined', () => {
    const strategy = {
      ...BASE_STRATEGY,
      thresholdToInflateLastBlockBaseFee: null,
      baseFeeMultiplier: null,
    }

    const result = mapToEstimateGasFeeRequest({
      tx: { chainId: 1 },
      gasStrategy: strategy,
      shouldUseUrgency: false,
    })

    const protoStrategy = result.gasStrategies?.[0]
    expect(protoStrategy?.thresholdToInflateLastBlockBaseFee).toBeUndefined()
    expect(protoStrategy?.baseFeeMultiplier).toBeUndefined()
  })

  it('includes smartContractDelegationAddress when provided', () => {
    const result = mapToEstimateGasFeeRequest({
      tx: { chainId: 1 },
      gasStrategy: BASE_STRATEGY,
      smartContractDelegationAddress: '0xdelegate',
      shouldUseUrgency: false,
    })

    expect(result.smartContractDelegationAddress).toBe('0xdelegate')
  })

  it('omits smartContractDelegationAddress when not provided', () => {
    const result = mapToEstimateGasFeeRequest({
      tx: { chainId: 1 },
      gasStrategy: BASE_STRATEGY,
      shouldUseUrgency: false,
    })

    expect(result.smartContractDelegationAddress).toBeUndefined()
  })
})

describe('mapToEstimateGasFeeRequest — urgency mode', () => {
  const tx = {
    chainId: 1,
    from: '0xabc',
    to: '0xdef',
    data: '0x',
    value: '0',
    gasLimit: '100000',
  } as TransactionRequest

  const fallbackGasStrategy: GasStrategy = {
    limitInflationFactor: 1.15,
    displayLimitInflationFactor: 1,
    priceInflationFactor: 1.5,
    percentileThresholdFor1559Fee: 75,
    thresholdToInflateLastBlockBaseFee: 0.75,
    baseFeeMultiplier: 1,
    baseFeeHistoryWindow: 20,
    minPriorityFeeRatioOfBaseFee: 0.2,
    minPriorityFeeGwei: 2,
    maxPriorityFeeGwei: 9,
  }

  it('emits urgencies (no overrides) when flag is on and urgency.overrides absent', () => {
    const result = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy: fallbackGasStrategy,
      shouldUseUrgency: true,
      urgency: { level: Level.URGENT },
    })
    expect(result.urgencies).toEqual([{ level: Level.URGENT }])
    expect(result.gasStrategies).toBeUndefined()
  })

  it('emits urgencies with overrides when provided', () => {
    const result = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy: fallbackGasStrategy,
      shouldUseUrgency: true,
      urgency: {
        level: Level.URGENT,
        overrides: { maxFeePerGas: '12000000000', maxPriorityFeePerGas: '2000000000' },
      },
    })
    expect(result.urgencies).toEqual([
      {
        level: Level.URGENT,
        overrides: { maxFeePerGas: '12000000000', maxPriorityFeePerGas: '2000000000' },
      },
    ])
    expect(result.gasStrategies).toBeUndefined()
  })

  it('omits gasLimit on the urgency path when no override is supplied', () => {
    // Even though tx.gasLimit is set, the urgency path lets the gas service
    // run its own estimation unless the caller passes gasLimitOverride.
    const result = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy: fallbackGasStrategy,
      shouldUseUrgency: true,
      urgency: { level: Level.URGENT },
    })
    expect(result.gasLimit).toBeUndefined()
  })

  it('includes gasLimit on the urgency path when gasLimitOverride is supplied', () => {
    const result = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy: fallbackGasStrategy,
      shouldUseUrgency: true,
      urgency: { level: Level.URGENT },
      gasLimitOverride: '500000',
    })
    expect(result.gasLimit).toBe('500000')
  })

  it('ignores gasLimitOverride on the legacy gas_strategies path', () => {
    // Legacy path still forwards tx.gasLimit; the urgency-only override is
    // intentionally not plumbed through to keep the pre-urgency contract.
    const result = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy: fallbackGasStrategy,
      shouldUseUrgency: false,
      gasLimitOverride: '500000',
    })
    expect(result.gasLimit).toBe('100000')
  })

  it('falls back to gasStrategies when flag is off, even if urgency is provided', () => {
    const result = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy: fallbackGasStrategy,
      shouldUseUrgency: false,
      urgency: { level: Level.URGENT },
    })
    expect(result.gasStrategies).toHaveLength(1)
    expect(result.urgencies).toBeUndefined()
  })

  it('falls back to gasStrategies when shouldUseUrgency is true but urgency is undefined', () => {
    const result = mapToEstimateGasFeeRequest({
      tx,
      gasStrategy: fallbackGasStrategy,
      shouldUseUrgency: true,
    })
    expect(result.gasStrategies).toHaveLength(1)
    expect(result.urgencies).toBeUndefined()
  })
})
