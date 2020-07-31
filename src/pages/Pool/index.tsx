import React, { useState, useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { JSBI } from 'dxswap-sdk'
import { RouteComponentProps } from 'react-router-dom'

import Question from '../../components/QuestionHelper'
import PairSearchModal from '../../components/SearchModal/PairSearchModal'
import PositionCard from '../../components/PositionCard'
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

  // fetch the user's balances of all tracked DXswap LP tokens
  const DXswapDummyPairs = useAllDummyPairs()
  const [DXswapPairsBalances, fetchingDXswapPairBalances] = useTokenBalancesWithLoadingIndicator(
    account,
    DXswapDummyPairs?.map(p => p.liquidityToken)
  )
  // fetch the reserves for all DXswap pools in which the user has a balance
  const DXswapDummyPairsWithABalance = DXswapDummyPairs.filter(
    DXswapDummyPair =>
      DXswapPairsBalances[DXswapDummyPair.liquidityToken.address] &&
      JSBI.greaterThan(DXswapPairsBalances[DXswapDummyPair.liquidityToken.address].raw, JSBI.BigInt(0))
  )
  const DXswapPairs = usePairs(
    DXswapDummyPairsWithABalance.map(DXswapDummyPairWithABalance => [
      DXswapDummyPairWithABalance.token0,
      DXswapDummyPairWithABalance.token1
    ])
  )
  const DXswapIsLoading =
    fetchingDXswapPairBalances || DXswapPairs?.length < DXswapDummyPairsWithABalance.length || DXswapPairs?.some(DXswapPair => !!!DXswapPair)

  const allDXswapPairsWithLiquidity = DXswapPairs.filter(DXswapPair => !!DXswapPair).map(DXswapPair => (
    <PositionCard key={DXswapPair.liquidityToken.address} pair={DXswapPair} />
  ))

  const handleSearchDismiss = useCallback(() => {
    setShowPoolSearch(false)
  }, [setShowPoolSearch])

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
            Join {allDXswapPairsWithLiquidity?.length > 0 ? 'another' : 'a'} pool
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
            ) : DXswapIsLoading ? (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </LightCard>
            ) : allDXswapPairsWithLiquidity?.length > 0 ? (
              <>{allDXswapPairsWithLiquidity}</>
            ) : (
              <LightCard padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </LightCard>
            )}

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
