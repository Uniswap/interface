import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { useAtom } from 'jotai'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import useSyncConvenienceFee, { FeeOptions } from 'lib/hooks/swap/useSyncConvenienceFee'
import useSyncTokenDefaults, { TokenDefaults } from 'lib/hooks/swap/useSyncTokenDefaults'
import { usePendingTransactions } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useHasFocus from 'lib/hooks/useHasFocus'
import useOnSupportedNetwork from 'lib/hooks/useOnSupportedNetwork'
import { useIsTokenListLoaded, useSyncTokenList } from 'lib/hooks/useTokenList'
import { displayTxHashAtom } from 'lib/state/swap'
import { SwapTransactionInfo, Transaction, TransactionType, WrapTransactionInfo } from 'lib/state/transactions'
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
import Toolbar from './Toolbar'
import useValidate from './useValidate'

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

export interface SwapProps extends TokenDefaults, FeeOptions {
  tokenList?: string | TokenInfo[]
  onConnectWallet?: () => void
}

function Updaters(props: SwapProps) {
  useSyncTokenDefaults(props)
  useSyncConvenienceFee(props)

  return <SwapInfoUpdater />
}

export default function Swap(props: SwapProps) {
  useValidate(props)

  const { active, account } = useActiveWeb3React()
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null)

  const [displayTxHash, setDisplayTxHash] = useAtom(displayTxHashAtom)
  const pendingTxs = usePendingTransactions()
  const displayTx = getTransactionFromMap(pendingTxs, displayTxHash)

  const onSupportedNetwork = useOnSupportedNetwork()
  const isDisabled = !(active && onSupportedNetwork)

  useSyncTokenList(props.tokenList)
  const isUpdateable = useIsTokenListLoaded() && !isDisabled

  const focused = useHasFocus(wrapper)

  return (
    <>
      {isUpdateable && <Updaters {...props} />}
      <Header title={<Trans>Swap</Trans>}>
        {active && <Wallet disabled={!account} onClick={props.onConnectWallet} />}
        <Settings disabled={isDisabled} />
      </Header>
      <div ref={setWrapper}>
        <BoundaryProvider value={wrapper}>
          <Input disabled={isDisabled} focused={focused} />
          <ReverseButton disabled={isDisabled} />
          <Output disabled={isDisabled} focused={focused}>
            <Toolbar disabled={!active} />
            <SwapButton disabled={isDisabled} />
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
