import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'

import { unwrappedToken } from 'utils/wrappedCurrency'

import { useProAmmTotalFeeOwedByPosition } from './useProAmmPreviousTicks'

export function useProAmmPositionFees(tokenId?: BigNumber, position?: Position, asWETH = false) {
  const tokenIdHexString = tokenId?.toHexString()
  const amounts = useProAmmTotalFeeOwedByPosition(position?.pool, tokenIdHexString)
  if (position && amounts.length === 2) {
    return [
      CurrencyAmount.fromRawAmount(
        !asWETH ? unwrappedToken(position?.pool.token0) : position?.pool.token0,
        amounts[0].toString(),
      ),
      CurrencyAmount.fromRawAmount(
        !asWETH ? unwrappedToken(position?.pool.token1) : position?.pool.token1,
        amounts[1].toString(),
      ),
    ]
  } else return [undefined, undefined]
}
