import { InterfacePageName } from '@uniswap/analytics-events'
import ChartSection from 'components/Pools/PoolDetails/ChartSection'
import { PoolDetailsBreadcrumb, PoolDetailsHeader } from 'components/Pools/PoolDetails/PoolDetailsHeader'
import { PoolDetailsLink } from 'components/Pools/PoolDetails/PoolDetailsLink'
import { PoolDetailsStats } from 'components/Pools/PoolDetails/PoolDetailsStats'
import { PoolDetailsStatsButtons } from 'components/Pools/PoolDetails/PoolDetailsStatsButtons'
import { PoolDetailsTableTab } from 'components/Pools/PoolDetails/PoolDetailsTable'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useChainFromUrlParam } from 'constants/chains'
import { PoolData, usePoolData } from 'graphql/data/pools/usePoolData'
import { getSupportedGraphQlChain, gqlToCurrency, unwrapToken } from 'graphql/data/util'
import { useColor } from 'hooks/useColor'
import styled, { useTheme } from 'lib/styled-components'
import NotFound from 'pages/NotFound'
import { getPoolDetailPageTitle } from 'pages/PoolDetails/utils'
import { useDynamicMetatags } from 'pages/metatags'
import { useMemo, useReducer } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { BREAKPOINTS, ThemeProvider } from 'theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Trans } from 'uniswap/src/i18n'
import { isAddress } from 'utilities/src/addresses'

const PageWrapper = styled(Row)`
  padding: 0 16px 52px;
  justify-content: center;
  width: 100%;
  gap: 40px;
  align-items: flex-start;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    padding: 48px 20px;
  }
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    flex-direction: column;
    align-items: center;
    gap: 0px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.xl}px) {
    gap: 60px;
  }
`

const LeftColumn = styled(Column)`
  gap: 40px;
  max-width: 780px;
  overflow: hidden;
  justify-content: flex-start;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    width: 100%;
    max-width: unset;
  }
`

const HR = styled.hr`
  border: 0.5px solid ${({ theme }) => theme.surface3};
  width: 100%;
`

const RightColumn = styled(Column)`
  gap: 24px;
  width: 360px;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    margin: 44px 0px;
    width: 100%;
    min-width: unset;
    & > *:first-child {
      margin-top: -24px;
    }
  }
`

const TokenDetailsWrapper = styled(Column)`
  gap: 24px;
  padding: 20px;

  @media (max-width: ${BREAKPOINTS.lg}px) and (min-width: ${BREAKPOINTS.sm}px) {
    flex-direction: row;
    flex-wrap: wrap;
    padding: unset;
  }

  @media (max-width: ${BREAKPOINTS.sm}px) {
    padding: unset;
  }
`

const TokenDetailsHeader = styled(Text)`
  width: 100%;
  font-size: 24px;
  font-weight: 485;
  line-height: 32px;
`

const LinksContainer = styled(Column)`
  gap: 16px;
  width: 100%;
`

function getUnwrappedPoolToken(poolData?: PoolData, chainId?: number) {
  return poolData?.token0 && poolData?.token1 && chainId
    ? [unwrapToken(chainId, poolData?.token0), unwrapToken(chainId, poolData?.token1)]
    : [undefined, undefined]
}

export default function PoolDetailsPage() {
  const { poolAddress } = useParams<{ poolAddress: string }>()
  const chainInfo = getSupportedGraphQlChain(useChainFromUrlParam())
  const { data: poolData, loading } = usePoolData(poolAddress?.toLowerCase() ?? '', chainInfo?.id)
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)
  const unwrappedTokens = getUnwrappedPoolToken(poolData, chainInfo?.id)
  const [token0, token1] = isReversed ? [unwrappedTokens?.[1], unwrappedTokens?.[0]] : unwrappedTokens

  const { darkMode, surface2, accent1 } = useTheme()
  const color0 = useColor(token0 && gqlToCurrency(token0), {
    backgroundColor: surface2,
    darkMode,
  })
  const color1 = useColor(token1 && gqlToCurrency(token1), {
    backgroundColor: surface2,
    darkMode,
  })

  const isInvalidPool = !poolAddress || !chainInfo || !isAddress(poolAddress)
  const poolNotFound = (!loading && !poolData) || isInvalidPool

  const metatagProperties = useMemo(() => {
    const token0Symbol = poolData?.token0.symbol
    const token1Symbol = poolData?.token1.symbol
    const poolName = `${token0Symbol}/${token1Symbol}`
    const chainName = chainInfo?.label ?? 'Ethereum'
    return {
      title: poolName,
      url: window.location.href,
      description: `Swap ${poolName} on ${chainName}. Trade tokens and provide liquidity. Real-time prices, charts, transaction data, and more.`,
    }
  }, [chainInfo?.label, poolData?.token0.symbol, poolData?.token1.symbol])
  const metatags = useDynamicMetatags(metatagProperties)

  if (poolNotFound) {
    return <NotFound />
  }
  return (
    <ThemeProvider token0={color0 !== accent1 ? color0 : undefined} token1={color1 !== accent1 ? color1 : undefined}>
      <Helmet>
        <title>{getPoolDetailPageTitle(poolData)}</title>
        {metatags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
      </Helmet>
      <Trace
        logImpression={!loading}
        page={InterfacePageName.POOL_DETAILS_PAGE}
        properties={{
          poolAddress,
          chainId: chainInfo?.id,
          feeTier: poolData?.feeTier,
          token0Address: poolData?.token0.address,
          token1Address: poolData?.token1.address,
          token0Symbol: poolData?.token0.symbol,
          token1Symbol: poolData?.token1.symbol,
          token0Name: poolData?.token0.name,
          token1Name: poolData?.token1.name,
        }}
      >
        <PageWrapper>
          <LeftColumn>
            <Column gap="20px">
              <Column>
                <PoolDetailsBreadcrumb
                  chainId={chainInfo?.id}
                  poolAddress={poolAddress}
                  token0={token0}
                  token1={token1}
                  loading={loading}
                />
                <PoolDetailsHeader
                  chainId={chainInfo?.id}
                  poolAddress={poolAddress}
                  token0={token0}
                  token1={token1}
                  feeTier={poolData?.feeTier}
                  protocolVersion={poolData?.protocolVersion}
                  toggleReversed={toggleReversed}
                  loading={loading}
                />
              </Column>
              <ChartSection
                poolData={poolData}
                loading={loading}
                isReversed={isReversed}
                chain={chainInfo?.backendChain.chain}
              />
            </Column>
            <HR />
            <PoolDetailsTableTab
              poolAddress={poolAddress}
              token0={token0}
              token1={token1}
              protocolVersion={poolData?.protocolVersion}
            />
          </LeftColumn>
          <RightColumn>
            <PoolDetailsStatsButtons
              chainId={chainInfo?.id}
              token0={token0}
              token1={token1}
              feeTier={poolData?.feeTier}
              loading={loading}
            />
            <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainInfo?.id} loading={loading} />
            <TokenDetailsWrapper>
              <TokenDetailsHeader>
                <Trans i18nKey="common.links" />
              </TokenDetailsHeader>
              <LinksContainer>
                <PoolDetailsLink
                  address={poolAddress}
                  chainId={chainInfo?.id}
                  tokens={[token0, token1]}
                  loading={loading}
                />
                <PoolDetailsLink
                  address={token0?.address}
                  chainId={chainInfo?.id}
                  tokens={[token0]}
                  loading={loading}
                />
                <PoolDetailsLink
                  address={token1?.address}
                  chainId={chainInfo?.id}
                  tokens={[token1]}
                  loading={loading}
                />
              </LinksContainer>
            </TokenDetailsWrapper>
          </RightColumn>
        </PageWrapper>
      </Trace>
    </ThemeProvider>
  )
}
