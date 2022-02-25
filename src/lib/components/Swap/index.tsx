import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { ALL_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import { useAtom } from 'jotai'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import useSyncConvenienceFee from 'lib/hooks/swap/useSyncConvenienceFee'
import useSyncSwapDefaults from 'lib/hooks/swap/useSyncSwapDefaults'
import { usePendingTransactions } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useHasFocus from 'lib/hooks/useHasFocus'
import useTokenList, { useSyncTokenList } from 'lib/hooks/useTokenList'
import { displayTxHashAtom } from 'lib/state/swap'
import { SwapTransactionInfo, Transaction, TransactionType, WrapTransactionInfo } from 'lib/state/transactions'
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

function getTransactionFromMap(
  txs: { [hash: string]: Transaction },
  hash?: string
): Transaction<SwapTransactionInfo | WrapTransactionInfo> | undefined {
  if (hash) {
    const tx = txs[hash]
    if (tx?.info?.type === TransactionType.SWAP) {
      return tx as Transaction<SwapTransactionInfo>
    }
    if (tx?.info?.type === TransactionType.WRAP) {
      return tx as Transaction<WrapTransactionInfo>
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
  useSyncTokenList(props.tokenList)
  useSyncSwapDefaults(props)
  useSyncConvenienceFee(props)

  const { active, account, chainId } = useActiveWeb3React()
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null)

  const [displayTxHash, setDisplayTxHash] = useAtom(displayTxHashAtom)
  const pendingTxs = usePendingTransactions()
  const displayTx = getTransactionFromMap(pendingTxs, displayTxHash)

  const tokenList = useTokenList()
  const isSwapSupported = useMemo(
    () => Boolean(chainId && ALL_SUPPORTED_CHAIN_IDS.includes(chainId) && tokenList?.length),
    [chainId, tokenList]
  )

  const focused = useHasFocus(wrapper)

  return (
    <SwapPropValidator {...props}>
      {isSwapSupported && <SwapInfoUpdater />}
      <Header title={<Trans>Swap</Trans>}>
        {active && <Wallet disabled={!account} onClick={props.onConnectWallet} />}
        <Settings disabled={!active} />
      </Header>
      <div ref={setWrapper}>
        <BoundaryProvider value={wrapper}>
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
