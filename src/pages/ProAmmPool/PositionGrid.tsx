import { gql, useQuery } from '@apollo/client'
import { Interface } from 'ethers/lib/utils'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import { useKyberSwapConfig } from 'state/application/hooks'
import { PositionDetails } from 'types/position'

import PositionListItem from './PositionListItem'

export const PositionCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(392px, auto) minmax(392px, auto) minmax(392px, auto);
  gap: 24px;
  max-width: 1224px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1fr;
    max-width: 832px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    max-width: 392px;
  `};
`

const tickReaderInterface = new Interface(TickReaderABI.abi)

const queryPositionLastCollectedTimes = gql`
  query positions($ids: [String]!) {
    positions(where: { id_in: $ids }) {
      id
      createdAtTimestamp
      lastCollectedFeeAt
    }
  }
`

function PositionGrid({
  positions,
  style,
  refe,
  activeFarmAddress,
}: {
  positions: PositionDetails[]
  style?: CSSProperties
  refe?: React.MutableRefObject<any>
  activeFarmAddress: string[]
}) {
  const { isEVM, networkInfo, chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract()
  const { elasticClient } = useKyberSwapConfig(chainId)

  // raw
  const [feeRewards, setFeeRewards] = useState<{
    [tokenId: string]: [string, string]
  }>(() => positions.reduce((acc, item) => ({ ...acc, [item.tokenId.toString()]: ['0', '0'] }), {}))

  const positionIds = useMemo(() => positions.map(pos => pos.tokenId.toString()), [positions])
  const { data } = useQuery(queryPositionLastCollectedTimes, {
    client: elasticClient,
    variables: {
      ids: positionIds,
    },
    fetchPolicy: 'cache-first',
    skip: !isEVM || !positionIds.length,
  })

  const now = Date.now() / 1000
  const liquidityTimes = data?.positions.reduce(
    (acc: { [id: string]: number }, item: { id: string; lastCollectedFeeAt: string }) => {
      return {
        ...acc,
        [item.id]: now - Number(item.lastCollectedFeeAt), // seconds
      }
    },
    {},
  )

  const createdAts = data?.positions.reduce(
    (acc: { [id: string]: number }, item: { id: string; createdAtTimestamp: string }) => {
      return {
        ...acc,
        [item.id]: Number(item.createdAtTimestamp), // seconds
      }
    },
    {},
  )

  const getPositionFee = useCallback(async () => {
    if (!multicallContract) return
    const fragment = tickReaderInterface.getFunction('getTotalFeesOwedToPosition')
    const callParams = positions.map(item => {
      return {
        target: (networkInfo as EVMNetworkInfo).elastic.tickReader,
        callData: tickReaderInterface.encodeFunctionData(fragment, [
          (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
          item.poolId,
          item.tokenId,
        ]),
      }
    })

    const { returnData } = await multicallContract?.callStatic.tryBlockAndAggregate(false, callParams)
    setFeeRewards(
      returnData.reduce(
        (
          acc: { [tokenId: string]: [string, string] },
          item: { success: boolean; returnData: string },
          index: number,
        ) => {
          if (item.success) {
            const tmp = tickReaderInterface.decodeFunctionResult(fragment, item.returnData)
            return {
              ...acc,
              [positions[index].tokenId.toString()]: [tmp.token0Owed.toString(), tmp.token1Owed.toString()],
            }
          }
          return { ...acc, [positions[index].tokenId.toString()]: ['0', '0'] }
        },
        {} as { [tokenId: string]: [string, string] },
      ),
    )
  }, [multicallContract, positions, networkInfo])

  useEffect(() => {
    getPositionFee()
  }, [getPositionFee])

  return (
    <PositionCardGrid style={style}>
      {positions.map(p => (
        <PositionListItem
          refe={refe}
          positionDetails={p}
          key={p.tokenId.toString()}
          rawFeeRewards={feeRewards[p.tokenId.toString()] || ['0', '0']}
          liquidityTime={liquidityTimes?.[p.tokenId.toString()]}
          createdAt={createdAts?.[p.tokenId.toString()]}
          hasUserDepositedInFarm={!!p.stakedLiquidity}
          hasActiveFarm={activeFarmAddress.includes(p.poolId.toLowerCase())}
        />
      ))}
    </PositionCardGrid>
  )
}

export default PositionGrid
