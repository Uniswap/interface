import { SearchInput } from 'pages/Portfolio/components/SearchInput'
import { usePortfolioParams } from 'pages/Portfolio/Header/hooks/usePortfolioParams'
import { usePortfolioAddress } from 'pages/Portfolio/hooks/usePortfolioAddress'
import { useTransformTokenTableData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensAllocationChart } from 'pages/Portfolio/Tokens/Table/TokensAllocationChart'
import TokensTable from 'pages/Portfolio/Tokens/Table/TokensTable'
import { filterTokensBySearch } from 'pages/Portfolio/Tokens/utils/filterTokensBySearch'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, RemoveScroll, Text } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { parseChainFromTokenSearchQuery } from 'uniswap/src/utils/search/parseChainFromTokenSearchQuery'

const TokenCountIndicator = memo(({ count }: { count: number }) => {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center">
      <Flex
        borderRadius="$roundedFull"
        backgroundColor="$neutral2"
        width="$spacing4"
        height="$spacing4"
        mx="$spacing8"
      />
      <Text variant="body3" color="$neutral2">
        {t('portfolio.tokens.balance.totalTokens', { numTokens: count })}
      </Text>
    </Flex>
  )
})

TokenCountIndicator.displayName = 'TokenCountIndicator'

export default function PortfolioTokens() {
  const portfolioAddress = usePortfolioAddress()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { chains: enabledChains } = useEnabledChains()
  const { chainId: urlChainId } = usePortfolioParams()

  // Parse search query to extract chain filter and search term
  const { chainFilter, searchTerm } = useMemo(() => {
    return parseChainFromTokenSearchQuery(search, enabledChains)
  }, [search, enabledChains])

  // Use URL chain ID as primary filter, search chain filter as fallback
  const effectiveChainId = urlChainId || chainFilter

  // Get token data filtered by chain at API level
  const {
    visible: tokenData,
    hidden: hiddenTokenData,
    loading,
    refetching,
    networkStatus,
    error,
  } = useTransformTokenTableData({
    chainIds: effectiveChainId ? [effectiveChainId] : undefined,
  })

  // Filter tokens by search term at client level (chain filtering is handled at API level)
  const filteredTokenData = useMemo(() => {
    return filterTokensBySearch({ tokens: tokenData || [], searchTerm })
    // return filterTokensBySearch({ tokens: tokenData, searchTerm }) || []
  }, [tokenData, searchTerm])

  const filteredHiddenTokenData = useMemo(() => {
    return filterTokensBySearch({ tokens: hiddenTokenData || [], searchTerm }) || []
  }, [hiddenTokenData, searchTerm])

  return (
    <RemoveScroll enabled={loading}>
      <Trace logImpression page={InterfacePageName.PortfolioTokensPage}>
        <Flex flexDirection="column" gap="$spacing16">
          <Flex row alignItems="baseline" justifyContent="space-between">
            <PortfolioBalance
              owner={portfolioAddress}
              endText={tokenData ? <TokenCountIndicator count={tokenData.length} /> : undefined}
            />
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('tokens.table.search.placeholder.tokens')}
            />
          </Flex>

          {(tokenData && tokenData.length > 0) || loading ? (
            <>
              <TokensAllocationChart tokenData={tokenData || []} />
              {(filteredTokenData?.length ?? 0) > 0 || loading ? (
                <TokensTable
                  visible={filteredTokenData || []}
                  hidden={filteredHiddenTokenData}
                  loading={loading && !refetching}
                  refetching={refetching}
                  networkStatus={networkStatus}
                  error={error}
                />
              ) : (
                <Flex flexDirection="column" alignItems="center" justifyContent="center" py="$spacing48">
                  <Text variant="body1" color="$neutral2">
                    {t('common.noResults')}
                  </Text>
                </Flex>
              )}
            </>
          ) : (
            <Flex flexDirection="column" alignItems="center" justifyContent="center" py="$spacing48">
              <Text variant="body1" color="$neutral2">
                {t('portfolio.tokens.emptyState')}
              </Text>
            </Flex>
          )}
        </Flex>
      </Trace>
    </RemoveScroll>
  )
}
