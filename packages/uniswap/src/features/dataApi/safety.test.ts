import {
  ProtectionResult as RestProtectionResult,
  SafetyLevel as RestSafetyLevel,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'
import {
  fromDataApiProtectionResult,
  fromDataApiSafetyLevel,
  fromTradingApiSafetyLevel,
  fromV2Verdict,
  ProtectionResult,
  SafetyLevel,
} from 'uniswap/src/features/dataApi/safety'
import { logger } from 'utilities/src/logger/logger'

describe('fromDataApiSafetyLevel', () => {
  it.each([
    [RestSafetyLevel.BLOCKED, SafetyLevel.Blocked],
    [RestSafetyLevel.MEDIUM_WARNING, SafetyLevel.MediumWarning],
    [RestSafetyLevel.STRONG_WARNING, SafetyLevel.StrongWarning],
    [RestSafetyLevel.VERIFIED, SafetyLevel.Verified],
  ])('maps %s to %s', (input, expected) => {
    expect(fromDataApiSafetyLevel(input)).toBe(expected)
  })

  it('maps UNKNOWN and undefined to undefined', () => {
    expect(fromDataApiSafetyLevel(RestSafetyLevel.UNKNOWN)).toBeUndefined()
    expect(fromDataApiSafetyLevel(undefined)).toBeUndefined()
  })
})

describe('fromDataApiProtectionResult', () => {
  it.each([
    [RestProtectionResult.BENIGN, ProtectionResult.Benign],
    [RestProtectionResult.MALICIOUS, ProtectionResult.Malicious],
    [RestProtectionResult.SPAM, ProtectionResult.Spam],
    [RestProtectionResult.WARNING, ProtectionResult.Warning],
    [RestProtectionResult.UNKNOWN, ProtectionResult.Unknown],
    [undefined, ProtectionResult.Unknown],
  ])('maps %s to %s', (input, expected) => {
    expect(fromDataApiProtectionResult(input)).toBe(expected)
  })
})

describe('fromTradingApiSafetyLevel', () => {
  it.each([
    [TradingApi.SafetyLevel.BLOCKED, SafetyLevel.Blocked],
    [TradingApi.SafetyLevel.MEDIUM_WARNING, SafetyLevel.MediumWarning],
    [TradingApi.SafetyLevel.STRONG_WARNING, SafetyLevel.StrongWarning],
    [TradingApi.SafetyLevel.VERIFIED, SafetyLevel.Verified],
  ])('maps %s to %s', (input, expected) => {
    expect(fromTradingApiSafetyLevel(input)).toBe(expected)
  })

  it('maps undefined to undefined', () => {
    expect(fromTradingApiSafetyLevel(undefined)).toBeUndefined()
  })
})

describe('fromV2Verdict', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
  })

  it.each([
    ['Benign', ProtectionResult.Benign],
    ['Malicious', ProtectionResult.Malicious],
    ['Spam', ProtectionResult.Spam],
    ['Warning', ProtectionResult.Warning],
    ['SomethingNew', ProtectionResult.Unknown],
    [undefined, ProtectionResult.Unknown],
  ])('maps %s to %s', (input, expected) => {
    expect(fromV2Verdict(input)).toBe(expected)
  })

  it('warns on a non-empty unrecognized verdict but not on undefined', () => {
    fromV2Verdict('SomethingNew')
    expect(logger.warn).toHaveBeenCalledTimes(1)
    fromV2Verdict(undefined)
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })
})
