import { useUpdateAtom } from 'jotai/utils'
import { DAI, ETH } from 'lib/mocks'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'

import { Modal } from '../Dialog'
import Widget from '../Widget'
import { inputAtom, outputAtom, State, swapAtom } from './state'
import { SwapSummaryDialog } from './SwapSummary'

function Fixture() {
  const setInput = useUpdateAtom(inputAtom)
  const setOutput = useUpdateAtom(outputAtom)
  const setSwap = useUpdateAtom(swapAtom)

  useEffect(() => {
    setInput(() => ({ token: ETH, value: 1 }))
    setOutput(() => ({ token: DAI, value: 4200 }))
    setSwap({
      state: State.LOADED,
      input: { usdc: 4195 },
      output: { usdc: 4200 },
      lpFee: 0.0005,
      priceImpact: 0.01,
      slippageTolerance: 0.5,
      minimumReceived: 4190,
    })
  })

  const [price] = useValue('value', { defaultValue: 4200 })
  useEffect(() => {
    setOutput({ token: DAI, value: price })
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
