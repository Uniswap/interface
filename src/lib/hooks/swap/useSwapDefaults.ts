import { useUpdateAtom } from 'jotai/utils'
import { DefaultAddress } from 'lib/components/Swap'
import { useSwapAmount, useSwapCurrency } from 'lib/hooks/swap'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useToken } from 'lib/hooks/useCurrency'
import { Field, swapDefaultsAtom } from 'lib/state/swap'
import { useCallback, useEffect, useState } from 'react'

export default function useSwapDefaults(
  defaultInputAddress: DefaultAddress | undefined,
  defaultInputAmount: string | undefined,
  defaultOutputAddress: DefaultAddress | undefined,
  defaultOutputAmount: string | undefined
) {
  const setDefaults = useUpdateAtom(swapDefaultsAtom)
  const [, updateSwapInputCurrency] = useSwapCurrency(Field.INPUT)
  const [, updateSwapOutputCurrency] = useSwapCurrency(Field.OUTPUT)
  const [, updateSwapInputAmount] = useSwapAmount(Field.INPUT)
  const [, updateSwapOutputAmount] = useSwapAmount(Field.OUTPUT)
  const { chainId } = useActiveWeb3React()

  useEffect(() => {
    // alter default values if they have changed
    setDefaults({ defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount })
  }, [defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount, setDefaults])

  const inputAddress =
    typeof defaultInputAddress === 'string'
      ? defaultInputAddress
      : defaultInputAddress && chainId
      ? defaultInputAddress[chainId]
      : undefined
  const outputAddress =
    typeof defaultOutputAddress === 'string'
      ? defaultOutputAddress
      : defaultOutputAddress && chainId
      ? defaultOutputAddress[chainId]
      : undefined
  const defaultInputToken = useToken(inputAddress)
  const defaultOutputToken = useToken(outputAddress)

  const setToDefaults = useCallback(() => {
    if (defaultInputToken) {
      updateSwapInputCurrency(defaultInputToken)
    }
    if (defaultOutputToken) {
      updateSwapOutputCurrency(defaultOutputToken)
    }

    if (defaultInputAmount) {
      updateSwapInputAmount(defaultInputAmount)
    } else if (defaultOutputAmount) {
      updateSwapOutputAmount(defaultOutputAmount)
    }
  }, [
    defaultInputToken,
    defaultOutputToken,
    defaultInputAmount,
    defaultOutputAmount,
    updateSwapInputCurrency,
    updateSwapOutputCurrency,
    updateSwapInputAmount,
    updateSwapOutputAmount,
  ])

  const [previousChainId, setPreviousChainId] = useState(chainId)
  useEffect(() => {
    if (chainId && chainId !== previousChainId) {
      setPreviousChainId(chainId)
      setToDefaults()
    }
    // intentionally omit (set)previousChainId check here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])
}
