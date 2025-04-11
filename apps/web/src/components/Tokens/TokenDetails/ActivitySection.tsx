import { TokenDetailsPoolsTable } from 'components/Tokens/TokenDetails/tables/TokenDetailsPoolsTable'
import { TransactionsTable } from 'components/Tokens/TokenDetails/tables/TransactionsTable'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useState } from 'react'
import { Trans } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, styled, Text } from 'ui/src'

const Container = styled(Flex, {
  width: '100%',
})

const Tab = styled(Text, {
  color: '$neutral1',
  variant: 'heading3',
  ...ClickableTamaguiStyle,
})

enum ActivityTab {
  Txs = 0,
  Pools = 1,
}
export function ActivitySection() {
  const { wrapped: referenceToken, chainId } = useTDPContext().currency

  const [activityInView, setActivityInView] = useState(ActivityTab.Txs)

  if (!referenceToken) {
    return null
  }
  return (
    <Container data-testid="token-details-activity-section">
      <Flex row gap="$spacing24" mb="$spacing24" id="activity-header">
        <Tab
          color={activityInView === ActivityTab.Txs ? '$neutral1' : '$neutral2'}
          onPress={() => setActivityInView(ActivityTab.Txs)}
        >
          <Trans i18nKey="common.transactions" />
        </Tab>
        <Tab
          color={activityInView === ActivityTab.Pools ? '$neutral1' : '$neutral2'}
          onPress={() => setActivityInView(ActivityTab.Pools)}
        >
          <Trans i18nKey="common.pools" />
        </Tab>
      </Flex>
      {activityInView === ActivityTab.Txs && <TransactionsTable chainId={chainId} referenceToken={referenceToken} />}
      {activityInView === ActivityTab.Pools && (
        <TokenDetailsPoolsTable chainId={chainId} referenceToken={referenceToken} />
      )}
    </Container>
  )
}
