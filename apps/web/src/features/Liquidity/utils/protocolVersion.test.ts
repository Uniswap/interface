import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { AppTFunction } from 'ui/src/i18n/types'
import { describe, expect, it } from 'vitest'
import {
  getProtocolStatusLabel,
  getProtocolVersionFromLabel,
  getProtocolVersionLabel,
} from '~/features/Liquidity/utils/protocolVersion'

describe('getProtocolVersionLabel', () => {
  it('returns correct label for V2', () => {
    expect(getProtocolVersionLabel(ProtocolVersion.V2)).toBe('v2')
  })
  it('returns correct label for V3', () => {
    expect(getProtocolVersionLabel(ProtocolVersion.V3)).toBe('v3')
  })
  it('returns correct label for V4', () => {
    expect(getProtocolVersionLabel(ProtocolVersion.V4)).toBe('v4')
  })
  it('returns undefined for unknown version', () => {
    expect(getProtocolVersionLabel(999 as ProtocolVersion)).toBeUndefined()
  })
})

describe('getProtocolVersionFromLabel', () => {
  it('returns correct version for v2', () => {
    expect(getProtocolVersionFromLabel('v2')).toBe(ProtocolVersion.V2)
  })
  it('returns correct version for v3', () => {
    expect(getProtocolVersionFromLabel('v3')).toBe(ProtocolVersion.V3)
  })
  it('returns correct version for v4', () => {
    expect(getProtocolVersionFromLabel('v4')).toBe(ProtocolVersion.V4)
  })
  it('returns undefined for unknown, null, or undefined labels', () => {
    expect(getProtocolVersionFromLabel('v5')).toBeUndefined()
    expect(getProtocolVersionFromLabel(null)).toBeUndefined()
    expect(getProtocolVersionFromLabel(undefined)).toBeUndefined()
  })
})

describe('getProtocolStatusLabel', () => {
  const t = ((key: string) => `translated:${key}`) as AppTFunction

  it('returns correct label for IN_RANGE', () => {
    expect(getProtocolStatusLabel(PositionStatus.IN_RANGE, t)).toBe('translated:common.withinRange')
  })
  it('returns correct label for OUT_OF_RANGE', () => {
    expect(getProtocolStatusLabel(PositionStatus.OUT_OF_RANGE, t)).toBe('translated:common.outOfRange')
  })
  it('returns correct label for CLOSED', () => {
    expect(getProtocolStatusLabel(PositionStatus.CLOSED, t)).toBe('translated:common.closed')
  })
  it('returns undefined for unknown status', () => {
    expect(getProtocolStatusLabel(999 as PositionStatus, t)).toBeUndefined()
  })
})
