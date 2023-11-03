import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import Row from 'components/Row'
import { useState } from 'react'
import styled, { css } from 'styled-components'
import { ClickableStyle } from 'theme/components'
import { ThemedText } from 'theme/components/text'

import { TransactionsTable } from './TransactionsTable'

const TabStyle = css`
  cursor: pointer;
  font-size: 24px !important;
  line-height: 32px !important;
  ${ClickableStyle}
`
const ActiveTab = styled(ThemedText.BodyPrimary)`
  ${TabStyle}
`
const InactiveTab = styled(ThemedText.BodySecondary)`
  ${TabStyle}
`

enum ActivityTab {
  Pools = 'Pools',
  Transactions = 'Transactions',
}
const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`

export function ActivitySection({ tokenInfo }: { tokenInfo: TokenInfo }) {
  const [activityInView, setActivityInView] = useState(ActivityTab.Pools)
  return (
    <Container>
      <Row gap="24px" marginBottom="12px">
        {Object.values(ActivityTab).map((activity, index) =>
          activity === activityInView ? (
            <ActiveTab key={`activity-${index}`}>
              <Trans>{activity}</Trans>
            </ActiveTab>
          ) : (
            <InactiveTab onClick={() => setActivityInView(activity)} key={`activity-${index}`}>
              <Trans>{activity}</Trans>
            </InactiveTab>
          )
        )}
      </Row>
      {activityInView === ActivityTab.Transactions ? (
        <TransactionsTable referenceToken={tokenInfo} />
      ) : (
        <>Pools Table</>
      )}
    </Container>
  )
}
