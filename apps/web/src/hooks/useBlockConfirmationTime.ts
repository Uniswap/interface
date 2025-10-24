import { useWeb3React } from '@web3-react/core'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useEffect, useState } from 'react'

export function useBlockConfirmationTime() {
  const { provider } = useWeb3React()
  const currentBlockNumber = useBlockNumber()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [blockConfirmationTime, setBlockConfirmationTime] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)
    async function fetchBlockConfirmationTime() {
      if (!provider || !currentBlockNumber) {
        setLoading(false)
        return
      }
      try {
        const [currentBlock, previousBlock] = await Promise.all([
          provider.getBlock(currentBlockNumber),
          provider.getBlock(currentBlockNumber - 1),
        ])

        if (currentBlock.timestamp && previousBlock.timestamp) {
          setBlockConfirmationTime(currentBlock.timestamp - previousBlock.timestamp)
        } else {
          setError(true)
          setBlockConfirmationTime(null)
        }
      } catch {
        setError(true)
        setBlockConfirmationTime(null)
      }
      setLoading(false)
    }
    fetchBlockConfirmationTime()
  }, [currentBlockNumber, provider])

  return { loading, error, blockConfirmationTime }
}
