import { useAtom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'

import Swap from '.'
import { colorAtom } from './Output'
import { inputAtom, outputAtom, swapAtom } from './state'

const validateColor = (() => {
  const validator = document.createElement('div').style
  return (color: string) => {
    validator.color = ''
    validator.color = color
    return validator.color !== ''
  }
})()

function Fixture() {
  const [input, setInput] = useAtom(inputAtom)
  const [output, setOutput] = useAtom(outputAtom)
  const [swap, setSwap] = useAtom(swapAtom)

  const [priceFetched] = useValue('price fetched', { defaultValue: false })
  useEffect(() => {
    if (priceFetched && input.token && output.token) {
      const inputValue = input.value || 1
      const outputValue = output.value || 1
      setOutput({ ...output, value: outputValue })
      setInput({ ...input, value: inputValue })
    }
    // disable the effect on input/output updates to maintain interactivity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceFetched, setInput, setOutput])
  useEffect(() => {
    if (priceFetched && !swap && input.token && input.value && output.token && output.value) {
      setOutput({ ...output, usdc: output.value })
      setInput({ ...input, usdc: input.value })
      setSwap({
        lpFee: 0.0005,
        priceImpact: 0.01,
        slippageTolerance: 0.5,
        minimumReceived: output.value * 0.995,
      })
    } else if (!priceFetched && swap) {
      setSwap(undefined)
    }
  }, [input, output, priceFetched, setInput, setOutput, setSwap, swap])

  const [tokenApproved] = useValue('token approved', { defaultValue: false })
  useEffect(() => {
    if (tokenApproved !== input.approved) {
      setInput({ ...input, approved: tokenApproved })
    }
  }, [input, setInput, tokenApproved])

  const setColor = useUpdateAtom(colorAtom)
  const [color] = useValue('token color', { defaultValue: '' })
  useEffect(() => {
    if (!color || validateColor(color)) {
      setColor(color)
    }
  }, [color, setColor])

  return <Swap />
}

export default <Fixture />
