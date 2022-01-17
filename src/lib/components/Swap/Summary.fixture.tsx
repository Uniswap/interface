import { useUpdateAtom } from 'jotai/utils'
import useToken from 'lib/cosmos/hooks/useToken'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { Field, outputAtom, stateAtom } from 'lib/state/swap'
import { useEffect, useState } from 'react'
import { useValue } from 'react-cosmos/fixture'

import { Modal } from '../Dialog'
import { SummaryDialog } from './Summary'

function Fixture() {
  const setState = useUpdateAtom(stateAtom)
  const [, setInitialized] = useState(false)
  const nativeCurrency = useNativeCurrency()
  const token = useToken()
  useEffect(() => {
    setState({
      activeInput: Field.INPUT,
      input: { token: nativeCurrency, value: 1, usdc: 4195 },
      output: { token, value: 42, usdc: 42 },
      swap: {
        lpFee: 0.0005,
        integratorFee: 0.00025,
        priceImpact: 0.01,
        slippageTolerance: 0.5,
        minimumReceived: 4190,
      },
    })
    setInitialized(true)
  }, [setState, nativeCurrency, token])

  const setOutput = useUpdateAtom(outputAtom)
  const [price] = useValue('output value', { defaultValue: 4200 })
  useEffect(() => {
    setState((state) => ({ ...state, output: { token, value: price, usdc: price } }))
  }, [token, price, setOutput, setState])

  return (
    <Modal color="dialog">
      <SummaryDialog onConfirm={() => void 0} />
    </Modal>
  )
}

export default <Fixture />
