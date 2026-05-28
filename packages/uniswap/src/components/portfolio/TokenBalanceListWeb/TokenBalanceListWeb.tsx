import { NetworkStatus } from '@apollo/client'
import { Currency } from '@uniswap/sdk-core'
import { memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { EmptyTokensList } from 'uniswap/src/components/portfolio/EmptyTokensList'
import { PortfolioEmptyState } from 'uniswap/src/components/portfolio/PortfolioEmptyState'
import { TokenBalanceItems } from 'uniswap/src/components/portfolio/TokenBalanceListWeb/TokenBalanceItems'
import {
  TokenBalanceListContextProvider,
  useTokenBalanceListContext,
} from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { isHiddenTokenBalancesRow } from 'uniswap/src/features/portfolio/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { usePrevious } from 'utilities/src/react/hooks'

type TokenBalanceListProps = {
  evmOwner?: Address
  svmOwner?: Address
  onPressReceive: () => void
  onPressBuy: () => void
  onPressToken?: (currencyId: CurrencyId) => void
  openReportTokenModal: (currency: Currency, isMarkedSpam: Maybe<boolean>) => void
  backgroundImageWrapperCallback?: React.FC<{ children: React.ReactNode }>
}

export const TokenBalanceListWeb = memo(function TokenBalanceListWebInner({
  evmOwner,
  svmOwner,
  onPressReceive,
  onPressBuy,
  onPressToken,
  openReportTokenModal,
  backgroundImageWrapperCallback,
}: TokenBalanceListProps): JSX.Element {
  return (
    <Flex grow>
      <TokenBalanceListContextProvider
        isExternalProfile={false}
        evmOwner={evmOwner}
        svmOwner={svmOwner}
        onPressToken={onPressToken}
      >
        <TokenBalanceListInner
          backgroundImageWrapperCallback={backgroundImageWrapperCallback}
          openReportTokenModal={openReportTokenModal}
          onPressReceive={onPressReceive}
          onPressBuy={onPressBuy}
        />
      </TokenBalanceListContextProvider>
    </Flex>
  )
})

function TokenBalanceListInner({
  onPressReceive,
  onPressBuy,
  openReportTokenModal,
  backgroundImageWrapperCallback,
}: Omit<TokenBalanceListProps, 'svmOwner' | 'evmOwner' | 'onPressToken'>): JSX.Element {
  const { t } = useTranslation()

  const { rows, balancesById, networkStatus, refetch, hiddenTokensExpanded } = useTokenBalanceListContext()
  const hiddenTokensRowRef = useRef<HTMLDivElement | null>(null)
  const previousHiddenTokensExpanded = usePrevious(hiddenTokensExpanded)

  // Handle auto scroll, after hiding section of hidden tokens.
  // We additionally wait 100ms to allow the animation to start before scrolling.
  useEffect(() => {
    // Only scroll when transitioning from expanded to collapsed (not on initial render)
    if (previousHiddenTokensExpanded && !hiddenTokensExpanded) {
      // Use setTimeout to ensure the animation has started before scrolling
      const timeoutId = setTimeout(() => {
        hiddenTokensRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      }, 100) // Allow animation to start before scrolling

      return () => clearTimeout(timeoutId)
    }

    return () => {}
  }, [hiddenTokensExpanded, previousHiddenTokensExpanded])

  const visible: string[] = []
  const hidden: string[] = []

  let isHidden = false
  for (const row of rows) {
    const target = isHidden ? hidden : visible
    target.push(row)
    // do this after pushing so we keep our Hidden header row in the visible section
    // so users can see it when closed and re-open it
    if (isHiddenTokenBalancesRow(row)) {
      isHidden = true
    }
  }

  const hasData = !!balancesById
  const hasTokens = balancesById && Object.keys(balancesById).length > 0
  const hasErrorWithCachedValues = hasData && networkStatus === NetworkStatus.error

  if (!hasData) {
    return (
      <EmptyTokensList
        emptyCondition={!hasTokens}
        errorCardContainerStyle={{
          fill: true,
          grow: true,
          justifyContent: 'center',
          pt: '$spacing48',
          px: '$spacing36',
        }}
      />
    )
  }

  if (!hasTokens) {
    return (
      <Flex>
        <PortfolioEmptyState
          disableCexTransfers
          backgroundImageWrapperCallback={backgroundImageWrapperCallback}
          onPressBuy={onPressBuy}
          onPressReceive={onPressReceive}
        />
      </Flex>
    )
  }

  return (
    <>
      {hasErrorWithCachedValues && (
        <Flex>
          <BaseCard.InlineErrorState title={t('home.tokens.error.fetch')} onRetry={refetch} />
        </Flex>
      )}
      <TokenBalanceItems
        rows={visible}
        openReportTokenModal={openReportTokenModal}
        hiddenTokensRowRef={hiddenTokensRowRef}
      />
      <AnimatePresence initial={false}>
        {hiddenTokensExpanded && (
          <TokenBalanceItems animated rows={hidden} openReportTokenModal={openReportTokenModal} />
        )}
      </AnimatePresence>
    </>
  )
}
