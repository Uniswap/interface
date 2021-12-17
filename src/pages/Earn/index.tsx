import { useContractKit } from '@celo-tools/use-contractkit'
import { ErrorBoundary } from '@sentry/react'
import { Token } from '@ubeswap/sdk'
import ChangeNetworkModal from 'components/ChangeNetworkModal'
import TokenSelect from 'components/CurrencyInputPanel/TokenSelect'
import Loader from 'components/Loader'
import { useIsSupportedNetwork } from 'hooks/useIsSupportedNetwork'
import React, { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOwnerStakedPools } from 'state/stake/useOwnerStakedPools'
import styled, { ThemeContext } from 'styled-components'

import { AutoColumn, ColumnCenter, TopSection } from '../../components/Column'
import { PoolCard } from '../../components/earn/PoolCard'
import { CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween } from '../../components/Row'
import { usePairs } from '../../data/Reserves'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { ExternalLink, TYPE } from '../../theme'
import LiquidityWarning from '../Pool/LiquidityWarning'
import { useFarmRegistry, WarningInfo } from './useFarmRegistry'

const PageWrapper = styled.div`
  width: 100%;
  max-width: 640px;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

const PoolWrapper = styled.div`
  margin-bottom: 12px;
`

const Header: React.FC = ({ children }) => {
  return (
    <DataRow style={{ alignItems: 'baseline', marginBottom: '12px' }}>
      <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>{children}</TYPE.mediumHeader>
    </DataRow>
  )
}

function useTokenFilter(): [Token | null, (t: Token | null) => void] {
  const [token, setToken] = useState<Token | null>(null)
  return [token, setToken]
}

export default function Earn() {
  const { t } = useTranslation()
  const isSupportedNetwork = useIsSupportedNetwork()
  const [filteringToken, setFilteringToken] = useTokenFilter()
  const farmSummaries = useFarmRegistry()

  const filteredFarms = useMemo(() => {
    if (filteringToken === null) {
      return farmSummaries
    } else {
      return farmSummaries.filter(
        (farm) => farm?.token0Address === filteringToken?.address || farm?.token1Address === filteringToken?.address
      )
    }
  }, [filteringToken, farmSummaries])

  const { stakedFarms, unstakedFarms } = useOwnerStakedPools(filteredFarms)
  const { address: account } = useContractKit()
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  )
  const [v2PairsBalances] = useTokenBalancesWithLoadingIndicator(account ?? undefined, liquidityTokens)
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens
        .filter(({ liquidityToken }) => v2PairsBalances[liquidityToken.address]?.greaterThan('0'))
        .map(({ tokens }) => tokens),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )
  const v2Pairs = usePairs(liquidityTokensWithBalances)

  const warnings: WarningInfo[] = useMemo(() => {
    const localWarnings: WarningInfo[] = []
    v2Pairs.forEach(([, pair]) => {
      const token0 = pair?.token0.symbol
      const token1 = pair?.token1.symbol
      const poolName = token0 + '-' + token1
      const unstakedFarm = unstakedFarms.find((farm) => farm.farmName === poolName)
      const stakedFarm = stakedFarms.find((farm) => farm.farmName === poolName)
      if (unstakedFarm && !stakedFarm) {
        const url = `/farm/${unstakedFarm?.token0Address}/${unstakedFarm?.token1Address}/${unstakedFarm?.stakingAddress}`
        localWarnings.push({ poolName: poolName, link: url })
      }
    })
    return localWarnings
  }, [v2Pairs, unstakedFarms, stakedFarms])

  const theme = useContext(ThemeContext)

  if (!isSupportedNetwork) {
    return <ChangeNetworkModal />
  }

  return (
    <PageWrapper>
      <LiquidityWarning />
      {stakedFarms.length === 0 && (
        <TopSection gap="md">
          <DataCard>
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Ubeswap {t('liquidityMining')}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white fontSize={14}>{t('liquidityMiningDesc')}</TYPE.white>
                </RowBetween>{' '}
                <ExternalLink
                  style={{ color: 'white', textDecoration: 'underline' }}
                  href="https://docs.ubeswap.org/faq"
                  target="_blank"
                >
                  <TYPE.white fontSize={14}>{t('liquidityMiningReadMore')}</TYPE.white>
                </ExternalLink>
              </AutoColumn>
            </CardSection>
            <CardNoise />
          </DataCard>
        </TopSection>
      )}
      <TopSection gap="md">
        <AutoColumn>
          <TokenSelect onTokenSelect={setFilteringToken} token={filteringToken} />
        </AutoColumn>
      </TopSection>
      <ColumnCenter>
        {farmSummaries.length > 0 && filteredFarms.length == 0 && `No Farms for ${filteringToken?.symbol}`}
        {farmSummaries.length === 0 && <Loader size="48px" />}
      </ColumnCenter>
      {stakedFarms.length > 0 && (
        <>
          <Header>{t('yourPools')}</Header>
          {stakedFarms.map((farmSummary) => (
            <PoolWrapper key={farmSummary.stakingAddress}>
              <ErrorBoundary>
                <PoolCard farmSummary={farmSummary} />
              </ErrorBoundary>
            </PoolWrapper>
          ))}
        </>
      )}
      {unstakedFarms.length > 0 && (
        <>
          <Header>{t('availablePools')}</Header>
          {unstakedFarms.map((farmSummary) => (
            <PoolWrapper key={farmSummary.stakingAddress}>
              <ErrorBoundary>
                <PoolCard farmSummary={farmSummary} />
              </ErrorBoundary>
            </PoolWrapper>
          ))}
        </>
      )}
    </PageWrapper>
  )
}
