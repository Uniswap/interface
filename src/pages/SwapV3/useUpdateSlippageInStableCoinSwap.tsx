import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP } from 'constants/index'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { Field } from 'state/swap/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'

const useUpdateSlippageInStableCoinSwap = () => {
  const { chainId } = useActiveWeb3React()
  const inputCurrencyId = useSelector((state: AppState) => state.swap[Field.INPUT].currencyId)
  const previousInputCurrencyId = usePrevious(inputCurrencyId)
  const outputCurrencyId = useSelector((state: AppState) => state.swap[Field.OUTPUT].currencyId)
  const previousOutputCurrencyId = usePrevious(outputCurrencyId)
  const [slippage, setSlippage] = useUserSlippageTolerance()

  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage

  useEffect(() => {
    const isStableCoinPreviousSwap = Boolean(
      chainId &&
        previousInputCurrencyId &&
        previousOutputCurrencyId &&
        STABLE_COINS_ADDRESS[chainId].includes(previousInputCurrencyId) &&
        STABLE_COINS_ADDRESS[chainId].includes(previousOutputCurrencyId),
    )

    const isStableCoinSwap = Boolean(
      chainId &&
        inputCurrencyId &&
        outputCurrencyId &&
        STABLE_COINS_ADDRESS[chainId].includes(inputCurrencyId) &&
        STABLE_COINS_ADDRESS[chainId].includes(outputCurrencyId),
    )

    if (isStableCoinPreviousSwap === isStableCoinSwap) {
      return
    }

    if (isStableCoinSwap && rawSlippageRef.current > DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP) {
      setSlippage(DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
      return
    }

    if (!isStableCoinSwap && rawSlippageRef.current > DEFAULT_SLIPPAGE) {
      setSlippage(DEFAULT_SLIPPAGE)
    }
  }, [chainId, inputCurrencyId, outputCurrencyId, previousInputCurrencyId, previousOutputCurrencyId, setSlippage])
}

export default useUpdateSlippageInStableCoinSwap
