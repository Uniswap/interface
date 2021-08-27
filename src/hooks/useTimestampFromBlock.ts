import { useProvider } from '@celo-tools/use-contractkit'
import { useEffect, useState } from 'react'

export function useTimestampFromBlock(block: number | undefined): number | undefined {
  const library = useProvider()
  const [timestamp, setTimestamp] = useState<number>()
  useEffect(() => {
    async function fetchTimestamp() {
      if (block) {
        const blockData = await library?.getBlock(block)
        blockData && setTimestamp(blockData.timestamp)
      }
    }
    if (!timestamp) {
      fetchTimestamp()
    }
  }, [block, library, timestamp])
  return timestamp
}
