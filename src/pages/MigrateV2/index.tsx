import React, { useContext, useMemo } from 'react'
import { Pair } from '@uniswap/v2-sdk'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { BackArrow, StyledInternalLink, TYPE } from '../../theme'
import { LightCard } from '../../components/Card'
import { BodyWrapper } from '../AppBody'
import QuestionHelper from '../../components/QuestionHelper'
import { Dots } from '../../components/swap/styleds'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import MigrateV2PositionCard from 'components/PositionCard/V2'
import { useV2Pairs } from 'hooks/useV2Pairs'

// TODO there's a bug in loading where "No V2 Liquidity found" flashes
// TODO add support for more pairs
function EmptyState({ message }: { message: string }) {
  return (
    <AutoColumn style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center' }}>
      <TYPE.body>{message}</TYPE.body>
    </AutoColumn>
  )
}

export default function MigrateV2() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens,
  ])
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = useV2Pairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)
  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  return (
    <BodyWrapper style={{ padding: 24 }}>
      <AutoColumn gap="16px">
        <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
          <BackArrow to="/pool" />
          <TYPE.mediumHeader>Migrate V2 Liquidity</TYPE.mediumHeader>
          <div>
            <QuestionHelper text="Migrate your liquidity tokens from Uniswap V2 to Uniswap V3." />
          </div>
        </AutoRow>

        <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
          For each pool shown below, click migrate to remove your liquidity from Uniswap V2 and deposit it into Uniswap
          V3.
        </TYPE.body>

        {!account ? (
          <LightCard padding="40px">
            <TYPE.body color={theme.text3} textAlign="center">
              Connect to a wallet to view your V2 liquidity.
            </TYPE.body>
          </LightCard>
        ) : v2IsLoading ? (
          <LightCard padding="40px">
            <TYPE.body color={theme.text3} textAlign="center">
              <Dots>Loading</Dots>
            </TYPE.body>
          </LightCard>
        ) : allV2PairsWithLiquidity?.length > 0 ? (
          <>
            {allV2PairsWithLiquidity.map((pair) => (
              <MigrateV2PositionCard key={pair.liquidityToken.address} pair={pair} />
            ))}
          </>
        ) : (
          <EmptyState message="No V2 Liquidity found." />
        )}

        <AutoColumn justify={'center'} gap="md">
          <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
            {"Don't see a pool you joined?"}{' '}
            <StyledInternalLink id="import-pool-link" to={'/find?origin=/migrate/v2'}>
              {'Import it.'}
            </StyledInternalLink>
          </Text>
        </AutoColumn>
      </AutoColumn>
    </BodyWrapper>
  )
}
