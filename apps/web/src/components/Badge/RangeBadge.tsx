import { MouseoverTooltip } from 'components/Tooltip'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { AlertTriangle, Slash } from 'react-feather'

const BadgeWrapper = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: flex-end;
`

const BadgeText = styled.div`
  font-weight: 535;
  font-size: 12px;
  line-height: 14px;
  margin-right: 8px;
`

const ActiveDot = styled.span`
  background-color: ${({ theme }) => theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
`

const LabelText = styled.div<{ color: string }>`
  align-items: center;
  color: ${({ color }) => color};
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`

export default function RangeBadge({ removed, inRange }: { removed?: boolean; inRange?: boolean }) {
  const theme = useTheme()
  return (
    <BadgeWrapper>
      {removed ? (
        <MouseoverTooltip text={<Trans i18nKey="pool.rangeBadge.tooltip.text" />}>
          <LabelText color={theme.neutral2}>
            <BadgeText>
              <Trans i18nKey="common.closed" />
            </BadgeText>
            <Slash width={12} height={12} />
          </LabelText>
        </MouseoverTooltip>
      ) : inRange ? (
        <MouseoverTooltip text={<Trans i18nKey="pool.rangeBadge.tooltip.withinRange" />}>
          <LabelText color={theme.success}>
            <BadgeText>
              <Trans i18nKey="common.withinRange" />
            </BadgeText>
            <ActiveDot />
          </LabelText>
        </MouseoverTooltip>
      ) : (
        <MouseoverTooltip text={<Trans i18nKey="pool.rangeBadge.tooltip.outsideRange" />}>
          <LabelText color={theme.deprecated_accentWarning}>
            <BadgeText>
              <Trans i18nKey="common.outOfRange" />
            </BadgeText>
            <AlertTriangle width={12} height={12} />
          </LabelText>
        </MouseoverTooltip>
      )}
    </BadgeWrapper>
  )
}
