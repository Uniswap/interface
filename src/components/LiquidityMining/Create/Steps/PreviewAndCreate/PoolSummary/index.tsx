import React from 'react'
import { Flex } from 'rebass'
import { Pair } from 'dxswap-sdk'
import { TYPE } from '../../../../../../theme'
import { AutoColumn } from '../../../../../Column'
import DataRow from '../DataRow'
import { DateTime } from 'luxon'

interface PoolSummaryProps {
  liquidityPair: Pair | null
  startTime: Date | null
  endTime: Date | null
  timelocked: boolean
}

export default function PoolSummary({ liquidityPair, startTime, endTime, timelocked }: PoolSummaryProps) {
  return (
    <Flex flexDirection="column" justifyContent="stretch" width="100%">
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
        </AutoColumn>
      </AutoColumn>
    </Flex>
  )
}
