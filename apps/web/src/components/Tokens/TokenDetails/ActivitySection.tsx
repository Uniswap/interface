import { Trans } from '@lingui/macro'
import { ChainId, Token } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { TokenDetailsPoolsTable } from 'components/Tokens/TokenDetails/tables/TokenDetailsPoolsTable'
import { useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { ClickableStyle } from 'theme/components'

import { TransactionsTable } from './tables/TransactionsTable'

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`
const Tab = styled(Text)<{ isActive?: boolean }>`
  cursor: pointer;
  font-size: 24px !important;
  line-height: 32px !important;
  color: ${({ isActive, theme }) => (isActive ? theme.neutral1 : theme.neutral2)};
  ${ClickableStyle};
`
enum ActivityTab {
  Pools,
  Txs,
}
export function ActivitySection({ chainId, referenceToken }: { chainId: ChainId; referenceToken?: Token }) {
  const [activityInView, setActivityInView] = useState(ActivityTab.Pools)

  if (!referenceToken) {
    return null
  }
  return (
    <Container>
      <Row gap="24px" marginBottom="12px" id="activity-header">
        <Tab isActive={activityInView === ActivityTab.Pools} onClick={() => setActivityInView(ActivityTab.Pools)}>
          <Trans>Pools</Trans>
        </Tab>
        <Tab isActive={activityInView === ActivityTab.Txs} onClick={() => setActivityInView(ActivityTab.Txs)}>
          <Trans>Transactions</Trans>
        </Tab>
      </Row>
      {activityInView === ActivityTab.Pools && (
        <TokenDetailsPoolsTable chainId={chainId} referenceToken={referenceToken} />
      )}
      {activityInView === ActivityTab.Txs && <TransactionsTable chainId={chainId} referenceToken={referenceToken} />}
    </Container>
  )
}
