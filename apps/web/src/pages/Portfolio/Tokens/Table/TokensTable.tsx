import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollSync } from 'react-scroll-sync'
import { Flex } from 'ui/src'
import { InlineExpandoRow } from 'uniswap/src/components/ExpandoRow/InlineExpandoRow'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import {
  PortfolioTokenTableSortStoreContextProvider,
  usePortfolioTokenTableSortStore,
} from '~/pages/Portfolio/Tokens/Table/portfolioTokenTableSortStore'
import { sortPortfolioTokenData } from '~/pages/Portfolio/Tokens/Table/sortPortfolioTokenData'
import { TokensTableInner } from '~/pages/Portfolio/Tokens/Table/TokensTableInner'
import { flattenTokenDataToSingleChainRows } from '~/pages/Portfolio/Tokens/Table/tokenTableRowUtils'

const TOKENS_TABLE_MAX_HEIGHT = 700

interface TokensTableProps {
  visible: TokenData[]
  hidden: TokenData[]
  loading: boolean
  refetching?: boolean
  error?: Error | undefined
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

  // Collapse hidden tokens when sort changes so we don't re-render 100+ hidden rows.
  // We detect the change during render (not in an effect) so React restarts the
  // render with isOpen=false before the hidden table ever mounts.
  const prevSortRef = useRef({ sortMethod, sortAscending })
  if (prevSortRef.current.sortMethod !== sortMethod || prevSortRef.current.sortAscending !== sortAscending) {
    prevSortRef.current = { sortMethod, sortAscending }
    if (isOpen) {
      setIsOpen(false)
    }
  }

  const sortedVisible = useMemo(
    () => sortPortfolioTokenData(visible, { sortMethod, sortAscending }),
    [visible, sortMethod, sortAscending],
  )

  const flattenedHiddenTokens = useMemo(() => flattenTokenDataToSingleChainRows(hidden), [hidden])

  const sortedHiddenTokens = useMemo(
    () => sortPortfolioTokenData(flattenedHiddenTokens, { sortMethod, sortAscending }),
    [flattenedHiddenTokens, sortMethod, sortAscending],
  )

  const handleToggleHiddenTokens = useCallback(() => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
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
        {sortedHiddenTokens.length > 0 && (
          <>
            <InlineExpandoRow
              isExpanded={isOpen}
              label={t('hidden.tokens.info.text.button', { numHidden: hidden.length })}
              onPress={handleToggleHiddenTokens}
              testID={TestID.ShowHiddenTokens}
            />
            {isOpen && (
              <TokensTableInner
                showHiddenTokensBanner
                tokenData={sortedHiddenTokens}
                hideHeader
                loading={tableLoading}
                error={error}
                maxHeight={TOKENS_TABLE_MAX_HEIGHT}
                showUnrealizedPnlPercent
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
