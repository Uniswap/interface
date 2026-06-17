import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { AppTFunction } from 'ui/src/i18n/types'
import { describe, expect, it } from 'vitest'
import {
  getProtocolStatusLabel,
  getProtocolVersionFromLabel,
  getProtocolVersionLabel,
  protocolsToProtocolVersion,
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

describe('protocolsToProtocolVersion', () => {
  it('maps the numeric Protocols enum to a ProtocolVersion', () => {
    expect(protocolsToProtocolVersion(Protocols.V2)).toBe(ProtocolVersion.V2)
    expect(protocolsToProtocolVersion(Protocols.V3)).toBe(ProtocolVersion.V3)
    expect(protocolsToProtocolVersion(Protocols.V4)).toBe(ProtocolVersion.V4)
  })

  // Regression: ListPools data is persisted to storage and rehydrated as plain JSON, where the
  // protobuf enum is its name ("V2"/"V3"/"V4") instead of the numeric value. These must still map
  // to a version, otherwise the pool table's Protocol column renders empty after a refresh.
  it('maps the proto JSON enum name (persisted form) to a ProtocolVersion', () => {
    expect(protocolsToProtocolVersion('V2' as unknown as Protocols)).toBe(ProtocolVersion.V2)
    expect(protocolsToProtocolVersion('V3' as unknown as Protocols)).toBe(ProtocolVersion.V3)
    expect(protocolsToProtocolVersion('V4' as unknown as Protocols)).toBe(ProtocolVersion.V4)
  })

  it('returns UNSPECIFIED for undefined or unknown values', () => {
    expect(protocolsToProtocolVersion(undefined)).toBe(ProtocolVersion.UNSPECIFIED)
    expect(protocolsToProtocolVersion('V5' as unknown as Protocols)).toBe(ProtocolVersion.UNSPECIFIED)
    expect(protocolsToProtocolVersion(999 as Protocols)).toBe(ProtocolVersion.UNSPECIFIED)
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
