import React, { useState } from 'react'
import styled from 'styled-components'
import { JSBI } from '@uniswap/sdk'

import { useWeb3React } from '@web3-react/core'
import { useAllTokens } from '../../contexts/Tokens'
import { useAllExchanges } from '../../contexts/Exchanges'
import { useAllBalances, useAccountLPBalances } from '../../contexts/Balances'

import Card from '../../components/Card'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import Row, { RowBetween } from '../../components/Row'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { AutoColumn } from '../../components/Column'
import { ArrowRight } from 'react-feather'
import { ButtonDropwdown } from '../../components/Button'

const Positions = styled.div`
  position: relative;
  margin-top: 38px;
`
const FixedBottom = styled.div`
  position: absolute;
  bottom: -240px;
  width: 100%;
`

export default function Supply() {
  const { account } = useWeb3React()
  const [showSearch, setShowSearch] = useState(false)

  const allTokens = useAllTokens()
  const allBalances = useAllBalances()
  const allExchanges = useAllExchanges()

  // initiate listener for LP balances
  useAccountLPBalances(account)

  const filteredExchangeList = Object.keys(allExchanges).map((exchangeAddress, i) => {
    const balance = allBalances?.[account]?.[exchangeAddress]
    return (
      balance &&
      JSBI.greaterThan(balance.raw, JSBI.BigInt(0)) && (
        <PositionCard
          key={i}
          exchangeAddress={exchangeAddress}
          token0={allTokens[allExchanges[exchangeAddress].token0]}
          token1={allTokens[allExchanges[exchangeAddress].token1]}
        />
      )
    )
  })

  return (
    <>
      <ButtonDropwdown
        onClick={() => {
          setShowSearch(true)
        }}
      >
        <Text fontSize={20}>Find a pool</Text>
      </ButtonDropwdown>
      <Positions>
        <AutoColumn gap="20px">
          <RowBetween>
            <Text fontWeight={500}>Your positions</Text>
            <Link>
              <Text fontWeight={500}>View on Uniswap.info</Text>
            </Link>
          </RowBetween>
          {filteredExchangeList}
        </AutoColumn>
        <FixedBottom>
          <Card bg="rgba(255, 255, 255, 0.6)" padding={'24px'}>
            <AutoColumn gap="30px">
              <Text fontSize="20px" fontWeight={500}>
                Earn fees with pooled market making.
              </Text>
              <Text fontSize="12px">
                <Link>Provide liquidity </Link>to earn .03% spread fees for providing market depth.
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
      <SearchModal
        isOpen={showSearch}
        onDismiss={() => {
          setShowSearch(false)
        }}
      />
    </>
  )
}
