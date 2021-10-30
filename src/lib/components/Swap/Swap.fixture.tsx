import { RESET, useUpdateAtom } from 'jotai/utils'
import { DAI, ETH } from 'lib/mocks'
import { useEffect } from 'react'
import { useSelect } from 'react-cosmos/fixture'

import Widget from '../Widget'
import Swap from '.'
import { inputAtom, outputAtom, State, swapAtom } from './state'

function Fixture() {
  const setInput = useUpdateAtom(inputAtom)
  const setOutput = useUpdateAtom(outputAtom)
  const setSwap = useUpdateAtom(swapAtom)

  const [state] = useSelect('state', {
    options: ['EMPTY', 'LOADING', 'TOKEN APPROVAL', 'BALANCE INSUFFICIENT', 'LOADED'],
  })
  useEffect(() => {
    switch (state) {
      case 'EMPTY':
        setInput(RESET)
        setOutput(RESET)
        setSwap({ state: State.EMPTY })
        break
      case 'LOADING':
        setSwap({ state: State.LOADING })
        break
      case 'TOKEN APPROVAL':
        setInput((value) => (value.token ? value : { token: ETH }))
        setSwap({ state: State.TOKEN_APPROVAL })
        break
      case 'BALANCE INSUFFICIENT':
        setInput((value) => (value.token ? value : { token: ETH }))
        setSwap({ state: State.BALANCE_INSUFFICIENT })
        break
      case 'LOADED':
        setInput((value) => (value.token && value.value ? value : { token: ETH, value: 1 }))
        setOutput((value) => (value.token && value.value ? value : { token: DAI, value: 4200 }))
        setSwap({
          state: State.LOADED,
          input: { usdc: 4195 },
          output: { usdc: 4200 },
          lpFee: 0.0005,
          priceImpact: 0.01,
          slippageTolerance: 0.5,
          minimumReceived: 4190,
        })
        break
    }
  }, [setInput, setOutput, setSwap, state])
  return <Swap />
}

export default (
  <Widget>
    <Fixture />
  </Widget>
)
