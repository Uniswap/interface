import { Pair, Percent, PricedTokenAmount, TokenAmount } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import { transparentize } from 'polished'
import React, { useMemo } from 'react'
import { Lock, Unlock } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { useNativeCurrencyUSDPrice } from '../../../../hooks/useNativeCurrencyUSDPrice'
import { TYPE } from '../../../../theme'
import Countdown from '../../../Countdown'
import CurrencyLogo from '../../../CurrencyLogo'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import Row, { RowFixed } from '../../../Row'
import DataDisplayer from '../DataDisplayer'
import TokenAmountDisplayer from '../TokenAmountDisplayer'

const View = styled(Flex)`
  flex-wrap: wrap;

  & > *:nth-child(odd) {
    width: 40%;
  }
  & > *:nth-child(even) {
    width: 60%;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    && {
      display: grid;
      grid-template-columns: 2fr 1fr;
      grid-template-areas:
      "reward-program info-section"
      "max-pool-size info-section"
      "dates info-section"
      "rewards rewards"
      "pool-type pool-type";
    }
    && > * {
      width: initial;  
    }
  `};
`;

const RewardProgramSection = styled(Box)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: reward-program;
  `};
`;

const DatesSection = styled(Flex)`
  justify-content: flex-end;
  text-align: right;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: dates;
    justify-content: flex-start;

    & div {
      text-align: left;
    }
  `};
`;

const RewardsSection = styled(Flex)`
  justify-content: flex-end;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: rewards;
    justify-content: flex-start;

    & div {
      justify-content: flex-start;
    }
  `};
`;

const MaxPollSizeSection = styled(Box)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: max-pool-size;
  `};
`;

const PoolTypeSection = styled(Box)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: pool-type;
  `};
`;


const InfoRow = styled(Flex)`
  text-align: right;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: info-section;
    && {
      flex-direction: column-reverse;
      align-items: flex-end;
    }
    && > * {
      margin: 0 0 24px;
    }

    & > *:first-child {
      margin: 0;
    }
  `};
`;


const StyledLock = styled(Lock)`
  color: ${props => props.theme.red1};
`

const StyledUnlock = styled(Unlock)`
  color: ${props => props.theme.green1};
`

const BadgeRoot = styled.div<{ upcoming?: boolean; expired?: boolean }>`
  height: 16px;
  width: fit-content;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${props =>
    transparentize(0.9, props.expired ? props.theme.red2 : props.upcoming ? props.theme.yellow2 : props.theme.green2)};
  border-radius: 4px;
  padding: 0 4px;
`

const BadgeText = styled.div<{ upcoming?: boolean; expired?: boolean }>`
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  letter-spacing: 0.02em;
  color: ${props => (props.expired ? props.theme.red2 : props.upcoming ? props.theme.yellow2 : props.theme.green2)};
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
  showUSDValue: boolean
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
  staked,
  showUSDValue
}: InformationProps) {
  const { loading: loadingNativeCurrencyUSDPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()
  const upcoming = useMemo(() => {
    return !!(startsAt && startsAt > Math.floor(Date.now() / 1000))
  }, [startsAt])
  const expired = useMemo(() => {
    return !!(endsAt && endsAt < Math.floor(Date.now() / 1000))
  }, [endsAt])

  return (
    <View justifyContent="space-between">
      <RewardProgramSection mb="24px">
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
      </RewardProgramSection>
      <InfoRow mb="24px" alignItems="center" justifyContent="flex-end">
        <Box mr="24px">
          <DataDisplayer
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
        <Flex mr="24px" flexDirection="column" alignItems="flex-end">
          <Box mb="4px">
            {!endsAt ? (
              <Skeleton width="40px" height="14px" />
            ) : (
              <BadgeRoot expired={expired} upcoming={upcoming}>
                <BadgeText expired={expired} upcoming={upcoming}>
                  {expired ? 'EXPIRED' : upcoming ? 'UPCOMING' : 'ACTIVE'}
                </BadgeText>
              </BadgeRoot>
            )}
          </Box>
          <Box>
            <TYPE.small fontWeight="500" fontSize="14px">
              {!endsAt || !startsAt ? (
                <Skeleton width="136px" height="14px" />
              ) : (
                <TYPE.body
                  fontSize="14px"
                  fontWeight="500"
                  lineHeight="14px"
                  color="text3"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Countdown to={upcoming ? startsAt : endsAt} />
                </TYPE.body>
              )}
            </TYPE.small>
          </Box>
        </Flex>
        <Box>
          <DataDisplayer
            title="APY"
            data={!apy ? <Skeleton width="80px" height="22px" /> : `${apy.toFixed(2)}%`}
            dataTextSize={22}
            fontWeight={600}
            color="white"
          />
        </Box>
      </InfoRow>
      <MaxPollSizeSection mb="24px">
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
      </MaxPollSizeSection>
      <RewardsSection mb="24px" alignItems="flex-start">
        <Box mr="24px">
          <DataDisplayer
            title="REWARDS"
            data={
              !rewards ? (
                <Row alignItems="center" justifyContent="flex-end" mb="4px">
                  <Skeleton width="24px" height="14px" />
                  <CurrencyLogo loading marginLeft={4} marginRight={4} size="14px" />
                </Row>
              ) : (
                rewards.map(reward => (
                  <TokenAmountDisplayer
                    key={reward.token.address}
                    amount={reward}
                    fontSize="16px"
                    alignRight
                    showUSDValue={showUSDValue}
                  />
                ))
              )
            }
          />
        </Box>
        <Box>
          <DataDisplayer
            title="REMAINING"
            data={
              !remainingRewards ? (
                <Row alignItems="center" justifyContent="flex-end" mb="4px">
                  <Skeleton width="24px" height="14px" />
                  <CurrencyLogo loading marginLeft={4} marginRight={4} size="14px" />
                </Row>
              ) : (
                remainingRewards.map(remainingReward => (
                  <TokenAmountDisplayer
                    key={remainingReward.token.address}
                    amount={remainingReward}
                    fontSize="16px"
                    alignRight
                    showUSDValue={showUSDValue}
                  />
                ))
              )
            }
          />
        </Box>
      </RewardsSection>
      <PoolTypeSection>
        <DataDisplayer
          title="POOL TYPE"
          data={
            <RowFixed>
              {locked !== undefined ? (
                locked ? (
                  <StyledLock size="14px" />
                ) : (
                  <StyledUnlock size="14px" />
                )
              ) : (
                <Skeleton width="14px" height="14px" />
              )}
              <div style={{ width: 4 }} />
              {locked !== undefined ? (
                locked ? (
                  'LOCKED STAKING'
                ) : (
                  'UNLOCKED STAKING'
                )
              ) : (
                <Skeleton width="60px" height="14px" />
              )}
            </RowFixed>
          }
        />
      </PoolTypeSection>
      <DatesSection mb="24px">
        <Box mr="24px">
          <DataDisplayer
            title="START"
            data={
              !startsAt ? (
                <Skeleton width="80px" height="10.5px" />
              ) : (
                DateTime.fromSeconds(parseInt(startsAt.toString())).toFormat('dd-MM-yyyy hh:mm')
              )
            }
            dataTextSize={10.5}
          />
        </Box>
        <Box>
          <DataDisplayer
            title="END"
            data={
              !endsAt ? (
                <Skeleton width="80px" height="10.5px" />
              ) : (
                DateTime.fromSeconds(parseInt(endsAt.toString())).toFormat('dd-MM-yyyy hh:mm')
              )
            }
            dataTextSize={10.5}
          />
        </Box>
      </DatesSection>
    </View>
  )
}

export default Information
