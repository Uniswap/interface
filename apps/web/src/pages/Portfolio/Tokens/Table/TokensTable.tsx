import { NetworkStatus } from '@apollo/client'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensTableInner } from 'pages/Portfolio/Tokens/Table/TokensTableInner'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollSync } from 'react-scroll-sync'
import { Flex, HeightAnimator, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp } from 'ui/src/components/icons/AnglesDownUp'
import { SortVertical } from 'ui/src/components/icons/SortVertical'

interface TokensTableProps {
  visible: TokenData[]
  hidden: TokenData[]
  loading: boolean
  refetching?: boolean
  networkStatus: NetworkStatus
  error?: Error | undefined
}

export function TokensTable({ visible, hidden, loading, refetching, networkStatus, error }: TokensTableProps) {
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
            <TouchableArea onPress={() => setIsOpen(!isOpen)} row gap="$gap8" p="$spacing16">
              <Text variant="body2" color="$neutral2">
                {t('hidden.tokens.info.text.button', { numHidden: hidden.length })}
              </Text>
              <Flex justifyContent="center" testID="expando-row-icon">
                {isOpen ? (
                  <AnglesDownUp color="$neutral2" size="$icon.20" />
                ) : (
                  <SortVertical color="$neutral2" size="$icon.20" />
                )}
              </Flex>
            </TouchableArea>
            <HeightAnimator open={isOpen}>
              <TokensTableInner tokenData={hidden} hideHeader loading={tableLoading} error={error} />
            </HeightAnimator>
          </>
        )}
      </Flex>
    </ScrollSync>
  )
}
