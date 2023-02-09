import { Currency } from '@uniswap/sdk-core'
import { BigNumberish } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import {
  makeSelectAddressTransactions,
  makeSelectTransaction,
} from 'src/features/transactions/selectors'
import {
  createSwapFromStateFromDetails,
  createWrapFormStateFromDetails,
} from 'src/features/transactions/swap/createSwapFromStateFromDetails'
import { TransactionState } from 'src/features/transactions/transactionState/transactionState'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { theme } from 'src/styles/theme'

// TODO(MOB-3968): Add more specific type definition here
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function usePendingTransactions(
  address: Address | null,
  ignoreTransactionTypes = [TransactionType.FiatPurchase]
) {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.filter(
      (tx: { status: TransactionStatus; typeInfo: { type: TransactionType } }) =>
        tx.status === TransactionStatus.Pending &&
        !ignoreTransactionTypes.includes(tx.typeInfo.type)
    )
  }, [ignoreTransactionTypes, transactions])
}

// sorted oldest to newest
// TODO(MOB-3968): Add more specific type definition here
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useSortedPendingTransactions(address: Address | null) {
  const transactions = usePendingTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.sort(
      (a: TransactionDetails, b: TransactionDetails) => a.addedTime - b.addedTime
    )
  }, [transactions])
}

export function useSelectTransaction(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionDetails | undefined {
  return useAppSelector(makeSelectTransaction(address, chainId, txId))
}

export function useSelectAddressTransactions(address: Address | null): TransactionDetails[] {
  return useAppSelector(makeSelectAddressTransactions(address))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionState | undefined {
  const transaction = useSelectTransaction(address, chainId, txId)

  const inputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.inputCurrencyId
      : undefined

  const outputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.outputCurrencyId
      : undefined

  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(outputCurrencyId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createSwapFromStateFromDetails({
      transactionDetails: transaction,
      inputCurrency: inputCurrencyInfo?.currency,
      outputCurrency: outputCurrencyInfo?.currency,
    })
  }, [chainId, inputCurrencyInfo, outputCurrencyInfo, transaction, txId])
}

export function useCreateWrapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined,
  inputCurrency: NullUndefined<Currency>,
  outputCurrency: NullUndefined<Currency>
): TransactionState | undefined {
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
// TODO(MOB-3968): Add more specific type definition here
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useMergeLocalAndRemoteTransactions(
  address: string,
  remoteTransactions: TransactionDetails[]
) {
  const localTransactions = useSelectAddressTransactions(address)

  // Merge local and remote txns into array of single type.
  const combinedTransactionList = useMemo(() => {
    if (!address) return EMPTY_ARRAY
    const localHashes: Set<string> = new Set()
    localTransactions?.map((t: { hash: string }) => {
      localHashes.add(t.hash)
    })
    const formattedRemote = remoteTransactions.reduce((accum: TransactionDetails[], txn) => {
      if (!localHashes.has(txn.hash)) accum.push(txn) // dedupe
      return accum
    }, [])
    return (localTransactions ?? [])
      .concat(formattedRemote)
      .sort((a: TransactionDetails, b: TransactionDetails) => (a.addedTime > b.addedTime ? -1 : 1))
  }, [address, localTransactions, remoteTransactions])

  return combinedTransactionList
}

export function useLowestPendingNonce(): BigNumberish | undefined {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const pending = usePendingTransactions(activeAccountAddress)

  return useMemo(() => {
    let min: BigNumberish | undefined
    if (!pending) return
    pending.map((txn: TransactionDetails) => {
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
  // TODO(MOB-3968): Add more specific type definition here
  const txnsToSearch = useSelectAddressTransactions(sender)
  return useMemo(() => {
    if (!sender || !recipient || !txnsToSearch) return EMPTY_ARRAY
    const commonTxs = txnsToSearch.filter(
      (tx: TransactionDetails) =>
        tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient === recipient
    )
    return commonTxs.length ? commonTxs : EMPTY_ARRAY
  }, [recipient, sender, txnsToSearch])
}

const MIN_INPUT_DECIMALPAD_GAP = theme.spacing.spacing12

export function useShouldShowNativeKeyboard(): {
  onInputPanelLayout: (event: LayoutChangeEvent) => void
  onDecimalPadLayout: (event: LayoutChangeEvent) => void
  isLayoutPending: boolean
  showNativeKeyboard: boolean
} {
  const [containerHeight, setContainerHeight] = useState<number>()
  const [decimalPadY, setDecimalPadY] = useState<number>()

  const onInputPanelLayout = (event: LayoutChangeEvent): void => {
    if (containerHeight === undefined) {
      setContainerHeight(event.nativeEvent.layout.height)
    }
  }

  const onDecimalPadLayout = (event: LayoutChangeEvent): void => {
    if (decimalPadY === undefined) {
      setDecimalPadY(event.nativeEvent.layout.y)
    }
  }

  const isLayoutPending = containerHeight === undefined || decimalPadY === undefined

  // If decimal pad renders below the input panel, we need to show the native keyboard
  const showNativeKeyboard = isLayoutPending
    ? false
    : containerHeight + MIN_INPUT_DECIMALPAD_GAP > decimalPadY

  return {
    onInputPanelLayout,
    onDecimalPadLayout,
    isLayoutPending,
    showNativeKeyboard,
  }
}

export function useDynamicFontSizing(
  maxCharWidthAtMaxFontSize: number,
  maxFontSize: number,
  minFontSize: number
): {
  onLayout: (event: LayoutChangeEvent) => void
  fontSize: number
  onSetFontSize: (amount: string) => void
} {
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
): number => {
  const widthAtMaxFontSize = value.length * maxCharWidthAtMaxFontSize
  return widthAtMaxFontSize * (currentFontSize / maxFontSize)
}
