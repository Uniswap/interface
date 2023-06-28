import { useCelo } from '@celo/react-celo'
import React, { useContext, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { ThemeContext } from 'styled-components'

import { AutoColumn, TopSection } from '../../components/Column'
import { CardSection, TopBorderCard } from '../../components/earn/styled'
import { RowBetween, RowStart } from '../../components/Row'
import { usePairs } from '../../data/Reserves'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { useUniqueBestFarms, WarningInfo } from '../Earn/useFarmRegistry'

export default function LiquidityWarning() {
  const theme = useContext(ThemeContext)
  const { address: account } = useCelo()

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

  const farmSummaries = useUniqueBestFarms()

  const warnings: WarningInfo[] = useMemo(() => {
    const localWarnings: WarningInfo[] = []
    v2Pairs.forEach(([, pair]) => {
      const lpTokenAddress = pair?.liquidityToken.address
      if (lpTokenAddress && farmSummaries[lpTokenAddress]) {
        const farm = farmSummaries[lpTokenAddress]
        const poolName = `${pair?.token0.symbol}-${pair?.token1.symbol}`
        const link = `/farm/${farm?.token0Address}/${farm?.token1Address}/${farm?.stakingAddress}`
        localWarnings.push({ poolName, link })
      }
    })
    return localWarnings
  }, [v2Pairs, farmSummaries])

  const { t } = useTranslation()

  return (
    <TopSection gap="md">
      {warnings.map((warning) => (
        <TopBorderCard key={warning.link}>
          <CardSection>
            <RowStart>
              <div style={{ paddingRight: 16 }}>
                <AlertTriangle color={theme.yellow2} size={36} />
              </div>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.black fontWeight={600}>
                    <Trans i18nKey="unstakedLPTokens" values={{ poolName: warning.poolName }} />
                  </TYPE.black>
                </RowBetween>
                <RowBetween>
                  <TYPE.black fontSize={14}>
                    <Trans i18nKey="stakeIntoFarmingPool" values={{ poolName: warning.poolName }} />
                  </TYPE.black>
                </RowBetween>
                <StyledInternalLink to={warning.link}>{t('farmUBE')}</StyledInternalLink>
              </AutoColumn>
            </RowStart>
          </CardSection>
        </TopBorderCard>
      ))}
    </TopSection>
  )
}
