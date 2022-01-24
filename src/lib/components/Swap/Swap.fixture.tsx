import { tokens } from '@uniswap/default-token-list'
import { useUpdateAtom } from 'jotai/utils'
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

function Fixture() {
  const setColor = useUpdateAtom(colorAtom)
  const [color] = useValue('token color', { defaultValue: '' })
  useEffect(() => {
    if (!color || validateColor(color)) {
      setColor(color)
    }
  }, [color, setColor])

  const [defaultInputAddress] = useValue('default InputAddress', { defaultValue: '' })
  const [defaultInputAmount] = useValue('default InputAmount', { defaultValue: '' })
  const [defaultOutputAddress] = useValue('default OutputAddress', { defaultValue: '' })
  const [defaultOutputAmount] = useValue('default OutputAmount', { defaultValue: '' })

  return (
    <Swap
      tokenList={tokens}
      defaultInputAddress={defaultInputAddress}
      defaultInputAmount={defaultInputAmount}
      defaultOutputAddress={defaultOutputAddress}
      defaultOutputAmount={defaultOutputAmount}
    />
  )
}

export default <Fixture />
