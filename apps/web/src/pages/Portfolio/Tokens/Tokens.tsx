import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { SearchInput } from 'pages/Portfolio/components/SearchInput'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { useTransformTokenTableData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensAllocationChart } from 'pages/Portfolio/Tokens/Table/TokensAllocationChart'
import { TokensTable } from 'pages/Portfolio/Tokens/Table/TokensTable'
import { filterTokensBySearch } from 'pages/Portfolio/Tokens/utils/filterTokensBySearch'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, RemoveScroll, Text, useMedia } from 'ui/src'
import { TokensListEmptyState } from 'uniswap/src/components/tokens/TokensListEmptyState'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
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
        {t('portfolio.tokens.balance.totalTokens', { numTokens: count, count })}
      </Text>
    </Flex>
  )
})

TokenCountIndicator.displayName = 'TokenCountIndicator'

export const PortfolioTokens = memo(function PortfolioTokens() {
  const portfolioAddresses = usePortfolioAddresses()
  const media = useMedia()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { chains: enabledChains } = useEnabledChains()
  const { chainId: urlChainId } = usePortfolioRoutes()
  const isPortfolioTokensAllocationChartEnabled = useFeatureFlag(FeatureFlags.PortfolioTokensAllocationChart)

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

  // Handler to clear chain filter and show all networks
  const handleShowAllNetworks = useCallback(() => {
    navigate('/portfolio/tokens')
  }, [navigate])

  // Custom empty state for chain filtering
  const chainFilterEmptyState = useMemo(() => {
    if (!urlChainId) {
      return undefined
    }
    const chainName = getChainLabel(urlChainId)
    return (
      <TokensListEmptyState
        description={null}
        buttonLabel={t('portfolio.networkFilter.seeAllNetworks')}
        onPress={handleShowAllNetworks}
        title={t('tokens.list.noneOnChain.title', { chainName })}
      />
    )
  }, [handleShowAllNetworks, urlChainId, t])

  return (
    <RemoveScroll enabled={loading}>
      <Trace logImpression page={InterfacePageName.PortfolioTokensPage}>
        <Flex flexDirection="column" gap="$spacing16">
          <Flex
            row
            alignItems="baseline"
            justifyContent="space-between"
            gap="$spacing8"
            $md={{ flexDirection: 'column', alignItems: 'flex-start', gap: '$spacing24' }}
          >
            <Trace section={SectionName.PortfolioTokensTab} element={ElementName.PortfolioBalance}>
              <PortfolioBalance
                evmOwner={portfolioAddresses.evmAddress}
                svmOwner={portfolioAddresses.svmAddress}
                endText={tokenData ? <TokenCountIndicator count={tokenData.length} /> : undefined}
                chainIds={effectiveChainId ? [effectiveChainId] : undefined}
              />
            </Trace>
            <Trace logFocus section={SectionName.PortfolioTokensTab} element={ElementName.PortfolioTokensSearch}>
              <SearchInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('tokens.table.search.placeholder.tokens')}
                width={media.md ? '100%' : undefined}
              />
            </Trace>
          </Flex>

          {(tokenData && tokenData.length > 0) || loading ? (
            <>
              {isPortfolioTokensAllocationChartEnabled && (
                <Trace section={SectionName.PortfolioTokensTab} element={ElementName.TokensAllocationChart}>
                  <TokensAllocationChart tokenData={tokenData || []} />
                </Trace>
              )}
              {(filteredTokenData?.length ?? 0) > 0 || loading ? (
                <Trace section={SectionName.PortfolioTokensTab} element={ElementName.PortfolioTokensTable}>
                  <TokensTable
                    visible={filteredTokenData || []}
                    hidden={filteredHiddenTokenData}
                    loading={loading && !refetching}
                    refetching={refetching}
                    networkStatus={networkStatus}
                    error={error}
                  />
                </Trace>
              ) : (
                <Flex flexDirection="column" alignItems="center" justifyContent="center" py="$spacing48">
                  <Text variant="body1" color="$neutral2">
                    {t('common.noResults')}
                  </Text>
                </Flex>
              )}
            </>
          ) : urlChainId ? (
            chainFilterEmptyState
          ) : (
            <TokensListEmptyState />
          )}
        </Flex>
      </Trace>
    </RemoveScroll>
  )
})

PortfolioTokens.displayName = 'PortfolioTokens'
