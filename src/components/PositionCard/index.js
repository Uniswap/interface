import React, { useState } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { withRouter } from 'react-router-dom'
import { Percent, Pair } from '@uniswap/sdk'

import { useWeb3React } from '@web3-react/core'
import { useAllBalances } from '../../contexts/Balances'
import { useTotalSupply } from '../../contexts/Pairs'

import Card from '../Card'
import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import { Text } from 'rebass'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../Column'
import { ChevronDown, ChevronUp } from 'react-feather'
import { ButtonSecondary } from '../Button'
import { RowBetween, RowFixed } from '../Row'

const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const HoverCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg3};
  :hover {
    cursor: pointer;
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg3)};
  }
`

function PositionCard({ pairAddress, token0, token1, history, minimal = false, ...rest }) {
  const { account } = useWeb3React()
  const allBalances = useAllBalances()

  const [showMore, setShowMore] = useState(false)

  const tokenAmount0 = allBalances?.[pairAddress]?.[token0?.address]
  const tokenAmount1 = allBalances?.[pairAddress]?.[token1?.address]

  const pair = tokenAmount0 && tokenAmount1 && new Pair(tokenAmount0, tokenAmount1)

  const userPoolBalance = allBalances?.[account]?.[pairAddress]
  const totalPoolTokens = useTotalSupply(token0, token1)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens ? new Percent(userPoolBalance.raw, totalPoolTokens.raw) : undefined

  const token0Deposited =
    token0 &&
    totalPoolTokens &&
    userPoolBalance &&
    pair.getLiquidityValue(token0, totalPoolTokens, userPoolBalance, false)
  const token1Deposited =
    token1 &&
    totalPoolTokens &&
    userPoolBalance &&
    pair.getLiquidityValue(token1, totalPoolTokens, userPoolBalance, false)

  if (minimal) {
    return (
      <GreyCard {...rest}>
        <AutoColumn gap="20px">
          <FixedHeightRow>
            <RowFixed>
              <Text fontWeight={500} fontSize={20}>
                Current Position
              </Text>
            </RowFixed>
          </FixedHeightRow>
          <FixedHeightRow onClick={() => setShowMore(!showMore)}>
            <RowFixed>
              <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={24} />
              <Text fontWeight={500} fontSize={20}>
                {token0?.symbol}:{token1?.symbol}
              </Text>
            </RowFixed>
            <RowFixed>
              <Text fontWeight={500} fontSize={20}>
                {userPoolBalance ? userPoolBalance.toFixed(6) : '-'}
              </Text>
            </RowFixed>
          </FixedHeightRow>
          <AutoColumn gap="12px">
            <FixedHeightRow>
              <Text color="#888D9B" fontSize={16} fontWeight={500}>
                {token0?.symbol}:
              </Text>
              {token0Deposited ? (
                <RowFixed>
                  {!minimal && <TokenLogo address={token0?.address || ''} />}
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
                {token1?.symbol}:
              </Text>
              {token1Deposited ? (
                <RowFixed>
                  {!minimal && <TokenLogo address={token1?.address || ''} />}
                  <Text color="#888D9B" fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toFixed(8)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
          </AutoColumn>
        </AutoColumn>
      </GreyCard>
    )
  } else
    return (
      <HoverCard {...rest} onClick={() => setShowMore(!showMore)}>
        <AutoColumn gap="20px">
          <FixedHeightRow>
            <RowFixed>
              <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={24} />
              <Text fontWeight={500} fontSize={20}>
                {token0?.symbol}:{token1?.symbol}
              </Text>
            </RowFixed>
            <RowFixed>
              <Text fontWeight={500} fontSize={20}>
                {userPoolBalance ? userPoolBalance.toFixed(6) : '-'}
              </Text>
              {showMore ? (
                <ChevronUp size="30" style={{ marginLeft: '10px' }} />
              ) : (
                <ChevronDown size="30" style={{ marginLeft: '10px' }} />
              )}
            </RowFixed>
          </FixedHeightRow>
          {showMore && (
            <AutoColumn gap="12px">
              <FixedHeightRow>
                <Text color="#888D9B" fontSize={16} fontWeight={500}>
                  {token0?.symbol}:
                </Text>
                {token0Deposited ? (
                  <RowFixed>
                    {!minimal && <TokenLogo address={token0?.address || ''} />}
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
                  {token1?.symbol}:
                </Text>
                {token1Deposited ? (
                  <RowFixed>
                    {!minimal && <TokenLogo address={token1?.address || ''} />}
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
          )}
          {showMore && (
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
      </HoverCard>
    )
}

export default withRouter(PositionCard)
