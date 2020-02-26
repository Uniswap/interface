import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { TokenAmount, JSBI, Percent, Token } from '@uniswap/sdk'
import ReactGA from 'react-ga'
import { withRouter } from 'react-router-dom'

import { Link } from '../../theme'
import { AutoColumn } from '../../components/Column'
import Row, { RowBetween, RowFixed } from '../../components/Row'
import { ButtonDropwdown, ButtonSecondary } from '../../components/Button'
import Card from '../../components/Card'
import { Text } from 'rebass'
import DoubleLogo from '../../components/DoubleLogo'
import SearchModal from '../../components/SearchModal'
import { ArrowRight } from 'react-feather'

import { useAllExchanges } from '../../contexts/Exchanges'
import { useAllBalances } from '../../contexts/Balances'
import { useWeb3React } from '@web3-react/core'
import { useAllTokens } from '../../contexts/Tokens'
import { useExchangeContract } from '../../hooks'
import TokenLogo from '../../components/TokenLogo'

const Positions = styled.div`
  position: relative;
  margin-top: 38px;
`

const FixedBottom = styled.div`
  position: absolute;
  bottom: -240px;
  width: 100%;
`

function ExchangeCard({ exchangeAddress, token0, token1, history, allBalances }) {
  const { account, chainId } = useWeb3React()

  const userPoolBalance = allBalances?.[account]?.[exchangeAddress]
  const [totalPoolTokens, setTotalPoolTokens] = useState()
  // get the total pool token supply
  const exchangeContract = useExchangeContract(exchangeAddress)
  const fetchPoolTokens = useCallback(() => {
    if (exchangeContract) {
      exchangeContract.totalSupply().then(totalSupply => {
        if (totalSupply !== undefined) {
          const supplyFormatted = JSBI.BigInt(totalSupply)
          const tokenSupplyFormatted = new TokenAmount(new Token(chainId, exchangeAddress, 18), supplyFormatted)
          setTotalPoolTokens(tokenSupplyFormatted)
        }
      })
    }
  }, [exchangeContract, chainId, exchangeAddress])
  useEffect(() => {
    fetchPoolTokens()
  }, [fetchPoolTokens])

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens ? new Percent(userPoolBalance.raw, totalPoolTokens.raw) : undefined

  const token0Deposited = poolTokenPercentage?.multiply(allBalances[exchangeAddress][token0.address])
  const token1Deposited = poolTokenPercentage?.multiply(allBalances[exchangeAddress][token1.address])

  return (
    <Card border="1px solid #EDEEF2">
      <AutoColumn gap="20px">
        <RowBetween>
          <RowFixed>
            <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} />
            <Text fontWeight={500} fontSize={20}>
              {token0?.symbol}:{token1?.symbol}
            </Text>
          </RowFixed>
          <Text fontWeight={500} fontSize={20}>
            {userPoolBalance ? userPoolBalance.toFixed(6) : '-'}
          </Text>
        </RowBetween>
        <AutoColumn gap="12px">
          <RowBetween>
            <Text color="#888D9B" fontSize={16} fontWeight={500}>
              {token0?.symbol} Deposited:
            </Text>
            {token0Deposited ? (
              <RowFixed>
                <TokenLogo address={token0?.address || ''} />
                <Text color="#888D9B" fontSize={16} fontWeight={500}>
                  {token0Deposited?.toSignificant(6)}
                </Text>
              </RowFixed>
            ) : (
              '-'
            )}
          </RowBetween>
          <RowBetween>
            <Text color="#888D9B" fontSize={16} fontWeight={500}>
              {token1?.symbol} Deposited:
            </Text>
            {token1Deposited ? (
              <RowFixed>
                <TokenLogo address={token1.address || ''} />
                <Text color="#888D9B" fontSize={16} fontWeight={500}>
                  {token1Deposited?.toSignificant(6)}
                </Text>
              </RowFixed>
            ) : (
              '-'
            )}
          </RowBetween>
          <RowBetween>
            <Text color="#888D9B" fontSize={16} fontWeight={500}>
              Your pool share:
            </Text>
            <Text color="#888D9B" fontSize={16} fontWeight={500}>
              {poolTokenPercentage ? poolTokenPercentage.toFixed(2) + '%' : '-'}
            </Text>
          </RowBetween>
        </AutoColumn>
        <RowBetween>
          <ButtonSecondary
            width="48%"
            onClick={() => {
              history.push('/add/' + token0?.address + '-' + token1?.address)
            }}
          >
            Add
          </ButtonSecondary>
          <ButtonSecondary
            width="48%"
            onClick={() => {
              history.push('/remove')
            }}
          >
            Remove
          </ButtonSecondary>
        </RowBetween>
      </AutoColumn>
    </Card>
  )
}

function Supply({ history }) {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  const { account } = useWeb3React()

  const [showSearch, toggleSearch] = useState(false)

  const exchanges = useAllExchanges()

  const allTokens = useAllTokens()

  const allBalances = useAllBalances()

  const filteredPairList = Object.keys(exchanges).map((token0Address, i) => {
    return Object.keys(exchanges[token0Address]).map(token1Address => {
      const exchangeAddress = exchanges[token0Address][token1Address]

      /**
       *  we need the users exchnage balance over all exchanges
       *
       * right now we dont
       *
       *  if they go to supplu page, flip switch to look for balances
       *
       *
       *
       */

      // gate on positive address
      if (allBalances?.[account]?.[exchangeAddress]) {
        const token0 = allTokens[token0Address]
        const token1 = allTokens[token1Address]
        return (
          <ExchangeCard
            history={history}
            key={i}
            exchangeAddress={exchangeAddress}
            token0={token0}
            token1={token1}
            allBalances={allBalances}
          />
        )
      }
      return ''
    })
  })

  return (
    <>
      <ButtonDropwdown
        onClick={() => {
          toggleSearch(true)
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
          {filteredPairList}
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
          toggleSearch(false)
        }}
      />
    </>
  )
}

export default withRouter(Supply)
