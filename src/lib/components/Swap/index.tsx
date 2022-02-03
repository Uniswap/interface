import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { useAtom } from 'jotai'
import useSwapDefaults from 'lib/hooks/swap/useSwapDefaults'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import { usePendingTransactions } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList from 'lib/hooks/useTokenList'
import { displayTxHashAtom } from 'lib/state/swap'
import { SwapTransactionInfo, Transaction, TransactionType } from 'lib/state/transactions'
import { useState } from 'react'

import Dialog from '../Dialog'
import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import Settings from './Settings'
import { StatusDialog } from './Status'
import SwapButton from './SwapButton'
import SwapPropValidator from './SwapPropValidator'
import Toolbar from './Toolbar'

export type DefaultAddress = string | { [chainId: number]: string | 'NATIVE' } | 'NATIVE'

function getSwapTx(txs: { [hash: string]: Transaction }, hash?: string): Transaction<SwapTransactionInfo> | undefined {
  if (hash) {
    const tx = txs[hash]
    if (tx?.info?.type === TransactionType.SWAP) {
      return tx as Transaction<SwapTransactionInfo>
    }
  }
  return
}

export interface SwapProps {
  tokenList?: string | TokenInfo[]
  defaultInputAddress?: DefaultAddress
  defaultInputAmount?: string
  defaultOutputAddress?: DefaultAddress
  defaultOutputAmount?: string
  convenienceFee?: number
  convenienceFeeRecipient?: string | { [chainId: number]: string }
}

export default function Swap(props: SwapProps) {
  useTokenList(props.tokenList)
  useSwapDefaults(props)

  const { active, account } = useActiveWeb3React()
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)

  const [displayTxHash, setDisplayTxHash] = useAtom(displayTxHashAtom)
  const pendingTxs = usePendingTransactions()
  const displayTx = getSwapTx(pendingTxs, displayTxHash)

  return (
    <SwapPropValidator {...props}>
      <SwapInfoUpdater />
      <Header title={<Trans>Swap</Trans>}>
        {active && <Wallet disabled={!account} />}
        <Settings disabled={!active} />
      </Header>
      <div ref={setBoundary}>
        <BoundaryProvider value={boundary}>
          <Input disabled={!active} />
          <ReverseButton disabled={!active} />
          <Output disabled={!active}>
            <Toolbar disabled={!active} />
            <SwapButton disabled={!account} />
          </Output>
        </BoundaryProvider>
      </div>
      {displayTx && (
        <Dialog color="dialog">
          <StatusDialog tx={displayTx} onClose={() => setDisplayTxHash()} />
        </Dialog>
      )}
    </SwapPropValidator>
  )
}
