import React from 'react'
import styled from 'styled-components'
import { withRouter } from 'react-router-dom'
import { Percent, Exchange } from '@uniswap/sdk'

import { useWeb3React } from '@web3-react/core'
import { useAllBalances } from '../../contexts/Balances'
import { useTotalSupply } from '../../contexts/Exchanges'

import Card from '../Card'
import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import { Text } from 'rebass'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../Column'
import { ButtonSecondary } from '../Button'
import { RowBetween, RowFixed } from '../Row'

const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

function PositionCard({ exchangeAddress, token0, token1, history, minimal = false, ...rest }) {
  const { account } = useWeb3React()
  const allBalances = useAllBalances()

  const tokenAmount0 = allBalances?.[exchangeAddress]?.[token0.address]
  const tokenAmount1 = allBalances?.[exchangeAddress]?.[token1.address]

  const exchange = tokenAmount0 && tokenAmount1 && new Exchange(tokenAmount0, tokenAmount1)

  const userPoolBalance = allBalances?.[account]?.[exchangeAddress]
  const totalPoolTokens = useTotalSupply(exchange)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens ? new Percent(userPoolBalance.raw, totalPoolTokens.raw) : undefined

  const token0Deposited =
    token0 &&
    totalPoolTokens &&
    userPoolBalance &&
    exchange.getLiquidityValue(token0, totalPoolTokens, userPoolBalance, false)
  const token1Deposited =
    token1 &&
    totalPoolTokens &&
    userPoolBalance &&
    exchange.getLiquidityValue(token1, totalPoolTokens, userPoolBalance, false)

  function DynamicCard({ children, ...rest }) {
    if (!minimal) {
      return (
        <Card border="1px solid #EDEEF2" {...rest}>
          {children}
        </Card>
      )
    } else {
      return <GreyCard {...rest}>{children}</GreyCard>
    }
  }

  return (
    <DynamicCard {...rest}>
      <AutoColumn gap="20px">
        <FixedHeightRow>
          <RowFixed>
            <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={24} />
            <Text fontWeight={500} fontSize={20}>
              {token0?.symbol}:{token1?.symbol}
            </Text>
          </RowFixed>
          <Text fontWeight={500} fontSize={20}>
            {userPoolBalance ? userPoolBalance.toFixed(6) : '-'}
          </Text>
        </FixedHeightRow>
        <AutoColumn gap="12px">
          <FixedHeightRow>
            <Text color="#888D9B" fontSize={16} fontWeight={500}>
              {token0?.symbol} Deposited:
            </Text>
            {token0Deposited ? (
              <RowFixed>
                <TokenLogo address={token0?.address || ''} />
                <Text color="#888D9B" fontSize={16} fontWeight={500} marginLeft={'6px'}>
                  {token0Deposited?.toFixed(8)}
                </Text>
              </RowFixed>
            ) : (
              '-'
            )}
          </FixedHeightRow>
          <FixedHeightRow>
            <Text color="#888D9B" fontSize={16} fontWeight={500}>
              {token1?.symbol} Deposited:
            </Text>
            {token1Deposited ? (
              <RowFixed>
                <TokenLogo address={token1.address || ''} />
                <Text color="#888D9B" fontSize={16} fontWeight={500} marginLeft={'6px'}>
                  {token1Deposited?.toFixed(8)}
                </Text>
              </RowFixed>
            ) : (
              '-'
            )}
          </FixedHeightRow>
          {!minimal && (
            <FixedHeightRow>
              <Text color="#888D9B" fontSize={16} fontWeight={500}>
                Your pool share:
              </Text>
              <Text color="#888D9B" fontSize={16} fontWeight={500}>
                {poolTokenPercentage ? poolTokenPercentage.toFixed(2) + '%' : '-'}
              </Text>
            </FixedHeightRow>
          )}
        </AutoColumn>
        {!minimal && (
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
                history.push('/remove/' + token0?.address + '-' + token1?.address)
              }}
            >
              Remove
            </ButtonSecondary>
          </RowBetween>
        )}
      </AutoColumn>
    </DynamicCard>
  )
}

export default withRouter(PositionCard)
