import React from 'react'
import { Flex } from 'rebass'
import { Percent, TokenAmount } from '@swapr/sdk'
import { TYPE } from '../../../../../../theme'
import { AutoColumn } from '../../../../../Column'
import DataRow from '../DataRow'

interface RewardSummaryProps {
  reward: TokenAmount | null
  apy: Percent
}

export default function RewardSummary({ reward, apy }: RewardSummaryProps) {
  return (
    <Flex flexDirection="column" justifyContent="stretch" width="100%">
      <AutoColumn gap="8px">
        <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
          REWARD SUMMARY
        </TYPE.small>
        <DataRow name="INITIAL APR" value={`${apy.toSignificant(2)}%`} />
        <DataRow
          name="TOTAL REWARD"
          value={reward && reward.token && reward.token.symbol ? `${reward.toExact()} ${reward.token.symbol}` : '-'}
        />
      </AutoColumn>
    </Flex>
  )
}
