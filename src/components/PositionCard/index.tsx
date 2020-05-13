import React, { useState } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Percent, Pair } from '@uniswap/sdk'

import { useWeb3React } from '@web3-react/core'
import { useTotalSupply } from '../../data/TotalSupply'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'

import Card, { GreyCard } from '../Card'
import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import { Text } from 'rebass'
import { Link } from '../../theme/components'
import { AutoColumn } from '../Column'
import { ChevronDown, ChevronUp } from 'react-feather'
import { ButtonSecondary } from '../Button'
import { RowBetween, RowFixed, AutoRow } from '../Row'

const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const HoverCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg2};
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`

interface PositionCardProps extends RouteComponentProps<{}> {
  pair: Pair
  minimal?: boolean
  border?: string
}

function PositionCard({ pair, history, border, minimal = false }: PositionCardProps) {
  const { account } = useWeb3React()
  const allBalances = useAllTokenBalancesTreatingWETHasETH()

  const token0 = pair?.token0
  const token1 = pair?.token1

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = allBalances?.[account]?.[pair?.liquidityToken?.address]
  const totalPoolTokens = useTotalSupply(pair?.liquidityToken)

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
        {userPoolBalance && (
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
                  <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={20} />
                  <Text fontWeight={500} fontSize={20}>
                    {token0?.symbol}:{token1?.symbol}
                  </Text>
                </RowFixed>
                <RowFixed>
                  <Text fontWeight={500} fontSize={20}>
                    {userPoolBalance ? userPoolBalance.toSignificant(5) : '-'}
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
                      {!minimal && <TokenLogo address={token0?.address} />}
                      <Text color="#888D9B" fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {token0Deposited?.toSignificant(6)}
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
                      {!minimal && <TokenLogo address={token1?.address} />}
                      <Text color="#888D9B" fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {token1Deposited?.toSignificant(6)}
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
              <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={20} />
              <Text fontWeight={500} fontSize={20}>
                {token0?.symbol}:{token1?.symbol}
              </Text>
            </RowFixed>
            <RowFixed>
              {showMore ? (
                <ChevronUp size="20" style={{ marginLeft: '10px' }} />
              ) : (
                <ChevronDown size="20" style={{ marginLeft: '10px' }} />
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
                      {token0Deposited?.toSignificant(6)}
                    </Text>
                    {!minimal && <TokenLogo size="20px" style={{ marginLeft: '8px' }} address={token0?.address} />}
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
                      {token1Deposited?.toSignificant(6)}
                    </Text>
                    {!minimal && <TokenLogo size="20px" style={{ marginLeft: '8px' }} address={token1?.address} />}
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
                    {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
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
