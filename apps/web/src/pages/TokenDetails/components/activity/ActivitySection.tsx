import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { TokenDetailsPoolsTable } from '~/pages/TokenDetails/components/activity/TokenDetailsPoolsTable'
import { TransactionsTable } from '~/pages/TokenDetails/components/activity/TransactionsTable'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

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
  const { t } = useTranslation()
  const { currency: referenceCurrency, currencyChainId } = useTDPContext()

  const [activityInView, setActivityInView] = useState(ActivityTab.Txs)

  const isSolanaToken = isSVMChain(currencyChainId)

  useEffect(() => {
    if (isSolanaToken && activityInView === ActivityTab.Pools) {
      setActivityInView(ActivityTab.Txs)
    }
  }, [isSolanaToken, activityInView])

  return (
    <Flex data-testid="token-details-activity-section" width="100%">
      <Flex row gap="$spacing24" mb="$spacing24" id="activity-header">
        <Tab
          clickable={!isSolanaToken}
          color={activityInView === ActivityTab.Txs ? '$neutral1' : '$neutral2'}
          onPress={() => setActivityInView(ActivityTab.Txs)}
        >
          {t('common.transactions')}
        </Tab>
        {!isSolanaToken && (
          <Tab
            color={activityInView === ActivityTab.Pools ? '$neutral1' : '$neutral2'}
            onPress={() => setActivityInView(ActivityTab.Pools)}
          >
            {t('common.pools')}
          </Tab>
        )}
      </Flex>
      {activityInView === ActivityTab.Txs && (
        <TransactionsTable chainId={referenceCurrency.chainId} referenceToken={referenceCurrency.wrapped} />
      )}
      {activityInView === ActivityTab.Pools && !isSolanaToken && (
        <TokenDetailsPoolsTable referenceCurrency={referenceCurrency} />
      )}
    </Flex>
  )
}
