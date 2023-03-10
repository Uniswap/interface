import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import { DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP } from 'constants/index'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { Field } from 'state/swap/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'

const useUpdateSlippageInStableCoinSwap = () => {
  const { chainId } = useActiveWeb3React()
  const inputCurrencyId = useSelector((state: AppState) => state.swap[Field.INPUT].currencyId)
  const outputCurrencyId = useSelector((state: AppState) => state.swap[Field.OUTPUT].currencyId)
  const [slippage, setSlippage] = useUserSlippageTolerance()

  const rawSlippageRef = useRef(slippage)
  rawSlippageRef.current = slippage

  useEffect(() => {
    const isStableCoinSwap =
      chainId &&
      inputCurrencyId &&
      outputCurrencyId &&
      STABLE_COINS_ADDRESS[chainId].includes(inputCurrencyId) &&
      STABLE_COINS_ADDRESS[chainId].includes(outputCurrencyId)

    if (isStableCoinSwap && rawSlippageRef.current > DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP) {
      setSlippage(DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP)
    }
  }, [chainId, inputCurrencyId, outputCurrencyId, setSlippage])
}

export default useUpdateSlippageInStableCoinSwap
