import React, { useState } from 'react'
import styled from 'styled-components'
import { JSBI } from '@uniswap/sdk'
import { withRouter } from 'react-router-dom'

import Question from '../../components/Question'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { RowBetween } from '../../components/Row'
import { ButtonPrimary } from '../../components/Button'
import { GreyCard } from '../../components/Card'
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
        onClick={() => {
          setShowPoolSearch(true)
        }}
      >
        <Text fontSize={20}>Join {filteredExchangeList?.length > 0 ? 'another' : 'a'} pool</Text>
      </ButtonPrimary>
      <Positions>
        <AutoColumn gap="20px">
          {filteredExchangeList?.length !== 0 && (
            <RowBetween padding={'0 8px'}>
              <Text fontWeight={500}>Your Pooled Liquidity</Text>
              <Question text="filler text" />
            </RowBetween>
          )}
          {filteredExchangeList}
          <GreyCard style={{ textAlign: 'center', padding: '0.5rem 1.25rem 1rem 1.25rem' }}>
            <Text color="#AEAEAE">
              {filteredExchangeList?.length !== 0 ? `Don't see a pool you joined? ` : 'Already joined a pool?'}{' '}
              <Link
                onClick={() => {
                  history.push('/find')
                }}
              >
                Import it.
              </Link>
            </Text>
          </GreyCard>
        </AutoColumn>
        <FixedBottom>
          <ColumnCenter>
            <ButtonPrimary width="120px" padding="8px" borderRadius="10px" onClick={() => history.push('/create')}>
              Create Pool
            </ButtonPrimary>
          </ColumnCenter>
        </FixedBottom>
      </Positions>
      <SearchModal isOpen={showPoolSearch} onDismiss={() => setShowPoolSearch(false)} />
    </AutoColumn>
  )
}
export default withRouter(Supply)
