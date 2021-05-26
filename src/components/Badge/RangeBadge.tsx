import React from 'react'

import Badge, { BadgeVariant } from 'components/Badge'
import styled from 'styled-components/macro'

import { MouseoverTooltip } from '../../components/Tooltip'
import { Trans, t } from '@lingui/macro'
import { AlertCircle } from 'react-feather'

const BadgeWrapper = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: flex-end;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

const ActiveDot = styled.span`
  background-color: ${({ theme }) => theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-right: 4px;
`

export const DarkBadge = styled.div`
  width: fit-content;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg0};
  padding: 4px 6px;
`

export default function RangeBadge({
  removed,
  inRange,
}: {
  removed: boolean | undefined
  inRange: boolean | undefined
}) {
  return (
    <BadgeWrapper>
      {removed ? (
        <MouseoverTooltip
          text={t({
            id: 'pools.labels.inactiveTooltip',
            message: 'Your position has 0 liquidity, and is not earning fees.',
          })}
        >
          <Badge variant={BadgeVariant.DEFAULT}>
            <AlertCircle width={14} height={14} />
            &nbsp;
            <BadgeText>
              <Trans id="pools.labels.inactive">Inactive</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      ) : inRange ? (
        <MouseoverTooltip
          text={t({
            id: 'pools.labels.inRangeTooltip',
            message: 'The price of this pool is within your selected range. Your position is currently earning fees.',
          })}
        >
          <Badge variant={BadgeVariant.DEFAULT}>
            <ActiveDot /> &nbsp;
            <BadgeText>
              <Trans id="pools.labels.inRange">In range</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      ) : (
        <MouseoverTooltip
          text={t({
            id: 'pools.labels.outOfRangeTooltip',
            message:
              'The price of this pool is outside of your selected range. Your position is not currently earning fees.',
          })}
        >
          <Badge variant={BadgeVariant.WARNING}>
            <AlertCircle width={14} height={14} />
            &nbsp;
            <BadgeText>
              <Trans id="pools.labels.outOfRange">Out of range</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      )}
    </BadgeWrapper>
  )
}
