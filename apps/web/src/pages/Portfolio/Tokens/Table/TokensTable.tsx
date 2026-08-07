import { SharedEventName } from '@uniswap/analytics-events'
import { isMobileWeb } from '@universe/environment'
import { startTransition, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollSync } from 'react-scroll-sync'
import { Flex } from 'ui/src'
import { InlineExpandoRow } from 'uniswap/src/components/ExpandoRow/InlineExpandoRow'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useSimplePagination } from '~/pages/Explore/hooks/useSimplePagination'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import {
  PortfolioTokenSortMethod,
  PortfolioTokenTableSortStoreContextProvider,
  usePortfolioTokenTableSortStore,
} from '~/pages/Portfolio/Tokens/Table/portfolioTokenTableSortStore'
import { sortPortfolioTokenData } from '~/pages/Portfolio/Tokens/Table/sortPortfolioTokenData'
import { TokensTableInner } from '~/pages/Portfolio/Tokens/Table/TokensTableInner'
import { flattenTokenDataToSingleChainRows } from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'

const TOKENS_TABLE_MAX_HEIGHT = 700
const HIDDEN_TABLE_MAX_HEIGHT = isMobileWeb ? 350 : TOKENS_TABLE_MAX_HEIGHT
const HIDDEN_PAGE_SIZE = 20

interface TokensTableProps {
  visible: TokenData[]
  hidden: TokenData[]
  loading: boolean
  refetching?: boolean
  error?: Error | undefined
}

// The Hidden Tokens table has extra pagination and resizing logic due to mWeb performance constraints
function HiddenTokensTable({
  hidden,
  loading,
  error,
  sortMethod,
  sortAscending,
}: {
  hidden: TokenData[]
  loading: boolean
  error?: Error | undefined
  sortMethod: PortfolioTokenSortMethod
  sortAscending: boolean
}) {
  const sortedHiddenTokens = useMemo(() => {
    const flattened = flattenTokenDataToSingleChainRows(hidden)
    return sortPortfolioTokenData(flattened, { sortMethod, sortAscending })
  }, [hidden, sortMethod, sortAscending])

  const { page, loadMore } = useSimplePagination({
    totalCount: sortedHiddenTokens.length,
    pageSize: HIDDEN_PAGE_SIZE,
  })

  const displayedHiddenTokens = useMemo(() => {
    if (!isMobileWeb) {
      return sortedHiddenTokens
    }
    return sortedHiddenTokens.slice(0, page * HIDDEN_PAGE_SIZE)
  }, [sortedHiddenTokens, page])

  return (
    <TokensTableInner
      showHiddenTokensBanner
      tokenData={displayedHiddenTokens}
      hideHeader
      loading={loading}
      error={error}
      maxHeight={HIDDEN_TABLE_MAX_HEIGHT}
      showUnrealizedPnlPercent
      virtualized
      loadMore={isMobileWeb ? loadMore : undefined}
    />
  )
}

function TokensTableContent({ visible, hidden, loading, refetching, error }: TokensTableProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const tableLoading = loading && !refetching
  const trace = useTrace()

  const { sortMethod, sortAscending } = usePortfolioTokenTableSortStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))

  const sortedVisible = useMemo(
    () => sortPortfolioTokenData(visible, { sortMethod, sortAscending }),
    [visible, sortMethod, sortAscending],
  )

  const handleToggleHiddenTokens = useCallback(() => {
    const newIsOpen = !isOpen
    startTransition(() => setIsOpen(newIsOpen))
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PortfolioHiddenTokensExpandoRow,
      section: SectionName.PortfolioTokensTab,
      ...trace,
    })
  }, [isOpen, trace])

  return (
    // Scroll Sync Architecture:
    // - Outer ScrollSync coordinates horizontal scrolling between visible and hidden tables
    // - Each TokensTableInner uses externalScrollSync=true to skip its own ScrollSync wrapper
    // - Both tables use ScrollSyncPane with scrollGroup="portfolio-tokens" for coordination
    // - DO NOT remove this outer ScrollSync wrapper without updating the Table components
    <ScrollSync horizontal vertical={false}>
      <Flex gap="$spacing16">
        <TokensTableInner
          tokenData={sortedVisible}
          loading={tableLoading}
          error={error}
          maxHeight={TOKENS_TABLE_MAX_HEIGHT}
          showUnrealizedPnlPercent
        />
        {hidden.length > 0 && (
          <>
            <InlineExpandoRow
              isExpanded={isOpen}
              label={t('hidden.tokens.info.text.button', { numHidden: hidden.length })}
              onPress={handleToggleHiddenTokens}
              testID={TestID.ShowHiddenTokens}
            />
            {/* Keyed on sort so a sort change remounts the table with correct order*/}
            {isOpen && (
              <HiddenTokensTable
                key={`${sortMethod}-${sortAscending}`}
                hidden={hidden}
                loading={tableLoading}
                error={error}
                sortMethod={sortMethod}
                sortAscending={sortAscending}
              />
            )}
          </>
        )}
      </Flex>
    </ScrollSync>
  )
}

export function TokensTable(props: TokensTableProps) {
  return (
    <PortfolioTokenTableSortStoreContextProvider>
      <TokensTableContent {...props} />
    </PortfolioTokenTableSortStoreContextProvider>
  )
}
