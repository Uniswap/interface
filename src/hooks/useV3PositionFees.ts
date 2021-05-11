import { useSingleCallResult } from 'state/multicall/hooks'
import { useEffect, useState } from 'react'
import { PositionDetails } from 'types/position'
import { useV3NFTPositionManagerContract } from './useContract'
import { BigNumber } from '@ethersproject/bignumber'
import { Pool } from '@uniswap/v3-sdk'
import { TokenAmount } from '@uniswap/sdk-core'
import { useBlockNumber } from 'state/application/hooks'

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1)

// compute current + counterfactual fees for a v3 position
export function useV3PositionFees(
  pool?: Pool,
  positionDetails?: PositionDetails
): [TokenAmount, TokenAmount] | [undefined, undefined] {
  const positionManager = useV3NFTPositionManagerContract(false)
  const owner = useSingleCallResult(positionDetails?.tokenId ? positionManager : null, 'ownerOf', [
    positionDetails?.tokenId,
  ]).result?.[0]

  const tokenId = positionDetails?.tokenId?.toHexString()
  const latestBlockNumber = useBlockNumber()

  // TODO find a way to get this into multicall
  // because fees don't ever go down, we don't actually need to clear this state
  // latestBlockNumber is included to ensure data stays up-to-date fresh
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber]>()
  useEffect(() => {
    if (positionManager && tokenId && owner && typeof latestBlockNumber === 'number') {
      positionManager.callStatic
        .collect(
          {
            tokenId,
            recipient: owner, // some tokens might fail if transferred to address(0)
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
          },
          { from: owner } // need to simulate the call as the owner
        )
        .then((results) => {
          setAmounts([results.amount0, results.amount1])
        })
    }
  }, [positionManager, tokenId, owner, latestBlockNumber])

  if (pool && positionDetails && amounts) {
    return [
      new TokenAmount(pool.token0, positionDetails.tokensOwed0.add(amounts[0]).toString()),
      new TokenAmount(pool.token1, positionDetails.tokensOwed1.add(amounts[1]).toString()),
    ]
  } else {
    return [undefined, undefined]
  }
}
