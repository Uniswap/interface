import { tokens } from '@uniswap/default-token-list'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { useDerivedSwapInfo, useSwapActionHandlers } from 'lib/hooks/swap'
import { Field } from 'lib/state/swap'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import invariant from 'tiny-invariant'

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

const ETH = nativeOnChain(SupportedChainId.MAINNET)
const UNI = (function () {
  const token = tokens.find(({ symbol }) => symbol === 'UNI')
  invariant(token)
  return new WrappedTokenInfo(token)
})()

function Fixture() {
  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const {
    currencies: { [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency },
  } = useDerivedSwapInfo()

  useEffect(() => {
    if (!(inputCurrency && outputCurrency)) {
      onCurrencySelection(Field.INPUT, ETH)
      onCurrencySelection(Field.OUTPUT, UNI)
    }
  }, [inputCurrency, onCurrencySelection, onUserInput, outputCurrency])

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
