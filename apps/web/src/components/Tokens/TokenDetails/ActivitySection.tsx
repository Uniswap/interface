import Row from 'components/Row'
import { TokenDetailsPoolsTable } from 'components/Tokens/TokenDetails/tables/TokenDetailsPoolsTable'
import { TransactionsTable } from 'components/Tokens/TokenDetails/tables/TransactionsTable'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useState } from 'react'
import { ClickableStyle, ThemedText } from 'theme/components'

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`
const Tab = styled(ThemedText.HeadlineMedium)<{ isActive?: boolean }>`
  cursor: pointer;
  color: ${({ isActive, theme }) => (isActive ? theme.neutral1 : theme.neutral2)};
  ${ClickableStyle};
`
enum ActivityTab {
  Txs,
  Pools,
}
export function ActivitySection() {
  const { wrapped: referenceToken, chainId } = useTDPContext().currency

  const [activityInView, setActivityInView] = useState(ActivityTab.Txs)

  if (!referenceToken) {
    return null
  }
  return (
    <Container data-testid="token-details-activity-section">
      <Row gap="24px" marginBottom="24px" id="activity-header">
        <Tab isActive={activityInView === ActivityTab.Txs} onClick={() => setActivityInView(ActivityTab.Txs)}>
          <Trans i18nKey="common.transactions" />
        </Tab>
        <Tab isActive={activityInView === ActivityTab.Pools} onClick={() => setActivityInView(ActivityTab.Pools)}>
          <Trans i18nKey="common.pools" />
        </Tab>
      </Row>
      {activityInView === ActivityTab.Txs && <TransactionsTable chainId={chainId} referenceToken={referenceToken} />}
      {activityInView === ActivityTab.Pools && (
        <TokenDetailsPoolsTable chainId={chainId} referenceToken={referenceToken} />
      )}
    </Container>
  )
}
