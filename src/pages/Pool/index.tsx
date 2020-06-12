import React, { useState, useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { JSBI, Pair } from '@uniswap/sdk'
import { RouteComponentProps } from 'react-router-dom'

import Question from '../../components/QuestionHelper'
import PairSearchModal from '../../components/SearchModal/PairSearchModal'
import PositionCard from '../../components/PositionCard'
import { useUserHasLiquidityInAllTokens } from '../../data/V1'
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
  const { account } = useActiveWeb3React()
  const [showPoolSearch, setShowPoolSearch] = useState(false)

  // initiate listener for LP balances
  const pairs = useAllDummyPairs()
  const pairBalances = useTokenBalances(
    account,
    pairs?.map(p => p.liquidityToken)
  )

  const filteredExchangeList = pairs
    .filter(pair => {
      return (
        pairBalances?.[pair.liquidityToken.address] &&
        JSBI.greaterThan(pairBalances[pair.liquidityToken.address].raw, JSBI.BigInt(0))
      )
    })
    .map((pair, i) => {
      return <PositionCardWrapper key={i} dummyPair={pair} />
    })

  const hasV1Liquidity = useUserHasLiquidityInAllTokens()

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
            Join {filteredExchangeList?.length > 0 ? 'another' : 'a'} pool
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
            {filteredExchangeList?.length === 0 && (
              <LightCard
                padding="40px
          "
              >
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </LightCard>
            )}
            {filteredExchangeList}
            <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
              {!hasV1Liquidity ? (
                <>
                  {filteredExchangeList?.length !== 0 ? `Don't see a pool you joined? ` : 'Already joined a pool? '}{' '}
                  <StyledInternalLink id="import-pool-link" to="/find">
                    Import it.
                  </StyledInternalLink>
                </>
              ) : (
                <StyledInternalLink id="migrate-v1-liquidity-link" to="/migrate/v1">
                  Migrate your V1 liquidity.
                </StyledInternalLink>
              )}
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
        <PairSearchModal isOpen={showPoolSearch} onDismiss={handleSearchDismiss} />
      </AutoColumn>
    </AppBody>
  )
}
