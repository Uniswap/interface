import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components/text'

import { TransactionsTable } from './TransactionsTable'

const ActiveTab = styled(ThemedText.BodyPrimary)`
  cursor: pointer;
  font-size: 24px !important;
  line-height: 32px !important;
`
const InactiveTab = styled(ThemedText.BodySecondary)`
  cursor: pointer;
  font-size: 24px !important;
  line-height: 32px !important;
`

enum ActivityTab {
  Transactions = 'Transactions',
  Pools = 'Pools',
}

export function ActivitySection({ tokenInfo }: { tokenInfo: TokenInfo }) {
  const [activityInView, setActivityInView] = useState(ActivityTab.Transactions)
  return (
    <AutoColumn>
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
        <TransactionsTable referenceTokenAddress={tokenInfo.address.toLowerCase()} />
      ) : (
        <>Pools Table</>
      )}
    </AutoColumn>
  )
}
