import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'

export enum CreatePositionRouteVariant {
  FewToken = 'fewtoken',
}

export function parseCreatePositionRouteVariant(protocolVersionParam?: string): CreatePositionRouteVariant | undefined {
  return protocolVersionParam?.toLowerCase() === CreatePositionRouteVariant.FewToken
    ? CreatePositionRouteVariant.FewToken
    : undefined
}

export function getCreatePositionProtocolLabel(
  protocolVersion: ProtocolVersion,
  routeVariant?: CreatePositionRouteVariant,
): string | undefined {
  if (protocolVersion === ProtocolVersion.Fewv2 && routeVariant === CreatePositionRouteVariant.FewToken) {
    return 'FewToken'
  }

  return getProtocolVersionLabel(protocolVersion)
}
