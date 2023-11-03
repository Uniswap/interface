import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components'
import { ClickableStyle } from 'theme/components'
import { ThemedText } from 'theme/components/text'

import { TransactionsTable } from './TransactionsTable'

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`
const Tab = styled(ThemedText.BodyPrimary)<{ isActive?: boolean }>`
  cursor: pointer;
  font-size: 24px !important;
  line-height: 32px !important;
  color: ${({ isActive, theme }) => (isActive ? theme.neutral1 : theme.neutral2)};
  ${ClickableStyle};
`
enum ActivityTab {
  Pools,
  Transactions,
}
export function ActivitySection({ referenceToken }: { referenceToken: Token }) {
  const [activityInView, setActivityInView] = useState(ActivityTab.Pools)
  return (
    <Container>
      <Row gap="24px" marginBottom="12px">
        <Tab isActive={activityInView === ActivityTab.Pools} onClick={() => setActivityInView(ActivityTab.Pools)}>
          <Trans>Pools</Trans>
        </Tab>
        <Tab
          isActive={activityInView === ActivityTab.Transactions}
          onClick={() => setActivityInView(ActivityTab.Transactions)}
        >
          <Trans>Transactions</Trans>
        </Tab>
      </Row>
      {activityInView === ActivityTab.Transactions ? (
        <TransactionsTable referenceToken={referenceToken} />
      ) : (
        <>Pools Table</>
      )}
    </Container>
  )
}
