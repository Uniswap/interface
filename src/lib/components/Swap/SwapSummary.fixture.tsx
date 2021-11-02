import { useUpdateAtom } from 'jotai/utils'
import { DAI, ETH } from 'lib/mocks'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'

import { Modal } from '../Dialog'
import Widget from '../Widget'
import { Field, outputAtom, State, swapAtom } from './state'
import { SwapSummaryDialog } from './SwapSummary'

function Fixture() {
  const setSwap = useUpdateAtom(swapAtom)
  useEffect(() => {
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
  })

  const setOutput = useUpdateAtom(outputAtom)
  const [price] = useValue('value', { defaultValue: 4200 })
  useEffect(() => {
    setOutput({ token: DAI, value: price, usdc: price })
  }, [price, setOutput])

  return (
    <Modal color="dialog">
      <SwapSummaryDialog />
    </Modal>
  )
}

export default (
  <Widget>
    <Fixture />
  </Widget>
)
