import { Pair, TokenAmount } from '@swapr/sdk'
import { DateTime } from 'luxon'
import React from 'react'
import { Text } from 'rebass'
import { TYPE } from '../../../theme'
import { ButtonError } from '../../Button'
import { AutoColumn } from '../../Column'
import QuestionHelper from '../../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../../Row'

interface StakingRewardsDistributionCreationModalFooterProps {
  liquidityPair: Pair | null
  startTime: Date | null
  endTime: Date | null
  reward: TokenAmount | null
  timelocked: boolean
  stakingCap: TokenAmount | null
  unlimitedPool: boolean
  onConfirm: () => void
}

export default function StakingRewardsDistributionCreationModalFooter({
  liquidityPair,
  startTime,
  endTime,
  reward,
  timelocked,
  stakingCap,
  unlimitedPool,
  onConfirm
}: StakingRewardsDistributionCreationModalFooterProps) {
  return (
    <AutoColumn gap="0px">
      <RowBetween align="center" mb="6px">
        <TYPE.body fontWeight={400} fontSize="13px" color="text5">
          Pool pair
        </TYPE.body>
        <TYPE.body
          fontWeight={500}
          fontSize="12px"
          color="text5"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            textAlign: 'right',
            paddingLeft: '10px'
          }}
        >
          {liquidityPair ? `${liquidityPair.token0.symbol}/${liquidityPair.token1.symbol}` : '-'}
        </TYPE.body>
      </RowBetween>

      <RowBetween align="center" mb="6px">
        <TYPE.body fontWeight={400} fontSize="13px" color="text5">
          Total reward
        </TYPE.body>
        <TYPE.body
          fontWeight={500}
          fontSize="12px"
          color="text5"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            textAlign: 'right',
            paddingLeft: '10px'
          }}
        >
          {reward ? `${reward.toExact()} ${reward.token.symbol}` : '-'}
        </TYPE.body>
      </RowBetween>

      <RowBetween align="center" mb="6px">
        <TYPE.body fontWeight={400} fontSize="13px" color="text5">
          Max pool size
        </TYPE.body>
        <TYPE.body
          fontWeight={500}
          fontSize="12px"
          color="text5"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            textAlign: 'right',
            paddingLeft: '10px'
          }}
        >
          {unlimitedPool
            ? 'Unlimited'
            : `${stakingCap?.toSignificant(4)} ${liquidityPair?.token0.symbol}/${liquidityPair?.token1.symbol} LP`}
        </TYPE.body>
      </RowBetween>

      <RowBetween mb="6px">
        <RowFixed>
          <TYPE.body fontWeight={400} fontSize="13px" color="text5">
            Starts
          </TYPE.body>
        </RowFixed>
        <RowFixed>
          <TYPE.body fontWeight={500} fontSize="12px" color="text5">
            {startTime ? DateTime.fromJSDate(startTime).toFormat('dd-MM-yyyy hh:mm') : '-'}
          </TYPE.body>
        </RowFixed>
      </RowBetween>

      <RowBetween mb="6px">
        <RowFixed>
          <TYPE.body fontWeight={400} fontSize="13px" color="text5">
            Ends
          </TYPE.body>
          <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
        </RowFixed>
        <RowFixed>
          <TYPE.body fontWeight={500} fontSize="12px" color="text5">
            {endTime ? DateTime.fromJSDate(endTime).toFormat('dd-MM-yyyy hh:mm') : '-'}
          </TYPE.body>
        </RowFixed>
      </RowBetween>

      <RowBetween mb="6px">
        <RowFixed>
          <TYPE.body fontWeight={400} fontSize="13px" color="text5">
            Timelock
          </TYPE.body>
          <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
        </RowFixed>
        <RowFixed>
          <TYPE.body fontWeight={500} fontSize="12px" color="text5">
            {timelocked ? 'Yes' : 'No'}
          </TYPE.body>
        </RowFixed>
      </RowBetween>

      <AutoRow>
        <ButtonError onClick={onConfirm} style={{ margin: '10px 0 0 0' }}>
          <Text fontSize={13} fontWeight={600}>
            Confirm
          </Text>
        </ButtonError>
      </AutoRow>
    </AutoColumn>
  )
}
