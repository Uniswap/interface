import React from 'react'
import { Flex } from 'rebass'
import { Pair, TokenAmount } from '@swapr/sdk'
import { TYPE } from '../../../../../../theme'
import { AutoColumn } from '../../../../../Column'
import DataRow from '../DataRow'
import { DateTime } from 'luxon'

interface PoolSummaryProps {
  liquidityPair: Pair | null
  startTime: Date | null
  endTime: Date | null
  timelocked: boolean
  stakingCap: TokenAmount | null
}

export default function PoolSummary({ liquidityPair, startTime, endTime, timelocked, stakingCap }: PoolSummaryProps) {
  return (
    <Flex flexDirection="column" justifyContent="stretch" flex="1">
      <AutoColumn gap="8px">
        <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
          POOL SUMMARY
        </TYPE.small>
        <AutoColumn gap="4px">
          <DataRow
            name="POOL PAIR"
            value={liquidityPair ? `${liquidityPair.token0.symbol}/${liquidityPair.token1.symbol}` : '-'}
          />
          <DataRow
            name="STARTS"
            value={startTime ? DateTime.fromJSDate(startTime).toFormat('dd-MM-yyyy hh:mm') : '-'}
          />
          <DataRow name="ENDS" value={endTime ? DateTime.fromJSDate(endTime).toFormat('dd-MM-yyyy hh:mm') : '-'} />
          <DataRow name="TIMELOCK" value={timelocked ? 'YES' : 'NO'} />
          <DataRow
            name="STAKING CAP"
            value={stakingCap && stakingCap.greaterThan('0') ? stakingCap.toSignificant(4) : '-'}
          />
        </AutoColumn>
      </AutoColumn>
    </Flex>
  )
}
