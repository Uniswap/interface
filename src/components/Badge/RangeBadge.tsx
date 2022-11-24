import { Trans } from '@lingui/macro'
import { AlertCircle, Info } from 'react-feather'
import styled from 'styled-components'

import Badge, { BadgeVariant } from 'components/Badge'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

const BadgeWrapper = styled.div`
  font-size: 12px;
  display: flex;
  justify-content: flex-end;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
`

export default function RangeBadge({
  removed,
  inRange,
  hideText = false,
}: {
  removed: boolean | undefined
  inRange: boolean | undefined
  hideText?: boolean
}) {
  const theme = useTheme()
  return (
    <BadgeWrapper>
      {removed ? (
        <MouseoverTooltip text={<Trans>Your position has 0 liquidity, and is not earning fees</Trans>}>
          <Badge variant={BadgeVariant.NEGATIVE}>
            <AlertCircle width={16} height={16} />
            &nbsp;
            <BadgeText>
              <Trans>Closed</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      ) : inRange ? (
        <MouseoverTooltip
          text={
            <Trans>The price of this pool is within your selected range. Your position is currently earning fees</Trans>
          }
        >
          <Badge variant={BadgeVariant.PRIMARY} style={{ padding: hideText ? '4px' : undefined }}>
            {/* <ActiveDot /> &nbsp; */}
            <Info size={16} color={theme.primary} />
            {!hideText && (
              <>
                &nbsp;
                <BadgeText>
                  <Trans>In range</Trans>
                </BadgeText>
              </>
            )}
          </Badge>
        </MouseoverTooltip>
      ) : (
        <MouseoverTooltip
          text={
            <Trans>
              The price of this pool is outside of your selected price range. Currently, your position is not earning
              any fees or rewards
            </Trans>
          }
        >
          <Badge variant={BadgeVariant.WARNING} style={{ padding: hideText ? '4px' : undefined }}>
            <Info size={16} color={theme.warning} />
            {!hideText && (
              <>
                &nbsp;
                <BadgeText>
                  <Trans>Out of range</Trans>
                </BadgeText>
              </>
            )}
          </Badge>
        </MouseoverTooltip>
      )}
    </BadgeWrapper>
  )
}
