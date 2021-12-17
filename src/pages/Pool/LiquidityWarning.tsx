import { useContractKit } from '@celo-tools/use-contractkit'
import React, { useContext, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import { useOwnerStakedPools } from 'state/stake/useOwnerStakedPools'
import styled, { ThemeContext } from 'styled-components'

import { AutoColumn, TopSection } from '../../components/Column'
import { CardSection } from '../../components/earn/styled'
import { RowBetween, RowStart } from '../../components/Row'
import { usePairs } from '../../data/Reserves'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { useFarmRegistry, WarningInfo } from '../Earn/useFarmRegistry'

export const LiquidityWarningCard = styled(AutoColumn)<{ disabled?: boolean }>`
  background-color: ${(props) => props.theme.bg1};
  border-top: 3px solid ${(props) => props.theme.primary1};
  width: 100%;
  position: relative;
  overflow: hidden;
`

export default function LiquidityWarning() {
  const theme = useContext(ThemeContext)
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

  const farmSummaries = useFarmRegistry()
  const { unstakedFarms } = useOwnerStakedPools(farmSummaries)

  const warnings: WarningInfo[] = useMemo(() => {
    const localWarnings: WarningInfo[] = []
    v2Pairs.forEach(([, pair]) => {
      const token0 = pair?.token0.symbol
      const token1 = pair?.token1.symbol
      const poolName = token0 + '-' + token1
      const unstakedFarm = unstakedFarms.find((farm) => farm.farmName === poolName)
      if (unstakedFarm) {
        const url = `/farm/${unstakedFarm?.token0Address}/${unstakedFarm?.token1Address}/${unstakedFarm?.stakingAddress}`
        localWarnings.push({ poolName: poolName, link: url })
      }
    })
    return localWarnings
  }, [v2Pairs, unstakedFarms])

  return (
    <TopSection gap="md">
      {warnings.map((warning) => (
        <LiquidityWarningCard key={warning.link}>
          <CardSection>
            <RowStart>
              <div style={{ paddingRight: 16 }}>
                <AlertTriangle color={theme.yellow2} size={36} />
              </div>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.black fontWeight={600}>You have unstaked {warning.poolName} LP tokens</TYPE.black>
                </RowBetween>
                <RowBetween>
                  <TYPE.black fontSize={14}>
                    Stake into the {warning.poolName} farming pool to an additional rewards on your LP tokens
                  </TYPE.black>
                </RowBetween>
                <StyledInternalLink to={warning.link}>Farm UBE</StyledInternalLink>
              </AutoColumn>
            </RowStart>
          </CardSection>
        </LiquidityWarningCard>
      ))}
    </TopSection>
  )
}
