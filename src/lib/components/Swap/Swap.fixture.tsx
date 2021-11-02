import { useUpdateAtom } from 'jotai/utils'
import { DAI, ETH } from 'lib/mocks'
import { useEffect } from 'react'
import { useSelect } from 'react-cosmos/fixture'

import Widget from '../Widget'
import Swap from '.'
import { Field, inputAtom, outputAtom, State, stateAtom, swapAtom } from './state'

function Fixture() {
  const setInput = useUpdateAtom(inputAtom)
  const setOutput = useUpdateAtom(outputAtom)
  const setState = useUpdateAtom(stateAtom)
  const setSwap = useUpdateAtom(swapAtom)

  const [state] = useSelect('state', {
    options: ['EMPTY', 'LOADING', 'TOKEN APPROVAL', 'BALANCE INSUFFICIENT', 'LOADED'],
  })
  useEffect(() => {
    switch (state) {
      case 'EMPTY':
        setInput({ token: ETH })
        setOutput({})
        setState(State.EMPTY)
        break
      case 'LOADING':
        setState(State.LOADING)
        break
      case 'TOKEN APPROVAL':
        setInput({ token: ETH })
        setState(State.TOKEN_APPROVAL)
        break
      case 'BALANCE INSUFFICIENT':
        setInput({ token: ETH })
        setState(State.BALANCE_INSUFFICIENT)
        break
      case 'LOADED':
        setSwap({
          state: State.LOADED,
          activeInput: Field.INPUT,
          input: { token: ETH, value: 1, usdc: 4195 },
          output: { token: DAI, value: 4200, usdc: 4200 },
          swap: {
            lpFee: 0.0005,
            priceImpact: 0.01,
            slippageTolerance: 0.5,
            minimumReceived: 4190,
          },
        })
        break
    }
  }, [setInput, setOutput, setState, setSwap, state])
  return <Swap />
}

export default (
  <Widget>
    <Fixture />
  </Widget>
)
