import React, { useState } from 'react'
import styled from 'styled-components'
import { JSBI } from '@uniswap/sdk'
import { withRouter } from 'react-router-dom'

import Card from '../../components/Card'
import Question from '../../components/Question'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import Row, { RowBetween } from '../../components/Row'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { AutoColumn } from '../../components/Column'
import { ArrowRight } from 'react-feather'
import { ButtonPrimary } from '../../components/Button'

import { useWeb3React } from '@web3-react/core'
import { useAllTokens } from '../../contexts/Tokens'
import { useAllExchanges } from '../../contexts/Exchanges'
import { useAllBalances, useAccountLPBalances } from '../../contexts/Balances'

const Positions = styled.div`
  position: relative;
  margin-top: 38px;
`
const FixedBottom = styled.div`
  position: absolute;
  bottom: -260px;
  width: 100%;
`

function Supply({ history }) {
  const { account } = useWeb3React()
  const [showPoolSearch, setShowPoolSearch] = useState(false)

  const allTokens = useAllTokens()
  const allBalances = useAllBalances()
  const allExchanges = useAllExchanges()

  // initiate listener for LP balances
  useAccountLPBalances(account)

  const filteredExchangeList = Object.keys(allExchanges)
    .filter((exchangeAddress, i) => {
      return (
        allBalances &&
        allBalances[account] &&
        allBalances[account][exchangeAddress] &&
        JSBI.greaterThan(allBalances[account][exchangeAddress].raw, JSBI.BigInt(0))
      )
    })
    .map((exchangeAddress, i) => {
      return (
        <PositionCard
          key={i}
          exchangeAddress={exchangeAddress}
          token0={allTokens[allExchanges[exchangeAddress].token0]}
          token1={allTokens[allExchanges[exchangeAddress].token1]}
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
        <Text fontSize={20}>Join a pool</Text>
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
              {filteredExchangeList?.length !== 0 ? `Don't see your ` : 'Already have '} liquidity?{' '}
              <Link
                onClick={() => {
                  history.push('/find')
                }}
              >
                Find it now.
              </Link>
            </Text>
          </AutoColumn>
        </AutoColumn>
        <FixedBottom>
          <Card bg="rgba(255, 255, 255, 0.6)" padding={'24px'}>
            <AutoColumn gap="30px">
              <Text fontSize="20px" fontWeight={500}>
                Earn fees with pooled market making.
              </Text>
              <Text fontSize="12px">
                <Link>Provide liquidity </Link>to earn .3% spread fees for providing market depth.
              </Text>
              <Link>
                <Row>
                  Learn More <ArrowRight size="16" />
                </Row>
              </Link>
            </AutoColumn>
          </Card>
        </FixedBottom>
      </Positions>
      <SearchModal isOpen={showPoolSearch} onDismiss={() => setShowPoolSearch(false)} />
    </>
  )
}
export default withRouter(Supply)
