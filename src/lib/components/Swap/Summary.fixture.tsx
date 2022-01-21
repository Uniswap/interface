import { tokens } from '@uniswap/default-token-list'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { Field, swapAtom } from 'lib/state/swap'
import { useEffect, useState } from 'react'
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
  const [initialized, setInitialized] = useState(false)
  const setState = useUpdateAtom(swapAtom)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setState({
      independentField: Field.INPUT,
      amount: '1',
      [Field.INPUT]: ETH,
      [Field.OUTPUT]: UNI,
    })
    setInitialized(true)
  })

  return initialized ? (
    <Modal color="dialog">
      <SummaryDialog onConfirm={() => void 0} />
    </Modal>
  ) : null
}

export default <Fixture />
