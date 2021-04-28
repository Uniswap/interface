import { Pair, Percent, PricedTokenAmount, TokenAmount } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import React from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex, Text } from 'rebass'
import { useNativeCurrencyUSDPrice } from '../../../../hooks/useNativeCurrencyUSDPrice'
import Countdown from '../../../Countdown'
import CurrencyLogo from '../../../CurrencyLogo'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import Row from '../../../Row'
import DataDisplayer from '../DataDisplayer'

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
                  <Text fontSize="16px" fontWeight="600" lineHeight="20px">
                    {!targetedPair ? (
                      <Skeleton width="60px" height="14px" />
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
            data={locked !== undefined ? locked ? 'LOCKED' : 'UNLOCKED' : <Skeleton width="40px" height="14px" />}
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
                    <CurrencyLogo loading marginLeft={4} size="14px" />
                  </Row>
                ) : (
                  rewards.map(reward => (
                    <Row alignItems="center" justifyContent="flex-end" key={reward.token.address} mb="4px">
                      {reward.toSignificant(3)}
                      <CurrencyLogo marginLeft={4} size="12px" currency={reward.token} />
                    </Row>
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
                    <CurrencyLogo loading marginLeft={4} size="14px" />
                  </Row>
                ) : (
                  remainingRewards.map(remainingReward => (
                    <Row alignItems="center" justifyContent="flex-end" key={remainingReward.token.address} mb="4px">
                      {remainingReward.toSignificant(3)}
                      <CurrencyLogo marginLeft={4} size="12px" currency={remainingReward.token} />
                    </Row>
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
