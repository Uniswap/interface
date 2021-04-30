import { Pair, Percent, PricedTokenAmount, TokenAmount } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import React from 'react'
import { Lock, Unlock } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { useNativeCurrencyUSDPrice } from '../../../../hooks/useNativeCurrencyUSDPrice'
import Countdown from '../../../Countdown'
import CurrencyLogo from '../../../CurrencyLogo'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import Row, { AutoRow } from '../../../Row'
import DataDisplayer from '../DataDisplayer'
import TokenAmountDisplayer from '../TokenAmountDisplayer'

const StyledLock = styled(Lock)`
  color: ${props => props.theme.red1};
`

const StyledUnlock = styled(Unlock)`
  color: ${props => props.theme.green1};
`

interface InformationProps {
  targetedPair?: Pair
  stakingCap?: TokenAmount
  rewards?: PricedTokenAmount[]
  remainingRewards?: PricedTokenAmount[]
  locked?: boolean
  startsAt?: number
  endsAt?: number
  apy?: Percent
  staked?: PricedTokenAmount
}

function Information({
  targetedPair,
  stakingCap,
  rewards,
  remainingRewards,
  locked,
  startsAt,
  endsAt,
  apy,
  staked
}: InformationProps) {
  const { loading: loadingNativeCurrencyUSDPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  return (
    <Flex justifyContent="space-between">
      <Flex flexDirection="column">
        <Box mb="18px">
          <DataDisplayer
            title="REWARD PROGRAM"
            data={
              <Flex alignItems="center">
                <Box mr="8px">
                  <DoubleCurrencyLogo
                    loading={!targetedPair}
                    size={26}
                    currency0={targetedPair?.token0}
                    currency1={targetedPair?.token1}
                  />
                </Box>
                <Box>
                  <Text fontSize="18px" fontWeight="600" lineHeight="20px">
                    {!targetedPair ? (
                      <Skeleton width="60px" height="18px" />
                    ) : (
                      `${targetedPair.token0.symbol}/${targetedPair.token1.symbol}`
                    )}
                  </Text>
                </Box>
              </Flex>
            }
          />
        </Box>
        <Box mb="18px">
          <DataDisplayer
            title="MAX POOL SIZE"
            data={
              stakingCap ? (
                stakingCap.equalTo('0') ? (
                  'INFINITE'
                ) : (
                  stakingCap.toFixed(4)
                )
              ) : (
                <Skeleton width="60px" height="14px" />
              )
            }
          />
        </Box>
        <Box>
          <DataDisplayer
            title="POOL TYPE"
            data={
              <AutoRow gap="4px">
                {locked !== undefined ? (
                  locked ? (
                    <StyledLock size="14px" />
                  ) : (
                    <StyledUnlock size="14px" />
                  )
                ) : (
                  <Skeleton width="14px" height="14px" />
                )}
                {locked !== undefined ? locked ? 'LOCKED' : 'UNLOCKED' : <Skeleton width="52px" height="14px" />}
              </AutoRow>
            }
          />
        </Box>
      </Flex>
      <Flex flexDirection="column" alignItems="flex-end">
        <Flex mb="18px">
          <Box mr="24px">
            <DataDisplayer
              alignTitleRight
              title="DURATION"
              data={!endsAt ? <Skeleton width="80px" height="14px" /> : <Countdown to={endsAt} />}
            />
          </Box>
          <Box>
            <DataDisplayer
              alignTitleRight
              title="APY"
              data={!apy ? <Skeleton width="80px" height="22px" /> : `${apy.toFixed(2)}%`}
              dataTextSize={22}
            />
          </Box>
        </Flex>
        <Flex mb="18px">
          <Box mr="24px">
            <DataDisplayer
              alignTitleRight
              title="TVL"
              data={
                !staked || loadingNativeCurrencyUSDPrice || !nativeCurrencyUSDPrice ? (
                  <Skeleton width="60px" height="14px" />
                ) : (
                  `$${staked.nativeCurrencyAmount.multiply(nativeCurrencyUSDPrice).toFixed(2)}`
                )
              }
            />
          </Box>
          <Box mr="24px">
            <DataDisplayer
              alignTitleRight
              title="REWARDS"
              data={
                !rewards ? (
                  <Row alignItems="center" justifyContent="flex-end" mb="4px">
                    <Skeleton width="24px" height="14px" />
                    <CurrencyLogo loading marginLeft={4} marginRight={4} size="14px" />
                    <Skeleton width="14px" height="14px" />
                  </Row>
                ) : (
                  rewards.map(reward => (
                    <TokenAmountDisplayer key={reward.token.address} amount={reward} fontSize="12px" alignRight />
                  ))
                )
              }
            />
          </Box>
          <Box>
            <DataDisplayer
              alignTitleRight
              title="REMAINING"
              data={
                !remainingRewards ? (
                  <Row alignItems="center" justifyContent="flex-end" mb="4px">
                    <Skeleton width="24px" height="14px" />
                    <CurrencyLogo loading marginLeft={4} marginRight={4} size="14px" />
                    <Skeleton width="14px" height="14px" />
                  </Row>
                ) : (
                  remainingRewards.map(remainingReward => (
                    <TokenAmountDisplayer
                      key={remainingReward.token.address}
                      amount={remainingReward}
                      fontSize="12px"
                      alignRight
                    />
                  ))
                )
              }
            />
          </Box>
        </Flex>
        <Flex>
          <Box mr="24px">
            <DataDisplayer
              alignTitleRight
              title="STARTS AT"
              data={
                !startsAt ? (
                  <Skeleton width="80px" height="14px" />
                ) : (
                  DateTime.fromSeconds(parseInt(startsAt.toString())).toFormat('dd-MM-yyyy hh:mm')
                )
              }
            />
          </Box>
          <Box>
            <DataDisplayer
              alignTitleRight
              title="ENDS AT"
              data={
                !endsAt ? (
                  <Skeleton width="80px" height="14px" />
                ) : (
                  DateTime.fromSeconds(parseInt(endsAt.toString())).toFormat('dd-MM-yyyy hh:mm')
                )
              }
            />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Information
