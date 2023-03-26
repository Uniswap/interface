import { BigNumber } from '@ethersproject/bignumber'
import { DateTime } from 'luxon/src/luxon'
import { useEffect, useState } from 'react'

import { useV3PositionFromTokenId } from './useV3Positions'
import { useActiveWeb3React } from './web3'

export default function useLimitOrdersDates(tokenId: BigNumber | undefined) {
  const { createdLogs, processedLogs, cancelledLogs, collectedLogs } = useV3PositionFromTokenId(tokenId)
  const { transactionHash: createdTxn, event: createdEvent, blockHash: createdBlockNumber } = createdLogs || {}
  const { transactionHash: processedTxn, event: processedEvent, blockHash: processedBlockNumber } = processedLogs || {}
  const { transactionHash: cancelledTxn, event: cancelledEvent, blockHash: cancelledBlockNumber } = cancelledLogs || {}
  const { transactionHash: collectedTxn, event: collectedEvent, blockHash: collectedBlockNumber } = collectedLogs || {}

  const [createdBlockDate, setCreatedBlockDate] = useState<DateTime>()
  const [processedBlockDate, setProcessedBlockDate] = useState<DateTime>()
  const [cancelledBlockDate, setCancelledBlockDate] = useState<DateTime>()
  const [collectedBlockDate, setCollectedBlockDate] = useState<DateTime>()

  const { library } = useActiveWeb3React()

  useEffect(() => {
    async function load() {
      if (createdBlockNumber) {
        const res = await library?.getBlock(createdBlockNumber)
        if (!res?.timestamp) return
        setCreatedBlockDate(DateTime.fromSeconds(res?.timestamp))
      }
      if (processedBlockNumber) {
        const res = await library?.getBlock(processedBlockNumber)
        if (!res?.timestamp) return
        setProcessedBlockDate(DateTime.fromSeconds(res?.timestamp))
      }
      if (cancelledBlockNumber) {
        const res = await library?.getBlock(cancelledBlockNumber)
        if (!res?.timestamp) return
        setCancelledBlockDate(DateTime.fromSeconds(res?.timestamp))
      }
      if (collectedBlockNumber) {
        const res = await library?.getBlock(collectedBlockNumber)
        if (!res?.timestamp) return
        setCollectedBlockDate(DateTime.fromSeconds(res?.timestamp))
      }
    }

    load().then()
  }, [cancelledBlockNumber, collectedBlockNumber, createdBlockNumber, library, processedBlockNumber])

  return {
    createdBlockDate,
    processedBlockDate,
    cancelledBlockDate,
    collectedBlockDate,
  }
}
