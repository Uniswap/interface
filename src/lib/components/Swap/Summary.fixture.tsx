import { tokens } from '@uniswap/default-token-list'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { Field, outputAtom, stateAtom } from 'lib/state/swap'
import { useEffect, useState } from 'react'
import { useValue } from 'react-cosmos/fixture'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import invariant from 'tiny-invariant'

import { Modal } from '../Dialog'
import { SummaryDialog } from './Summary'

const ETH = nativeOnChain(SupportedChainId.MAINNET)
const UNI = (function () {
  const token = tokens.find(({ symbol }) => symbol === 'UNI')
  invariant(token)
  return new WrappedTokenInfo(token)
})()

function Fixture() {
  const setState = useUpdateAtom(stateAtom)
  const [, setInitialized] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setState({
      activeInput: Field.INPUT,
      input: { token: ETH, value: 1, usdc: 4195 },
      output: { token: UNI, value: 42, usdc: 42 },
      swap: {
        lpFee: 0.0005,
        integratorFee: 0.00025,
        priceImpact: 0.01,
        slippageTolerance: 0.5,
        minimumReceived: 4190,
      },
    })
    setInitialized(true)
  })

  const setOutput = useUpdateAtom(outputAtom)
  const [price] = useValue('output value', { defaultValue: 4200 })
  useEffect(() => {
    setState((state) => ({ ...state, output: { token: UNI, value: price, usdc: price } }))
  }, [price, setOutput, setState])

  return (
    <Modal color="dialog">
      <SummaryDialog onConfirm={() => void 0} />
    </Modal>
  )
}

export default <Fixture />
