import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { AppTFunction } from 'ui/src/i18n/types'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'

export function getProtocolVersionLabel(version: ProtocolVersion): string | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'v2'
    case ProtocolVersion.V3:
      return 'v3'
    case ProtocolVersion.V4:
      return 'v4'
    default:
      return undefined
  }
}

export function getProtocolItems(version: ProtocolVersion | undefined): ProtocolItems | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return ProtocolItems.V2
    case ProtocolVersion.V3:
      return ProtocolItems.V3
    case ProtocolVersion.V4:
      return ProtocolItems.V4
  }
  return undefined
}

export function getProtocolStatusLabel(status: PositionStatus, t: AppTFunction): string | undefined {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return t('common.withinRange')
    case PositionStatus.OUT_OF_RANGE:
      return t('common.outOfRange')
    case PositionStatus.CLOSED:
      return t('common.closed')
  }
  return undefined
}

export function poolEnabledProtocolVersion(
  protocolVersion: ProtocolVersion,
): protocolVersion is ProtocolVersion.V3 | ProtocolVersion.V4 {
  return protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
}

export function pairEnabledProtocolVersion(protocolVersion: ProtocolVersion): protocolVersion is ProtocolVersion.V2 {
  return protocolVersion === ProtocolVersion.V2
}
