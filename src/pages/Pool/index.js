import React, { useState } from 'react'
import styled from 'styled-components'
import { JSBI } from '@uniswap/sdk'
import { withRouter } from 'react-router-dom'

import Question from '../../components/Question'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import { Link, TYPE } from '../../theme'
import { Text } from 'rebass'
import { LightCard } from '../../components/Card'
import { RowBetween } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'

import { useAllPairs } from '../../contexts/Pairs'
import { useWeb3React } from '@web3-react/core'
import { useAllTokens } from '../../contexts/Tokens'
import { useAllBalances, useAccountLPBalances } from '../../contexts/Balances'

const Positions = styled.div`
  position: relative;
  width: 100%;
`

const FixedBottom = styled.div`
  position: absolute;
  bottom: -80px;
  width: 100%;
`

function Supply({ history }) {
  const { account } = useWeb3React()
  const [showPoolSearch, setShowPoolSearch] = useState(false)

  const allTokens = useAllTokens()
  const allBalances = useAllBalances()
  const allPairs = useAllPairs()

  // initiate listener for LP balances
  useAccountLPBalances(account)

  const filteredExchangeList = Object.keys(allPairs)
    .filter((pairAddress, i) => {
      return (
        allBalances &&
        allBalances[account] &&
        allBalances[account][pairAddress] &&
        JSBI.greaterThan(allBalances[account][pairAddress].raw, JSBI.BigInt(0))
      )
    })
    .map((pairAddress, i) => {
      return (
        <PositionCard
          key={i}
          pairAddress={pairAddress}
          token0={allTokens[allPairs[pairAddress].token0]}
          token1={allTokens[allPairs[pairAddress].token1]}
        />
      )
    })

  return (
    <AutoColumn gap="lg" justify="center">
      <ButtonPrimary
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
            <Text fontWeight={500}>Your Pooled Liquidity</Text>
            <Question text="When you add liquidity, you are given pool tokens that represent your share. If you don’t see a pool you joined in this list, try importing a pool below." />
          </RowBetween>
          {filteredExchangeList?.length === 0 && (
            <LightCard
              padding="40px
          "
            >
              <TYPE.body textAlign="center">No liquidity found.</TYPE.body>
            </LightCard>
          )}
          {filteredExchangeList}
          <Text textAlign="center" style={{ padding: '.5rem 0 .5rem 0' }}>
            {filteredExchangeList?.length !== 0 ? `Don't see a pool you joined? ` : 'Already joined a pool? '}{' '}
            <Link
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
