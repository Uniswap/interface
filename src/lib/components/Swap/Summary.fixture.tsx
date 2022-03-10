import { tokens } from '@uniswap/default-token-list'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { useSwapInfo } from 'lib/hooks/swap'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import { Field, swapAtom } from 'lib/state/swap'
import { useEffect } from 'react'
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
  const setState = useUpdateAtom(swapAtom)
  const {
    slippage,
    trade: { trade },
  } = useSwapInfo()

  useEffect(() => {
    setState({
      independentField: Field.INPUT,
      amount: '1',
      [Field.INPUT]: ETH,
      [Field.OUTPUT]: UNI,
    })
  }, [setState])

  return trade ? (
    <Modal color="dialog">
      <SummaryDialog onConfirm={() => void 0} trade={trade} slippage={slippage} />
    </Modal>
  ) : null
}

export default (
  <>
    <SwapInfoUpdater />
    <Fixture />
  </>
)
