import { Trans } from '@lingui/macro'
import Badge, { BadgeVariant } from 'components/Badge'
import { AlertCircle } from 'react-feather'
import styled from 'styled-components/macro'

import { MouseoverTooltip } from '../../components/Tooltip'

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

export default function RangeBadge({
  removed,
  inRange,
  closed,
}: {
  removed: boolean | undefined
  inRange: boolean | undefined
  closed: boolean | undefined
}) {
  return (
    <BadgeWrapper>
      {closed ? (
        <MouseoverTooltip text={<Trans>Your limit order has been closed. Please claim the amounts.</Trans>}>
          <Badge variant={BadgeVariant.DEFAULT}>
            <AlertCircle width={14} height={14} />
            &nbsp;
            <BadgeText>
              <Trans>Closed</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      ) : inRange ? (
        <MouseoverTooltip text={<Trans>The limit order is filling in.</Trans>}>
          <Badge variant={BadgeVariant.DEFAULT}>
            <ActiveDot /> &nbsp;
            <BadgeText>
              <Trans>Filling</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      ) : (
        <MouseoverTooltip
          text={
            <Trans>
              The limit order is pending, waiting for the price of the pool to move into the target price range.
            </Trans>
          }
        >
          <Badge variant={BadgeVariant.WARNING}>
            <AlertCircle width={14} height={14} />
            &nbsp;
            <BadgeText>
              <Trans>Pending</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      )}
    </BadgeWrapper>
  )
}
