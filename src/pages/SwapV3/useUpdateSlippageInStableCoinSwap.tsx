import { Currency } from '@kyberswap/ks-sdk-core'
import { useEffect, useRef } from 'react'

import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

const useUpdateSlippageInStableCoinSwap = (currencyIn?: Currency, currencyOut?: Currency) => {
  const { chainId } = useActiveWeb3React()
  const [slippage, setSlippage] = useUserSlippageTolerance()
  const isStableCoinSwap =
    chainId &&
    currencyIn &&
    currencyOut &&
    STABLE_COINS_ADDRESS[chainId].includes(currencyIn.wrapped.address) &&
    STABLE_COINS_ADDRESS[chainId].includes(currencyOut.wrapped.address)
  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage
  useEffect(() => {
    if (isStableCoinSwap && rawSlippageRef.current > 10) {
      setSlippage(10)
    }
    if (!isStableCoinSwap && rawSlippageRef.current === 10) {
      setSlippage(50)
    }
  }, [isStableCoinSwap, setSlippage])
}

export default useUpdateSlippageInStableCoinSwap
