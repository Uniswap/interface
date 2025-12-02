import { NetworkStatus } from '@apollo/client'
import { PortfolioExpandoRow } from 'pages/Portfolio/components/PortfolioExpandoRow'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensTableInner } from 'pages/Portfolio/Tokens/Table/TokensTableInner'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollSync } from 'react-scroll-sync'
import { Flex } from 'ui/src'

interface TokensTableProps {
  visible: TokenData[]
  hidden: TokenData[]
  loading: boolean
  refetching?: boolean
  networkStatus: NetworkStatus
  error?: Error | undefined
}

export function TokensTable({ visible, hidden, loading, refetching, error }: TokensTableProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const tableLoading = loading && !refetching

  return (
    // Scroll Sync Architecture:
    // - Outer ScrollSync coordinates horizontal scrolling between visible and hidden tables
    // - Each TokensTableInner uses externalScrollSync=true to skip its own ScrollSync wrapper
    // - Both tables use ScrollSyncPane with scrollGroup="portfolio-tokens" for coordination
    // - DO NOT remove this outer ScrollSync wrapper without updating the Table components
    <ScrollSync horizontal>
      <Flex gap="$spacing16">
        <TokensTableInner tokenData={visible} loading={tableLoading} error={error} />
        {hidden.length > 0 && (
          <>
            <PortfolioExpandoRow
              isExpanded={isOpen}
              label={t('hidden.tokens.info.text.button', { numHidden: hidden.length })}
              onPress={() => setIsOpen(!isOpen)}
            />
            {isOpen && (
              <TokensTableInner
                showHiddenTokensBanner
                tokenData={hidden}
                hideHeader
                loading={tableLoading}
                error={error}
              />
            )}
          </>
        )}
      </Flex>
    </ScrollSync>
  )
}
