import React, { useState } from 'react'
import styled from 'styled-components'
import { JSBI } from '@uniswap/sdk'
import { withRouter } from 'react-router-dom'

import Question from '../../components/Question'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { AutoColumn } from '../../components/Column'
import { RowBetween } from '../../components/Row'
import { ButtonPrimary } from '../../components/Button'

import { useAllPairs } from '../../contexts/Pairs'
import { useWeb3React } from '@web3-react/core'
import { useAllTokens } from '../../contexts/Tokens'
import { useAllBalances, useAccountLPBalances } from '../../contexts/Balances'

const Positions = styled.div`
  position: relative;
  margin-top: 38px;
`

function Supply({ history }) {
  const { account } = useWeb3React()
  const [showPoolSearch, setShowPoolSearch] = useState(false)

  const allTokens = useAllTokens()
  const allBalances = useAllBalances()
  const allPairs = useAllPairs()

  // initiate listener for LP balances
  useAccountLPBalances(account)

  // console.log(allPairs)

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
    <>
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
            <RowBetween>
              <Text fontWeight={500}>Your Pooled Liquidity</Text>
              <Question text="filler text" />
            </RowBetween>
          )}
          {filteredExchangeList}
          <AutoColumn justify="center">
            <Text color="#AEAEAE">
              {filteredExchangeList?.length !== 0 ? `Don't see a pool you joined? ` : 'Already joined a pool?'}{' '}
              <Link
                onClick={() => {
                  history.push('/find')
                }}
              >
                Find it.
              </Link>
            </Text>
          </AutoColumn>
        </AutoColumn>
      </Positions>
      <SearchModal isOpen={showPoolSearch} onDismiss={() => setShowPoolSearch(false)} />
    </>
  )
}
export default withRouter(Supply)
