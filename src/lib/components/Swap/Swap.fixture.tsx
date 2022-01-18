import { tokens } from '@uniswap/default-token-list'
import { ChainId } from '@uniswap/smart-order-router'
import { DAI, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { useDerivedSwapInfo, useSwapActionHandlers } from 'lib/hooks/swap'
import { Field } from 'lib/state/swap'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'

import Swap from '.'
import { colorAtom } from './Output'

const validateColor = (() => {
  const validator = document.createElement('div').style
  return (color: string) => {
    validator.color = ''
    validator.color = color
    return validator.color !== ''
  }
})()

const ETH = WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET]

function Fixture() {
  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const {
    trade,
    currencies: { [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency },
    parsedAmounts: { [Field.INPUT]: inputAmount },
  } = useDerivedSwapInfo()

  useEffect(() => {
    if (inputCurrency && outputCurrency) {
      if (!(inputAmount && inputCurrency && outputCurrency)) {
        onCurrencySelection(Field.INPUT, ETH)
        onCurrencySelection(Field.OUTPUT, DAI)
        onUserInput(Field.INPUT, '1')
      }
    }
  }, [inputAmount, inputCurrency, onCurrencySelection, onUserInput, outputCurrency, trade])

  const setColor = useUpdateAtom(colorAtom)
  const [color] = useValue('token color', { defaultValue: '' })
  useEffect(() => {
    if (!color || validateColor(color)) {
      setColor(color)
    }
  }, [color, setColor])

  return <Swap defaults={{ tokenList: tokens }} />
}

export default <Fixture />
