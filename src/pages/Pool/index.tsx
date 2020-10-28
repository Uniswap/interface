import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Pair } from 'dxswap-sdk'
import { Link } from 'react-router-dom'
import { SwapPoolTabs } from '../../components/NavigationTabs'

import FullPositionCard from '../../components/PositionCard'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { LightCard } from '../../components/Card'
import { TYPE, HideSmall } from '../../theme'
import { Text } from 'rebass'
import { RowBetween, RowFixed } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import { usePairs } from '../../data/Reserves'
import { toDXSwapLiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { Dots } from '../../components/swap/styleds'
import { CardSection } from '../../components/earn/styled'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const VoteCard = styled.div`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.text4};
  border-radius: 8px;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  border-radius: 16px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked DXSwap LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()

  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map(tokens => ({ liquidityToken: toDXSwapLiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens
  ])
  const [dxSwapPairsBalances, fetchingDXSwapPairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all DXSwap pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        dxSwapPairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, dxSwapPairsBalances]
  )

  const dxSwapPairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))

  const allDXSwapPairsWithLiquidity = dxSwapPairs
    .map(([, pair]) => pair)
    .filter((dxSwapPair): dxSwapPair is Pair => Boolean(dxSwapPair))
  
  const dxSwapIsLoading =
  fetchingDXSwapPairBalances ||
  trackedTokenPairs.length === 0 ||
  dxSwapPairs?.length < liquidityTokensWithBalances.length ||
  dxSwapPairs?.some(DXSwapPair => !DXSwapPair)
  
  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />

        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  Your liquidity
                </TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <ResponsiveButtonSecondary as={Link} padding="6px 10px" to="/create">
                  <Text fontWeight={500} fontSize={12}>
                    CREATE PAIR
                  </Text>
                </ResponsiveButtonSecondary>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} padding="6px 10px" to="/add/ETH">
                  <Text fontWeight={500} fontSize={12}>
                    ADD LIQUIDITY
                  </Text>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            {!account ? (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </LightCard>
            ) : dxSwapIsLoading ? (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </LightCard>
            ) : allDXSwapPairsWithLiquidity?.length > 0 ? (
              <>
                {allDXSwapPairsWithLiquidity.map(dxSwapPair => (
                  <FullPositionCard key={dxSwapPair.liquidityToken.address} pair={dxSwapPair} />
                ))}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                No liquidity found
                </TYPE.body>
              </EmptyProposals>
            )}
          </AutoColumn>
        </AutoColumn>
        
        <VoteCard style={{ marginTop: '1rem' }} >
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.main fontWeight={600}>Liquidity provider rewards</TYPE.main>
              </RowBetween>
              <RowBetween>
                <TYPE.main fontSize={14}>
                  Liquidity providers earn a swap fee (0.15% by default) on all trades proportional to their share of the pool.<br/> Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.<br/> The swap fee value is decided by DXdao and liquidty providers, it can be between 0% and 10% and it uses 0.15% as default value that is assigned when the pair is created.
                </TYPE.main>
              </RowBetween>
            </AutoColumn>
          </CardSection>
        </VoteCard>
        
      </PageWrapper>
    </>
  )
}
