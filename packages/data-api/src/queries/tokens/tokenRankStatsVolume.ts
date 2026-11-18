import { type TokenRankStats, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'

export type VolumeOrderBy =
  | TokensOrderBy.VOLUME_1H
  | TokensOrderBy.VOLUME_1D
  | TokensOrderBy.VOLUME_7D
  | TokensOrderBy.VOLUME_30D
  | TokensOrderBy.VOLUME_1Y
  | TokensOrderBy.VOLUME_ALL

const VOLUME_ORDER_BY_STAT_KEY = {
  [TokensOrderBy.VOLUME_1H]: 'volume1h',
  [TokensOrderBy.VOLUME_1D]: 'volume1d',
  [TokensOrderBy.VOLUME_7D]: 'volume7d',
  [TokensOrderBy.VOLUME_30D]: 'volume30d',
  [TokensOrderBy.VOLUME_1Y]: 'volume1y',
  [TokensOrderBy.VOLUME_ALL]: 'volumeAll',
} as const satisfies Record<VolumeOrderBy, keyof TokenRankStats>

/** The volume window a ranked list was sorted by, so rows display the figure they were ranked on. */
export function getVolumeForOrderBy(stats: TokenRankStats | undefined, orderBy: VolumeOrderBy): number | undefined {
  return stats?.[VOLUME_ORDER_BY_STAT_KEY[orderBy]]
}
