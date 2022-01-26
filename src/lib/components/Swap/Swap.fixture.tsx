import { tokens } from '@uniswap/default-token-list'
import { Token } from '@uniswap/sdk-core'
import { DAI, USDC } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

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

const UNSUPPORTED_TOKEN = new Token(1, '0xeb57bf569ad976974c1f861a5923a59f40222451', 18, 'LOOMI', 'Loomi')

function Fixture() {
  const setColor = useUpdateAtom(colorAtom)
  const [color] = useValue('token color', { defaultValue: '' })
  useEffect(() => {
    if (!color || validateColor(color)) {
      setColor(color)
    }
  }, [color, setColor])

  const optionsToAddressMap: Record<string, string> = {
    none: '',
    Native: 'NATIVE',
    DAI: DAI.address,
    USDC: USDC.address,
  }
  const addressOptions = Object.keys(optionsToAddressMap)
  const [defaultInput] = useSelect('defaultInputAddress', {
    options: addressOptions,
    defaultValue: addressOptions[0],
  })

  const inputOptions = ['', '0', '100']
  const [defaultInputAmount] = useSelect('defaultInputAmount', {
    options: inputOptions,
    defaultValue: inputOptions[3],
  })
  const [defaultOutput] = useSelect('defaultOutputAddress', {
    options: addressOptions,
    defaultValue: addressOptions[1],
  })
  const [defaultOutputAmount] = useSelect('defaultOutputAmount', {
    options: inputOptions,
    defaultValue: inputOptions[0],
  })

  return (
    <Swap
      tokenList={tokens}
      defaultInputAddress={optionsToAddressMap[defaultInput]}
      defaultInputAmount={defaultInputAmount}
      defaultOutputAddress={optionsToAddressMap[defaultOutput]}
      defaultOutputAmount={defaultOutputAmount}
    />
  )
}

export default <Fixture />
