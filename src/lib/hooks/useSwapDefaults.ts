import { useUpdateAtom } from 'jotai/utils'
import { DefaultAddress } from 'lib/components/Swap'
import { useSwapAmount, useSwapCurrency } from 'lib/hooks/swap'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useToken } from 'lib/hooks/useCurrency'
import { Field, swapDefaultsAtom } from 'lib/state/swap'
import { useEffect } from 'react'

export default function useSwapDefaults(
  defaultInputAddress: DefaultAddress | undefined,
  defaultInputAmount: string | undefined,
  defaultOutputAddress: DefaultAddress | undefined,
  defaultOutputAmount: string | undefined
) {
  const setDefaults = useUpdateAtom(swapDefaultsAtom)
  const [inputCurrency, updateSwapInputCurrency] = useSwapCurrency(Field.INPUT)
  const [outputCurrency, updateSwapOutputCurrency] = useSwapCurrency(Field.OUTPUT)
  const [inputAmount, updateSwapInputAmount] = useSwapAmount(Field.INPUT)
  const [outputAmount, updateSwapOutputAmount] = useSwapAmount(Field.OUTPUT)
  const { chainId } = useActiveWeb3React()

  const inputAddress =
    typeof defaultInputAddress === 'string'
      ? defaultInputAddress
      : defaultInputAddress && chainId
      ? defaultInputAddress[chainId]
      : undefined
  const defaultInputToken = useToken(inputAddress)

  const outputAddress =
    typeof defaultOutputAddress === 'string'
      ? defaultOutputAddress
      : defaultOutputAddress && chainId
      ? defaultOutputAddress[chainId]
      : undefined
  const defaultOutputToken = useToken(outputAddress)

  useEffect(() => {
    // alter default values if they have changed
    setDefaults({ defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount })
    // if no swap fields have been set, set them to defaults
    if (chainId && !inputCurrency && !outputCurrency && !inputAmount && !outputAmount) {
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
    }
  }, [defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount, setDefaults])
}
