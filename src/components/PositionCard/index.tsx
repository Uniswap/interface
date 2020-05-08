import React, { useState } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Percent, Pair, Token } from '@uniswap/sdk'

import { useWeb3React } from '@web3-react/core'
import { useAllBalances } from '../../contexts/Balances'
import { useTotalSupply } from '../../contexts/Pairs'

import Card from '../Card'
import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import { Text } from 'rebass'
import { Link } from '../../theme/components'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../Column'
import { ChevronDown, ChevronUp } from 'react-feather'
import { ButtonSecondary } from '../Button'
import { RowBetween, RowFixed, AutoRow } from '../Row'

const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const HoverCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg3};
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg3)};
  }
`

interface PositionCardProps extends RouteComponentProps<{}> {
  pairAddress: string;
  token0: Token
  token1: Token
  minimal?: boolean
  border?: string
}

function PositionCard({ pairAddress, token0, token1, history, border, minimal = false }: PositionCardProps) {
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
    pair &&
    totalPoolTokens &&
    pair.liquidityToken.equals(totalPoolTokens.token) &&
    pair.getLiquidityValue(token0, totalPoolTokens, userPoolBalance, false)
  const token1Deposited =
    token1 &&
    totalPoolTokens &&
    userPoolBalance &&
    totalPoolTokens &&
    pair.liquidityToken.equals(totalPoolTokens.token) &&
    pair.getLiquidityValue(token1, totalPoolTokens, userPoolBalance, false)

  if (minimal) {
    return (
      <>
        {userPoolBalance && userPoolBalance.toFixed(6) > 0 && (
          <GreyCard border={border}>
            <AutoColumn gap="12px">
              <FixedHeightRow>
                <RowFixed>
                  <Text fontWeight={500} fontSize={16}>
                    Your current position
                  </Text>
                </RowFixed>
              </FixedHeightRow>
              <FixedHeightRow onClick={() => setShowMore(!showMore)}>
                <RowFixed>
                  <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={20}/>
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
              <AutoColumn gap="4px">
                <FixedHeightRow>
                  <Text color="#888D9B" fontSize={16} fontWeight={500}>
                    {token0?.symbol}:
                  </Text>
                  {token0Deposited ? (
                    <RowFixed>
                      {!minimal && <TokenLogo address={token0?.address || ''}/>}
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
                      {!minimal && <TokenLogo address={token1?.address || ''}/>}
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
        )}
      </>
    )
  } else
    return (
      <HoverCard border={border}>
        <AutoColumn gap="12px">
          <FixedHeightRow onClick={() => setShowMore(!showMore)} style={{ cursor: 'pointer' }}>
            <RowFixed>
              <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={20}/>
              <Text fontWeight={500} fontSize={20}>
                {token0?.symbol}:{token1?.symbol}
              </Text>
            </RowFixed>
            <RowFixed>
              {showMore ? (
                <ChevronUp size="20" style={{ marginLeft: '10px' }}/>
              ) : (
                <ChevronDown size="20" style={{ marginLeft: '10px' }}/>
              )}
            </RowFixed>
          </FixedHeightRow>
          {showMore && (
            <AutoColumn gap="8px">
              <FixedHeightRow>
                <RowFixed>
                  <Text fontSize={16} fontWeight={500}>
                    Pooled {token0?.symbol}:
                  </Text>
                </RowFixed>
                {token0Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                      {token0Deposited?.toFixed(8)}
                    </Text>
                    {!minimal && (
                      <TokenLogo size="20px" style={{ marginLeft: '8px' }} address={token0?.address || ''}/>
                    )}
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>

              <FixedHeightRow>
                <RowFixed>
                  <Text fontSize={16} fontWeight={500}>
                    Pooled {token1?.symbol}:
                  </Text>
                </RowFixed>
                {token1Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                      {token1Deposited?.toFixed(8)}
                    </Text>
                    {!minimal && (
                      <TokenLogo size="20px" style={{ marginLeft: '8px' }} address={token1?.address || ''}/>
                    )}
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              {!minimal && (
                <FixedHeightRow>
                  <Text fontSize={16} fontWeight={500}>
                    Your pool tokens:
                  </Text>
                  <Text fontSize={16} fontWeight={500}>
                    {userPoolBalance ? userPoolBalance.toFixed(6) : '-'}
                  </Text>
                </FixedHeightRow>
              )}
              {!minimal && (
                <FixedHeightRow>
                  <Text fontSize={16} fontWeight={500}>
                    Your pool share
                  </Text>
                  <Text fontSize={16} fontWeight={500}>
                    {poolTokenPercentage ? poolTokenPercentage.toFixed(2) + '%' : '-'}
                  </Text>
                </FixedHeightRow>
              )}

              <AutoRow justify="center" marginTop={'10px'}>
                <Link>View pool information ↗</Link>
              </AutoRow>
              <RowBetween marginTop="10px">
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
            </AutoColumn>
          )}
        </AutoColumn>
      </HoverCard>
    )
}

export default withRouter(PositionCard)
