import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, RemoveScroll, useMedia } from 'ui/src'
import { Coin } from 'ui/src/components/icons/Coin'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokensListEmptyState } from 'uniswap/src/components/tokens/TokensListEmptyState'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useGetWalletTokensProfitLossQuery } from 'uniswap/src/data/rest/getWalletTokensProfitLoss'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { ElementName, InterfacePageName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { parseChainFromTokenSearchQuery } from 'uniswap/src/utils/search/parseChainFromTokenSearchQuery'
import { PortfolioBalanceCountIndicator } from '~/pages/Portfolio/components/PortfolioBalanceCountIndicator'
import { SearchInput } from '~/pages/Portfolio/components/SearchInput'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useTransformTokenTableData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { TokensAllocationChart } from '~/pages/Portfolio/Tokens/Table/TokensAllocationChart'
import { TokensTable } from '~/pages/Portfolio/Tokens/Table/TokensTable'
import { filterTokensBySearch } from '~/pages/Portfolio/Tokens/utils/filterTokensBySearch'

// Disabled until polished in future projects
const SHOW_TOKEN_ALLOCATION_CHART = false

const TokenCountIndicator = memo(({ count }: { count: number }) => {
  const { t } = useTranslation()

  return (
    <PortfolioBalanceCountIndicator label={t('portfolio.tokens.balance.totalTokens', { numTokens: count, count })} />
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
  const { chainId: urlChainId, isExternalWallet } = usePortfolioRoutes()

  const modifier = useRestPortfolioValueModifier(portfolioAddresses.evmAddress ?? portfolioAddresses.svmAddress)

  // Parse search query to extract chain filter and search term
  const { chainFilter, searchTerm } = useMemo(() => {
    return parseChainFromTokenSearchQuery(search, enabledChains)
  }, [search, enabledChains])

  // Use URL chain ID as primary filter, search chain filter as fallback
  const effectiveChainId = urlChainId || chainFilter

  // Multichain PnL responses use `multichainTokenProfitLoss` / `chainBreakdown`. With a single-network
  // filter, the API often omits that shape; request flat `tokenProfitLosses` instead (multichain: false).
  const requestMultichainPnlShape = effectiveChainId === null

  const { data: tokenProfitLossData, isError: isProfitLossError } = useGetWalletTokensProfitLossQuery({
    input: {
      evmAddress: portfolioAddresses.evmAddress,
      svmAddress: portfolioAddresses.svmAddress,
      chainIds: effectiveChainId ? [effectiveChainId] : enabledChains,
      modifier,
      multichain: requestMultichainPnlShape || undefined,
    },
  })

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
    tokenProfitLossData: isProfitLossError ? undefined : (tokenProfitLossData ?? undefined),
  })

  useEffect(() => {
    if (!tokenData || !tokenProfitLossData) {
      return
    }

    // Coverage is counted per token-per-chain, not per collapsed multichain row. A user holding ETH
    // on 5 chains with PnL on 3 of them counts as 3/5, not 1/1
    const portfolioCount = tokenData.reduce((sum, row) => sum + row.tokens.length, 0)

    const flatPnlCount = tokenProfitLossData.tokenProfitLosses.length
    const multichainPnlCount = tokenProfitLossData.multichainTokenProfitLoss.reduce(
      (sum, group) =>
        sum + (group.chainBreakdown.length > 0 ? group.chainBreakdown.length : group.aggregated?.token ? 1 : 0),
      0,
    )
    const pnlCount = flatPnlCount + multichainPnlCount
    const coverageRate = portfolioCount > 0 ? Math.min(pnlCount / portfolioCount, 1) : 0

    sendAnalyticsEvent(UniswapEventName.PnlCoverageReport, {
      pnl_token_count: pnlCount,
      portfolio_token_count: portfolioCount,
      coverage_rate: coverageRate,
      multichain_ux_enabled: true,
    })
  }, [tokenData, tokenProfitLossData])

  // Filter tokens by search term at client level (chain filtering is handled at API level)
  const filteredTokenData = useMemo(() => {
    return filterTokensBySearch({ tokens: tokenData || [], searchTerm })
  }, [tokenData, searchTerm])

  const filteredHiddenTokenData = useMemo(() => {
    return filterTokensBySearch({ tokens: hiddenTokenData || [], searchTerm }) || []
  }, [hiddenTokenData, searchTerm])

  // Handler to clear chain filter and show all networks
  const handleShowAllNetworks = useCallback(() => {
    Promise.resolve(navigate('/portfolio/tokens')).catch(() => {})
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
        buttonDataTestId={TestID.PortfolioTokensSeeAllNetworksButton}
        dataTestId={TestID.PortfolioTokensEmptyState}
        onPress={handleShowAllNetworks}
        title={t('tokens.list.noneOnChain.title', { chainName })}
      />
    )
  }, [handleShowAllNetworks, urlChainId, t])

  const hasTokens = (tokenData && tokenData.length > 0) || (hiddenTokenData && hiddenTokenData.length > 0)
  const hasFilteredTokens = (filteredTokenData?.length ?? 0) > 0 || filteredHiddenTokenData.length > 0

  return (
    <RemoveScroll enabled={loading && !refetching}>
      <Trace logImpression page={InterfacePageName.PortfolioTokensPage} properties={{ isExternal: isExternalWallet }}>
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
                part={PortfolioBalancePart.Tokens}
              />
            </Trace>
            <Trace logFocus section={SectionName.PortfolioTokensTab} element={ElementName.PortfolioTokensSearch}>
              <SearchInput
                value={search}
                onChangeText={setSearch}
                dataTestId={TestID.PortfolioTokensSearchInput}
                placeholder={t('tokens.table.search.placeholder.tokens')}
                width={media.md ? '100%' : undefined}
              />
            </Trace>
          </Flex>

          {hasTokens || loading ? (
            <>
              {/* oxlint-disable-next-line typescript/no-unnecessary-condition */}
              {SHOW_TOKEN_ALLOCATION_CHART && (
                <Trace section={SectionName.PortfolioTokensTab} element={ElementName.TokensAllocationChart}>
                  <TokensAllocationChart tokenData={tokenData || []} />
                </Trace>
              )}
              {hasFilteredTokens || loading ? (
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
                <Flex py="$spacing40">
                  <BaseCard.EmptyState
                    icon={<Coin size="$icon.64" color="$neutral3" />}
                    description={t('portfolio.noResults.search.title')}
                    buttonLabel={t('portfolio.noResults.search.clear')}
                    dataTestId={TestID.PortfolioTokensNoResults}
                    onPress={() => setSearch('')}
                  />
                </Flex>
              )}
            </>
          ) : urlChainId ? (
            chainFilterEmptyState
          ) : (
            <TokensListEmptyState
              dataTestId={TestID.PortfolioTokensEmptyState}
              description={isExternalWallet ? t('home.tokens.empty.description') : undefined}
            />
          )}
        </Flex>
      </Trace>
    </RemoveScroll>
  )
})

PortfolioTokens.displayName = 'PortfolioTokens'
