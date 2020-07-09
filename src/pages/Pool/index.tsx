import React, { useState, useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { JSBI } from '@uniswap/sdk'
import { RouteComponentProps } from 'react-router-dom'
import { SwapPoolTabs } from '../../components/NavigationTabs'

import Question from '../../components/QuestionHelper'
import PairSearchModal from '../../components/SearchModal/PairSearchModal'
import PositionCard from '../../components/PositionCard'
import { useUserHasLiquidityInAllTokens } from '../../data/V1'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { Text } from 'rebass'
import { LightCard } from '../../components/Card'
import { RowBetween } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import { usePairs } from '../../data/Reserves'
import { useAllDummyPairs } from '../../state/user/hooks'
import AppBody from '../AppBody'
import { Dots } from '../../components/swap/styleds'

const Positions = styled.div`
  position: relative;
  width: 100%;
`

const FixedBottom = styled.div`
  position: absolute;
  bottom: -80px;
  width: 100%;
`

export default function Pool({ history }: RouteComponentProps) {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()
  const [showPoolSearch, setShowPoolSearch] = useState(false)

  // fetch the user's balances of all tracked V2 LP tokens
  const V2DummyPairs = useAllDummyPairs()
  const [V2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account,
    V2DummyPairs?.map(p => p.liquidityToken)
  )
  // fetch the reserves for all V2 pools in which the user has a balance
  const V2DummyPairsWithABalance = V2DummyPairs.filter(
    V2DummyPair =>
      V2PairsBalances[V2DummyPair.liquidityToken.address] &&
      JSBI.greaterThan(V2PairsBalances[V2DummyPair.liquidityToken.address].raw, JSBI.BigInt(0))
  )
  const V2Pairs = usePairs(
    V2DummyPairsWithABalance.map(V2DummyPairWithABalance => [
      V2DummyPairWithABalance.token0,
      V2DummyPairWithABalance.token1
    ])
  )
  const V2IsLoading =
    fetchingV2PairBalances || V2Pairs?.length < V2DummyPairsWithABalance.length || V2Pairs?.some(V2Pair => !!!V2Pair)

  const allV2PairsWithLiquidity = V2Pairs.filter(V2Pair => !!V2Pair).map(V2Pair => (
    <PositionCard key={V2Pair.liquidityToken.address} pair={V2Pair} />
  ))

  const hasV1Liquidity = useUserHasLiquidityInAllTokens()

  const handleSearchDismiss = useCallback(() => {
    setShowPoolSearch(false)
  }, [setShowPoolSearch])

  return (
    <AppBody>
      <SwapPoolTabs active={'pool'} />
      <AutoColumn gap="lg" justify="center">
        <ButtonPrimary
          id="join-pool-button"
          padding="16px"
          onClick={() => {
            setShowPoolSearch(true)
          }}
        >
          <Text fontWeight={500} fontSize={20}>
            Join {allV2PairsWithLiquidity?.length > 0 ? 'another' : 'a'} pool
          </Text>
        </ButtonPrimary>

        <Positions>
          <AutoColumn gap="12px">
            <RowBetween padding={'0 8px'}>
              <Text color={theme.text1} fontWeight={500}>
                Your Liquidity
              </Text>
              <Question text="When you add liquidity, you are given pool tokens that represent your share. If you don’t see a pool you joined in this list, try importing a pool below." />
            </RowBetween>

            {!account ? (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </LightCard>
            ) : V2IsLoading ? (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </LightCard>
            ) : allV2PairsWithLiquidity?.length > 0 ? (
              <>{allV2PairsWithLiquidity}</>
            ) : (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </LightCard>
            )}

            <div>
              <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
                {hasV1Liquidity ? 'Uniswap V1 liquidity found!' : "Don't see a pool you joined?"}{' '}
                <StyledInternalLink id="import-pool-link" to={hasV1Liquidity ? '/migrate/v1' : '/find'}>
                  {hasV1Liquidity ? 'Migrate now.' : 'Import it.'}
                </StyledInternalLink>
              </Text>
            </div>
          </AutoColumn>
          <FixedBottom>
            <ColumnCenter>
              <ButtonSecondary width="136px" padding="8px" borderRadius="10px" onClick={() => history.push('/create')}>
                + Create Pool
              </ButtonSecondary>
            </ColumnCenter>
          </FixedBottom>
        </Positions>
        <PairSearchModal isOpen={showPoolSearch} onDismiss={handleSearchDismiss} />
      </AutoColumn>
    </AppBody>
  )
}
