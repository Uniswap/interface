import { useSingleCallResult } from 'state/multicall/hooks'
import { useEffect, useState } from 'react'
import { useV3NFTPositionManagerContract } from './useContract'
import { BigNumber } from '@ethersproject/bignumber'
import { Pool } from '@uniswap/v3-sdk'
import { CurrencyAmount, Currency } from '@uniswap/sdk-core'
import { useBlockNumber } from 'state/application/hooks'
import { unwrappedToken } from 'utils/unwrappedToken'

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1)

// compute current + counterfactual fees for a v3 position
export function useV3PositionFees(
  pool?: Pool,
  tokenId?: BigNumber,
  asWETH = false
): [CurrencyAmount<Currency>, CurrencyAmount<Currency>] | [undefined, undefined] {
  const positionManager = useV3NFTPositionManagerContract(false)
  const owner: string | undefined = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId])
    .result?.[0]

  const tokenIdHexString = tokenId?.toHexString()
  const latestBlockNumber = useBlockNumber()

  // TODO find a way to get this into multicall
  // latestBlockNumber is included to ensure data stays up-to-date every block
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber]>()
  useEffect(() => {
    let stale = false

    if (positionManager && tokenIdHexString && owner && typeof latestBlockNumber === 'number') {
      positionManager.callStatic
        .collect(
          {
            tokenId: tokenIdHexString,
            recipient: owner, // some tokens might fail if transferred to address(0)
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
          },
          { from: owner } // need to simulate the call as the owner
        )
        .then((results) => {
          if (!stale) setAmounts([results.amount0, results.amount1])
        })
    }

    return () => {
      stale = true
    }
  }, [positionManager, tokenIdHexString, owner, latestBlockNumber])

  if (pool && amounts) {
    return [
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token0) : pool.token0, amounts[0].toString()),
      CurrencyAmount.fromRawAmount(!asWETH ? unwrappedToken(pool.token1) : pool.token1, amounts[1].toString()),
    ]
  } else {
    return [undefined, undefined]
  }
}
