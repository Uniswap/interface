import { Currency } from '@kyberswap/ks-sdk-core'

import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'

const useCheckStablePairSwap = (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
  const { chainId } = useActiveWeb3React()

  const isStablePairSwap = Boolean(
    chainId &&
      currencyIn &&
      currencyOut &&
      STABLE_COINS_ADDRESS[chainId].includes(currencyIn.wrapped.address) &&
      STABLE_COINS_ADDRESS[chainId].includes(currencyOut.wrapped.address),
  )

  return isStablePairSwap
}

export default useCheckStablePairSwap
