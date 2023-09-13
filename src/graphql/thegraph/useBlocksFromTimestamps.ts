import { ChainId } from '@uniswap/sdk-core'
import gql from 'graphql-tag'
import { chainToApolloBlockClient } from './apollo'
import { useEffect, useMemo, useState } from 'react'
import { splitQuery } from './utils'
import { START_BLOCKS } from 'constants/chainInfo'

export const GET_BLOCKS = (timestamps: string[]) => {
  let queryString = 'query blocks {'
  queryString += timestamps.map((timestamp) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
    } }) {
        number
      }`
  })
  queryString += '}'
  return gql(queryString)
}

/**
 * for a given array of timestamps, returns block entities
 * @param timestamps
 */
export function useBlocksFromTimestamps(
  timestamps: number[],
  chainId: ChainId
): {
  blocks:
    | {
        timestamp: string
        number: any
      }[]
    | undefined
  error: boolean
} {
  const [blocks, setBlocks] = useState<any>()
  const [error, setError] = useState(false)

  const chainBlockClient = chainToApolloBlockClient[chainId]

  // derive blocks based on active network
  const networkBlocks = blocks?.[chainId]

  useEffect(() => {
    async function fetchData() {
      const results = await splitQuery(GET_BLOCKS, chainBlockClient, [], timestamps)
      if (results) {
        setBlocks({ ...(blocks ?? {}), [chainId]: results })
      } else {
        setError(true)
      }
    }
    if (!networkBlocks && !error) {
      fetchData()
    }
  })

  const blocksFormatted = useMemo(() => {
    if (blocks?.[chainId]) {
      const networkBlocks = blocks?.[chainId]
      const formatted = []
      for (const t in networkBlocks) {
        if (networkBlocks[t].length > 0) {
          const number = networkBlocks[t][0]['number']
          const deploymentBlock = START_BLOCKS[chainId]
          const adjustedNumber = number > deploymentBlock ? number : deploymentBlock

          formatted.push({
            timestamp: t.split('t')[1],
            number: adjustedNumber,
          })
        }
      }
      return formatted
    }
    return undefined
  }, [chainId, blocks])

  return {
    blocks: blocksFormatted,
    error,
  }
}