import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { nativeOnChain } from 'constants/tokens'
import { useAtom } from 'jotai'
import { useSwapAmount, useSwapCurrency } from 'lib/hooks/swap'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import { usePendingTransactions } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList, { DEFAULT_TOKEN_LIST } from 'lib/hooks/useTokenList'
import { displayTxHashAtom, Field } from 'lib/state/swap'
import { SwapTransactionInfo, Transaction, TransactionType } from 'lib/state/transactions'
import { useLayoutEffect, useMemo, useState } from 'react'

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
import Toolbar from './Toolbar'

interface DefaultTokenAmount {
  address?: string | { [chainId: number]: string }
  amount?: number
}

interface SwapDefaults {
  tokenList: string | TokenInfo[]
  input: DefaultTokenAmount
  output: DefaultTokenAmount
}

const DEFAULT_INPUT: DefaultTokenAmount = { address: 'ETH' }
const DEFAULT_OUTPUT: DefaultTokenAmount = {}

function useSwapDefaults(defaults: Partial<SwapDefaults> = {}): SwapDefaults {
  const tokenList = defaults.tokenList || DEFAULT_TOKEN_LIST
  const input: DefaultTokenAmount = defaults.input || DEFAULT_INPUT
  const output: DefaultTokenAmount = defaults.output || DEFAULT_OUTPUT
  input.amount = input.amount || 0
  output.amount = output.amount || 0
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ tokenList, input, output }), [])
}

function getSwapTx(txs: { [hash: string]: Transaction }, hash?: string): Transaction<SwapTransactionInfo> | undefined {
  if (hash) {
    const tx = txs[hash]
    if (tx.info.type === TransactionType.SWAP) {
      return tx as Transaction<SwapTransactionInfo>
    }
  }
  return
}

export interface SwapProps {
  convenienceFee?: number
  convenienceFeeRecipient?: string // TODO: improve typing to require recipient when fee is set
  defaults?: Partial<SwapDefaults>
}

export default function Swap({ defaults }: SwapProps) {
  const { tokenList } = useSwapDefaults(defaults)
  useTokenList(tokenList)

  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const { chainId, active, account } = useActiveWeb3React()

  // Switch to on-chain currencies if/when chain changes to prevent chain mismatched currencies.
  const [, updateSwapInputCurrency] = useSwapCurrency(Field.INPUT)
  const [, updateSwapOutputCurrency] = useSwapCurrency(Field.OUTPUT)
  const [, updateSwapInputAmount] = useSwapAmount(Field.INPUT)
  useLayoutEffect(() => {
    if (chainId) {
      updateSwapInputCurrency(nativeOnChain(chainId))
      updateSwapOutputCurrency()
      updateSwapInputAmount('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  const [displayTxHash, setDisplayTxHash] = useAtom(displayTxHashAtom)
  const pendingTxs = usePendingTransactions()
  const displayTx = getSwapTx(pendingTxs, displayTxHash)

  return (
    <>
      <SwapInfoUpdater />
      <Header logo title={<Trans>Swap</Trans>}>
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
    </>
  )
}
