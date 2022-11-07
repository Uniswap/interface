import { Currency } from '@uniswap/sdk-core'
import { BigNumberish } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useCurrency } from 'src/features/tokens/useCurrency'
import {
  makeSelectAddressTransactions,
  makeSelectTransaction,
} from 'src/features/transactions/selectors'
import {
  createSwapFromStateFromDetails,
  createWrapFormStateFromDetails,
} from 'src/features/transactions/swap/createSwapFromStateFromDetails'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { dimensions } from 'src/styles/sizing'

// sorted oldest to newest
export function useSortedTransactions(address: Address | null) {
  const transactions = useSelectAddressTransactions(address)

  return useMemo(() => {
    if (!transactions) return
    return transactions.sort((a, b) => a.addedTime - b.addedTime)
  }, [transactions])
}

export function usePendingTransactions(address: Address | null) {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.filter((tx) => tx.status === TransactionStatus.Pending)
  }, [transactions])
}

// sorted oldest to newest
export function useSortedPendingTransactions(address: Address | null) {
  const transactions = usePendingTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.sort((a, b) => a.addedTime - b.addedTime)
  }, [transactions])
}

export function useSelectTransaction(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionDetails | undefined {
  return useAppSelector(makeSelectTransaction(address, chainId, txId))
}

export function useSelectAddressTransactions(address: Address | null) {
  return useAppSelector(makeSelectAddressTransactions(address))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
) {
  const transaction = useSelectTransaction(address, chainId, txId)

  const inputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.inputCurrencyId
      : undefined

  const outputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.outputCurrencyId
      : undefined

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createSwapFromStateFromDetails({
      transactionDetails: transaction,
      inputCurrency,
      outputCurrency,
    })
  }, [chainId, inputCurrency, outputCurrency, transaction, txId])
}

export function useCreateWrapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined,
  inputCurrency: Currency,
  outputCurrency: Currency
) {
  const transaction = useSelectTransaction(address, chainId, txId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createWrapFormStateFromDetails({
      transactionDetails: transaction,
      inputCurrency,
      outputCurrency,
    })
  }, [chainId, inputCurrency, outputCurrency, transaction, txId])
}

/**
 * Merge local and remote transactions. If duplicated hash found use data from local store.
 */
export function useMergeLocalAndRemoteTransactions(
  address: string,
  remoteTransactions: TransactionDetails[]
) {
  const localTransactions = useSelectAddressTransactions(address)

  // Merge local and remote txns into array of single type.
  const combinedTransactionList = useMemo(() => {
    if (!address) return []
    const localHashes: Set<string> = new Set()
    localTransactions?.map((t) => {
      localHashes.add(t.hash)
    })
    const formattedRemote = remoteTransactions.reduce((accum: TransactionDetails[], txn) => {
      if (!localHashes.has(txn.hash)) accum.push(txn) // dedupe
      return accum
    }, [])
    return (localTransactions ?? [])
      .concat(formattedRemote)
      .sort((a, b) => (a.addedTime > b.addedTime ? -1 : 1))
  }, [address, localTransactions, remoteTransactions])

  return combinedTransactionList
}

export function useLowestPendingNonce() {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const pending = usePendingTransactions(activeAccountAddress)

  return useMemo(() => {
    let min: BigNumberish | undefined
    if (!pending) return
    pending.map((txn) => {
      const currentNonce = txn.options?.request?.nonce
      min = min ? (currentNonce ? (min < currentNonce ? min : currentNonce) : min) : currentNonce
    })
    return min
  }, [pending])
}

/**
 * Gets all transactions from a given sender and to a given recipient
 * @param sender Get all transactions sent by this sender
 * @param recipient Then filter so that we only keep txns to this recipient
 */
export function useAllTransactionsBetweenAddresses(
  sender: Address,
  recipient: string | undefined | null
): TransactionDetails[] {
  const txnsToSearch = useSelectAddressTransactions(sender)
  return useMemo(() => {
    if (!sender || !recipient || !txnsToSearch) return EMPTY_ARRAY
    const commonTxs = txnsToSearch.filter(
      (tx) => tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient === recipient
    )
    return commonTxs.length ? commonTxs : EMPTY_ARRAY
  }, [recipient, sender, txnsToSearch])
}

const SCREEN_HEIGHT_BUFFER = 0.9

export function useShouldShowNativeKeyboard() {
  // use initial content height only to determine native keyboard view
  // because show/hiding the custom keyboard will change the content height
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)

  // TODO: onLayout doesn't work anymore after some formatting changes T_T
  // investigate how to fix for smaller phones if we don't move fully to using native keyboards
  const onLayout = (event: LayoutChangeEvent) => {
    const totalHeight = event.nativeEvent.layout.height
    if (initialContentHeight !== undefined) return

    setInitialContentHeight(totalHeight)
  }
  const isSmallDevice = Boolean(
    initialContentHeight && dimensions.fullHeight * SCREEN_HEIGHT_BUFFER < initialContentHeight
  )

  return { onLayout, showNativeKeyboard: isSmallDevice }
}

export function useDynamicFontSizing(
  maxCharWidthAtMaxFontSize: number,
  maxFontSize: number,
  minFontSize: number
) {
  const [fontSize, setFontSize] = useState(maxFontSize)
  const [textInputElementWidth, setTextInputElementWidth] = useState<number>(0)

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (textInputElementWidth) return

      const width = event.nativeEvent.layout.width
      setTextInputElementWidth(width)
    },
    [setTextInputElementWidth, textInputElementWidth]
  )

  const onSetFontSize = useCallback(
    (amount: string) => {
      const stringWidth = getStringWidth(amount, maxCharWidthAtMaxFontSize, fontSize, maxFontSize)
      const scaledSize = fontSize * (textInputElementWidth / stringWidth)
      const scaledSizeWithMin = Math.max(scaledSize, minFontSize)
      const newFontSize = Math.round(Math.min(maxFontSize, scaledSizeWithMin))
      setFontSize(newFontSize)
    },
    [fontSize, maxFontSize, minFontSize, maxCharWidthAtMaxFontSize, textInputElementWidth]
  )

  return { onLayout, fontSize, onSetFontSize }
}

const getStringWidth = (
  value: string,
  maxCharWidthAtMaxFontSize: number,
  currentFontSize: number,
  maxFontSize: number
) => {
  const widthAtMaxFontSize = value.length * maxCharWidthAtMaxFontSize
  return widthAtMaxFontSize * (currentFontSize / maxFontSize)
}
