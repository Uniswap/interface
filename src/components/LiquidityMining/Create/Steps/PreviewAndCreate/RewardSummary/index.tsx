import React from 'react'
import { Flex } from 'rebass'
import { TokenAmount } from 'dxswap-sdk'
import { TYPE } from '../../../../../../theme'
import { AutoColumn } from '../../../../../Column'
import DataRow from '../DataRow'
import BigNumber from 'bignumber.js'

interface RewardSummaryProps {
  reward: TokenAmount | null
  apy: BigNumber
}

export default function RewardSummary({ reward, apy }: RewardSummaryProps) {
  return (
    <Flex flexDirection="column" justifyContent="stretch" width="100%">
      <AutoColumn gap="8px">
        <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
          REWARD SUMMARY
        </TYPE.small>
        <DataRow name="Initial APY" value={`${apy.decimalPlaces(2).toString()}%`} />
        <DataRow
          name="TOTAL REWARD"
          value={reward && reward.token && reward.token.symbol ? `${reward.toExact()} ${reward.token.symbol}` : '-'}
        />
      </AutoColumn>
    </Flex>
  )
}
