import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'

export const lpStatusConfig = {
  [PositionStatus.IN_RANGE]: {
    color: '$statusSuccess',
    i18nKey: 'common.withinRange',
  },
  [PositionStatus.OUT_OF_RANGE]: {
    color: '$statusCritical',
    i18nKey: 'common.outOfRange',
  },
  [PositionStatus.CLOSED]: {
    color: '$neutral2',
    i18nKey: 'common.closed',
  },
  [PositionStatus.UNSPECIFIED]: undefined,
} as const
