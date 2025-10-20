import { TokenDetailsPoolsTable } from 'components/Tokens/TokenDetails/tables/TokenDetailsPoolsTable'
import { TransactionsTable } from 'components/Tokens/TokenDetails/tables/TransactionsTable'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useEffect, useState } from 'react'
import { Trans } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, styled, Text } from 'ui/src'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'

const Container = styled(Flex, {
  width: '100%',
})

const Tab = styled(Text, {
  color: '$neutral1',
  variant: 'heading3',
  variants: {
    clickable: {
      true: ClickableTamaguiStyle,
      false: {},
    },
  },
  defaultVariants: {
    clickable: true,
  },
})

// if you add a new tab, you must update the logic to disable the tab if the token is on a solana chain
enum ActivityTab {
  Txs = 0,
  Pools = 1,
}
export function ActivitySection() {
  const { currency: referenceCurrency, currencyChainId } = useTDPContext()

  const [activityInView, setActivityInView] = useState(ActivityTab.Txs)

  const isSolanaToken = isSVMChain(currencyChainId)

  useEffect(() => {
    if (isSolanaToken && activityInView === ActivityTab.Pools) {
      setActivityInView(ActivityTab.Txs)
    }
  }, [isSolanaToken, activityInView])

  return (
    <Container data-testid="token-details-activity-section">
      <Flex row gap="$spacing24" mb="$spacing24" id="activity-header">
        <Tab
          clickable={!isSolanaToken}
          color={activityInView === ActivityTab.Txs ? '$neutral1' : '$neutral2'}
          onPress={() => setActivityInView(ActivityTab.Txs)}
        >
          <Trans i18nKey="common.transactions" />
        </Tab>
        {!isSolanaToken && (
          <Tab
            color={activityInView === ActivityTab.Pools ? '$neutral1' : '$neutral2'}
            onPress={() => setActivityInView(ActivityTab.Pools)}
          >
            <Trans i18nKey="common.pools" />
          </Tab>
        )}
      </Flex>
      {activityInView === ActivityTab.Txs && (
        <TransactionsTable chainId={referenceCurrency.chainId} referenceToken={referenceCurrency.wrapped} />
      )}
      {activityInView === ActivityTab.Pools && !isSolanaToken && (
        <TokenDetailsPoolsTable referenceCurrency={referenceCurrency} />
      )}
    </Container>
  )
}
