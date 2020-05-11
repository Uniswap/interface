import React, { useState, useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { JSBI, Pair } from '@uniswap/sdk'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import Question from '../../components/Question'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import { Link, TYPE } from '../../theme'
import { Text } from 'rebass'
import { LightCard } from '../../components/Card'
import { RowBetween } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'

import { useWeb3React } from '@web3-react/core'
import { useAllBalances, useAccountLPBalances } from '../../contexts/Balances'
import { usePair } from '../../data/Reserves'
import { useAllDummyPairs } from '../../contexts/LocalStorage'

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

function Supply({ history }: RouteComponentProps) {
  const theme = useContext(ThemeContext)
  const { account } = useWeb3React()
  const [showPoolSearch, setShowPoolSearch] = useState(false)

  // initiate listener for LP balances
  const allBalances = useAllBalances()
  useAccountLPBalances(account)

  const pairs = useAllDummyPairs()

  const filteredExchangeList = pairs
    .filter(pair => {
      return (
        allBalances &&
        allBalances[account] &&
        allBalances[account][pair.liquidityToken.address] &&
        JSBI.greaterThan(allBalances[account][pair.liquidityToken.address].raw, JSBI.BigInt(0))
      )
    })
    .map((pair, i) => {
      return <PositionCardWrapper key={i} dummyPair={pair} />
    })

  return (
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
            {filteredExchangeList?.length !== 0 ? `Don't see a pool you joined? ` : 'Already joined a pool? '}{' '}
            <Link
              id="import-pool-link"
              onClick={() => {
                history.push('/find')
              }}
            >
              Import it.
            </Link>
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
  )
}
export default withRouter(Supply)
