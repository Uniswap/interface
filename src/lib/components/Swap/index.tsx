import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { ALL_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import { useAtom } from 'jotai'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import useSyncConvenienceFee from 'lib/hooks/swap/useSyncConvenienceFee'
import useSyncSwapDefaults from 'lib/hooks/swap/useSyncSwapDefaults'
import { usePendingTransactions } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList from 'lib/hooks/useTokenList'
import { displayTxHashAtom } from 'lib/state/swap'
import { SwapTransactionInfo, Transaction, TransactionType } from 'lib/state/transactions'
import { useMemo, useState } from 'react'

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
  onConnectWallet?: () => void
}

export default function Swap(props: SwapProps) {
  const list = useTokenList(props.tokenList)
  useSyncSwapDefaults(props)
  useSyncConvenienceFee(props)

  const { active, account, chainId } = useActiveWeb3React()
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)

  const [displayTxHash, setDisplayTxHash] = useAtom(displayTxHashAtom)
  const pendingTxs = usePendingTransactions()
  const displayTx = getSwapTx(pendingTxs, displayTxHash)

  const onSupportedChain = useMemo(
    () => chainId && ALL_SUPPORTED_CHAIN_IDS.includes(chainId) && list.some((token) => token.chainId === chainId),
    [chainId, list]
  )

  const [focused, setFocused] = useState(false)

  return (
    <SwapPropValidator {...props}>
      {onSupportedChain && <SwapInfoUpdater />}
      <Header title={<Trans>Swap</Trans>}>
        {active && <Wallet disabled={!account} onClick={props.onConnectWallet} />}
        <Settings disabled={!active} />
      </Header>
      <div onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} ref={setBoundary}>
        <BoundaryProvider value={boundary}>
          <Input disabled={!active} focused={focused} />
          <ReverseButton disabled={!active} />
          <Output disabled={!active} focused={focused}>
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
