import { Currency } from '@uniswap/sdk-core'
import { Flex, UniversalList, type UniversalListRef, type UniversalListRenderItemInfo } from '@universe/mycelium'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { EmptyTokensList } from 'uniswap/src/components/portfolio/EmptyTokensList'
import { PortfolioEmptyState } from 'uniswap/src/components/portfolio/PortfolioEmptyState'
import { TokenBalanceItemRow } from 'uniswap/src/components/portfolio/TokenBalanceListWeb/TokenBalanceItemRow'
import {
  TokenBalanceListContextProvider,
  useTokenBalanceListContext,
} from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { isHiddenTokenBalancesRow, TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { usePrevious } from 'utilities/src/react/hooks'

// Matches the delay the previous `scrollIntoView` used: let the collapse land before scrolling to it.
const COLLAPSE_SCROLL_DELAY_MS = 100
// Align the hidden-tokens row to the bottom of the viewport, as `scrollIntoView({ block: 'end' })` did.
const HIDDEN_ROW_VIEW_POSITION = 1

type TokenBalanceListProps = {
  evmOwner?: Address
  svmOwner?: Address
  onPressReceive: () => void
  onPressBuy: () => void
  onPressToken?: (currencyId: CurrencyId) => void
  openReportTokenModal: (currency: Currency, isMarkedSpam: Maybe<boolean>) => void
  backgroundImageWrapperCallback?: React.FC<{ children: React.ReactNode }>
}

/** Rows are currency ids plus the hidden-tokens marker, so they're already unique and stable. */
function rowKey(row: TokenBalanceListRow): string {
  return row
}

function rowType(row: TokenBalanceListRow): string {
  return isHiddenTokenBalancesRow(row) ? 'hiddenTokensHeader' : 'balance'
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

  const { rows, balancesById, refetch, hiddenTokensExpanded, isError } = useTokenBalanceListContext()
  const listRef = useRef<UniversalListRef>(null)
  const previousHiddenTokensExpanded = usePrevious(hiddenTokensExpanded)

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Scroll the hidden-tokens row back into view after collapsing it. Addressed by index rather than
  // by DOM ref: under virtualization the row's node isn't guaranteed to be mounted.
  //
  // Deliberately no cleanup: `previousHiddenTokensExpanded` flips false on the next render, so
  // clearing here would cancel the scroll this just scheduled if anything re-rendered inside the
  // delay. Left pending on unmount too — `listRef.current` is null by then, so the callback no-ops.
  useEffect(() => {
    if (!previousHiddenTokensExpanded || hiddenTokensExpanded) {
      return
    }

    const index = rows.findIndex(isHiddenTokenBalancesRow)
    if (index < 0) {
      return
    }

    clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: HIDDEN_ROW_VIEW_POSITION })
    }, COLLAPSE_SCROLL_DELAY_MS)
  }, [hiddenTokensExpanded, previousHiddenTokensExpanded, rows])

  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<TokenBalanceListRow>): JSX.Element => (
      <TokenBalanceItemRow item={item} openReportTokenModal={openReportTokenModal} />
    ),
    [openReportTokenModal],
  )

  const hasData = !!balancesById
  const hasTokens = balancesById && Object.keys(balancesById).length > 0
  const hasErrorWithCachedValues = hasData && isError

  const listHeader = useMemo(
    () =>
      hasErrorWithCachedValues ? (
        <Flex>
          <BaseCard.InlineErrorState title={t('home.tokens.error.fetch')} onRetry={refetch} />
        </Flex>
      ) : null,
    [hasErrorWithCachedValues, t, refetch],
  )

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
    <UniversalList
      ref={listRef}
      // The sidepanel document is the scroller; an inner container here would stop virtualizing
      // inside its unbounded parent and reserve a second scrollbar gutter.
      useWindowScroll
      data={rows}
      getItemType={rowType}
      keyExtractor={rowKey}
      ListHeaderComponent={listHeader}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      style={{ className: 'w-full' }}
    />
  )
}
