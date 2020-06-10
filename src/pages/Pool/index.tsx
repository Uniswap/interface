import React, { useState, useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { JSBI, Pair, Token } from '@uniswap/sdk'
import { RouteComponentProps } from 'react-router-dom'

import Question from '../../components/QuestionHelper'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import V1PositionCard from '../../components/PositionCard/V1'
import { useAllTokenV1Exchanges } from '../../data/V1'
import { useTokenBalances } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { Text } from 'rebass'
import { LightCard } from '../../components/Card'
import { RowBetween } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import { usePair } from '../../data/Reserves'
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

function PositionCardWrapper({ dummyPair }: { dummyPair: Pair }) {
  const pair = usePair(dummyPair.token0, dummyPair.token1)
  return <PositionCard pair={pair} />
}

export default function Pool({ history }: RouteComponentProps) {
  const theme = useContext(ThemeContext)
  const { account, chainId } = useActiveWeb3React()
  const [showPoolSearch, setShowPoolSearch] = useState(false)

  // get V2 LP balances
  const V2Pairs = useAllDummyPairs()
  const V2PairsBalances = useTokenBalances(
    account,
    V2Pairs?.map(p => p.liquidityToken)
  )
  const V2IsLoading = (Object.keys(V2PairsBalances)?.length ?? 0) < (V2Pairs?.length ?? 0)
  const allV2PairsWithLiquidity = V2Pairs.filter(pair => {
    return (
      V2PairsBalances?.[pair.liquidityToken.address] &&
      JSBI.greaterThan(V2PairsBalances[pair.liquidityToken.address].raw, JSBI.BigInt(0))
    )
  }).map((pair, i) => {
    return <PositionCardWrapper key={i} dummyPair={pair} />
  })

  // get V1 LP balances
  const V1Exchanges = useAllTokenV1Exchanges()
  const V1LiquidityTokens: Token[] = useMemo(() => {
    return Object.keys(V1Exchanges).map(
      exchangeAddress => new Token(chainId, exchangeAddress, 18, 'UNI-V1', 'Uniswap V1')
    )
  }, [chainId, V1Exchanges])
  const V1LiquidityBalances = useTokenBalances(account, V1LiquidityTokens)
  const V1IsLoading = (Object.keys(V1LiquidityBalances)?.length ?? 0) < (V1LiquidityTokens?.length ?? 0)
  const allV1PairsWithLiquidity = V1LiquidityTokens.filter(V1LiquidityToken => {
    return (
      V1LiquidityBalances?.[V1LiquidityToken.address] &&
      JSBI.greaterThan(V1LiquidityBalances[V1LiquidityToken.address].raw, JSBI.BigInt(0))
    )
  }).map(V1LiquidityToken => {
    return (
      <V1PositionCard
        key={V1LiquidityToken.address}
        token={V1Exchanges[V1LiquidityToken.address]}
        V1LiquidityBalance={V1LiquidityBalances[V1LiquidityToken.address]}
      >
        {V1LiquidityToken.address}
      </V1PositionCard>
    )
  })

  const isLoading = V1IsLoading || V2IsLoading

  return (
    <AppBody>
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
                Your Pooled Liquidity
              </Text>
              <Question text="When you add liquidity, you are given pool tokens that represent your share. If you don’t see a pool you joined in this list, try importing a pool below." />
            </RowBetween>

            {!account ? (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </LightCard>
            ) : isLoading ? (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </LightCard>
            ) : allV2PairsWithLiquidity?.length > 0 || allV1PairsWithLiquidity?.length > 0 ? (
              <>
                {allV2PairsWithLiquidity}
                {allV1PairsWithLiquidity}
              </>
            ) : (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </LightCard>
            )}

            <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
              {allV2PairsWithLiquidity?.length !== 0 ? `Don't see a pool you joined? ` : 'Already joined a pool? '}{' '}
              <StyledInternalLink id="import-pool-link" to="/find">
                Import it.
              </StyledInternalLink>
            </Text>
          </AutoColumn>
          <FixedBottom>
            <ColumnCenter>
              <ButtonSecondary width="136px" padding="8px" borderRadius="10px" onClick={() => history.push('/create')}>
                + Create Pool
              </ButtonSecondary>
            </ColumnCenter>
          </FixedBottom>
        </Positions>
        <SearchModal isOpen={showPoolSearch} onDismiss={() => setShowPoolSearch(false)} />
      </AutoColumn>
    </AppBody>
  )
}
