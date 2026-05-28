import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { buildGasServiceUrgencyOverride } from 'uniswap/src/features/gas/components/NetworkCostEditor/buildGasServiceUrgencyOverride'

describe('buildGasServiceUrgencyOverride', () => {
  it('returns both fields undefined when overrides are undefined', () => {
    expect(buildGasServiceUrgencyOverride({ gasOverrides: undefined })).toEqual({
      urgency: undefined,
      gasLimitOverride: undefined,
    })
  })

  it('translates GWEI overrides into a URGENT-level proto urgency in wei', () => {
    const result = buildGasServiceUrgencyOverride({
      gasOverrides: {
        maxBaseFeeGwei: '10',
        priorityFeeGwei: '2',
        gasLimit: '210000',
      },
    })
    expect(result).toEqual({
      urgency: {
        level: Level.URGENT,
        overrides: {
          // 12 GWEI = 12_000_000_000 wei
          maxFeePerGas: '12000000000',
          // 2 GWEI = 2_000_000_000 wei
          maxPriorityFeePerGas: '2000000000',
        },
      },
      gasLimitOverride: '210000',
    })
  })

  it('honors a caller-supplied urgency level', () => {
    const result = buildGasServiceUrgencyOverride({
      gasOverrides: { maxBaseFeeGwei: '1', priorityFeeGwei: '1', gasLimit: '21000' },
      level: Level.NORMAL,
    })
    expect(result.urgency?.level).toBe(Level.NORMAL)
  })

  it('returns priority-only override when only priorityFeeGwei is set', () => {
    const result = buildGasServiceUrgencyOverride({
      gasOverrides: { priorityFeeGwei: '5' },
      recommended: { recommendedMaxBaseFeeGwei: '3', recommendedPriorityFeeGwei: '2' },
    })
    // maxFeePerGas = 3 (recommended base) + 5 (override priority) = 8 GWEI = 8_000_000_000 wei
    expect(result.urgency?.overrides?.maxFeePerGas).toBe('8000000000')
    // maxPriorityFeePerGas = 5 GWEI = 5_000_000_000 wei
    expect(result.urgency?.overrides?.maxPriorityFeePerGas).toBe('5000000000')
    expect(result.gasLimitOverride).toBeUndefined()
  })

  it('returns maxBase-only override when only maxBaseFeeGwei is set', () => {
    const result = buildGasServiceUrgencyOverride({
      gasOverrides: { maxBaseFeeGwei: '10' },
      recommended: { recommendedMaxBaseFeeGwei: '3', recommendedPriorityFeeGwei: '2' },
    })
    // maxFeePerGas = 10 (override base) + 2 (recommended priority) = 12 GWEI = 12_000_000_000 wei
    expect(result.urgency?.overrides?.maxFeePerGas).toBe('12000000000')
    // maxPriorityFeePerGas is not set — only maxBase was overridden
    expect(result.urgency?.overrides?.maxPriorityFeePerGas).toBeUndefined()
  })

  it('returns gasLimit-only override when only gasLimit is set', () => {
    const result = buildGasServiceUrgencyOverride({ gasOverrides: { gasLimit: '250000' } })
    expect(result.urgency).toBeUndefined()
    expect(result.gasLimitOverride).toBe('250000')
  })

  it('returns empty urgency when recommended unavailable and only maxBase is set', () => {
    const result = buildGasServiceUrgencyOverride({ gasOverrides: { maxBaseFeeGwei: '10' } })
    // Without recommended priority, maxFeePerGas cannot be computed — urgency is omitted.
    expect(result.urgency).toBeUndefined()
    expect(result.gasLimitOverride).toBeUndefined()
  })

  it('omits maxFeePerGas (rather than setting undefined) when gweiToWei rejects the input', () => {
    // Malformed recommended GWEI → gweiToWei returns undefined. The override key
    // should be absent from `overrides`, not assigned `undefined`.
    const result = buildGasServiceUrgencyOverride({
      gasOverrides: { priorityFeeGwei: '5' },
      recommended: { recommendedMaxBaseFeeGwei: 'not-a-number', recommendedPriorityFeeGwei: '2' },
    })
    // priority is still a valid GWEI, so its key is present.
    expect(result.urgency?.overrides).not.toHaveProperty('maxFeePerGas')
    expect(result.urgency?.overrides?.maxPriorityFeePerGas).toBe('5000000000')
  })
})
