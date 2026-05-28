import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { TokenDetailsPoolsTable } from '~/pages/TokenDetails/components/activity/TokenDetailsPoolsTable'
import { TransactionsTable } from '~/pages/TokenDetails/components/activity/TransactionsTable'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
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
  const referenceCurrency = useTDPEffectiveCurrency()
  const { currencyChainId, selectedMultichainChainId } = useTDPStore((s) => ({
    currencyChainId: s.currencyChainId,
    selectedMultichainChainId: s.selectedMultichainChainId,
  }))
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const isMultichainView = multichainTokenUxEnabled && selectedMultichainChainId === undefined

  const [activityInView, setActivityInView] = useState(ActivityTab.Txs)

  const isSolanaToken = isSVMChain(currencyChainId)
  const hasLimitedTransactionData = currencyChainId === UniverseChainId.Tempo

  useEffect(() => {
    if (isSolanaToken && activityInView === ActivityTab.Pools) {
      setActivityInView(ActivityTab.Txs)
    }
  }, [isSolanaToken, activityInView])

  return (
    <Flex data-testid="token-details-activity-section" width="100%">
      <Flex row gap="$spacing24" mb="$spacing12" id="activity-header">
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
      {hasLimitedTransactionData && (
        <Text variant="body2" color="$neutral2" mb="$spacing24">
          {t('tdp.transactions.limitedMarketData')}
        </Text>
      )}
      {activityInView === ActivityTab.Txs && (
        <TransactionsTable
          chainId={referenceCurrency.chainId}
          referenceToken={referenceCurrency.wrapped}
          isMultichainView={isMultichainView}
        />
      )}
      {activityInView === ActivityTab.Pools && !isSolanaToken && (
        <TokenDetailsPoolsTable referenceCurrency={referenceCurrency} isMultichainView={isMultichainView} />
      )}
    </Flex>
  )
}
