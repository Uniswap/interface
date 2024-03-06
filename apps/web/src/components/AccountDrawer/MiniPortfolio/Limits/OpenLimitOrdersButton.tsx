import { Plural, t, Trans } from '@lingui/macro'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import Column from 'components/Column'
import { TimeForwardIcon } from 'components/Icons/TimeForward'
import Row from 'components/Row'
import { ChevronRight } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'

const Container = styled.button`
  border-radius: 16px;
  border: none;
  background: ${({ theme }) => theme.surface2};
  padding: 12px 16px;
  margin-top: 12px;
  ${ClickableStyle}
`

function getExtraWarning(openLimitOrders: any[]) {
  if (openLimitOrders.length >= 100) return <Trans>Cancel limits to proceed</Trans>
  if (openLimitOrders.length >= 90) return <Trans>Approaching 100 limit maximum</Trans>
  return undefined
}

export function OpenLimitOrdersButton({
  openLimitsMenu,
  account,
  disabled,
  className,
}: {
  account: string
  openLimitsMenu: () => void
  disabled?: boolean
  className?: string
}) {
  const { openLimitOrders } = useOpenLimitOrders(account)
  const theme = useTheme()
  const extraWarning = getExtraWarning(openLimitOrders)
  if (!openLimitOrders || openLimitOrders.length < 1) return null
  return (
    <Container onClick={openLimitsMenu} disabled={disabled} className={className}>
      <Row justify="space-between" align="center">
        <Row gap="md">
          <TimeForwardIcon />
          <Column>
            <ThemedText.SubHeader textAlign="start">
              <Plural
                value={openLimitOrders.length}
                _1={t`1 open limit`}
                other={t`${openLimitOrders.length} open limits`}
              />
            </ThemedText.SubHeader>
            {extraWarning && <ThemedText.LabelMicro>{extraWarning}</ThemedText.LabelMicro>}
          </Column>
        </Row>
        <ChevronRight color={theme.neutral1} />
      </Row>
    </Container>
  )
}
