import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { AutoColumn } from 'components/Column'
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
        <TransactionsTable referenceToken={tokenInfo} />
      ) : (
        <>Pools Table</>
      )}
    </AutoColumn>
  )
}
