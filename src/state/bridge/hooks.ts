import { AppState, AppDispatch } from '../index'
import { useSelector, useDispatch } from 'react-redux'
import { useCallback, useMemo } from 'react'
import { useAsyncMemo } from 'use-async-memo'
import { typeInput, Field, BridgeTransactionStatus } from './actions'
import { Currency, CurrencyAmount } from '@fuseio/fuse-swap-sdk'
import { useCurrencyBalances } from '../wallet/hooks'
import { useActiveWeb3React, useChain } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'
import { DEFAULT_CONFIRMATIONS_LIMIT, HOME_TO_FOREIGN_FEE_TYPE_HASH } from '../../constants/bridge'
import { useCurrency } from '../../hooks/Tokens'
import { getMinMaxPerTxn } from './limits'
import {
  getHomeMultiAMBErc20ToErc677Contract,
  getHomeMultiErc20ToErc677BridgeAddress,
  isMultiErc20ToErc677BridgeToken
} from '../../utils'
import { formatEther } from 'ethers/lib/utils'

export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useDerivedBridgeInfo(
  tokenAddress: string | undefined
): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  inputError?: string
  bridgeTransactionStatus: BridgeTransactionStatus
  confirmations: number
  bridgeFee?: string
} {
  const { account, chainId, library } = useActiveWeb3React()

  const { isHome } = useChain()

  const inputCurrency = useCurrency(tokenAddress)

  const { independentField, typedValue, bridgeTransactionStatus, confirmations } = useBridgeState()

  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency ?? undefined
    }),
    [inputCurrency]
  )

  const balances = useCurrencyBalances(account ?? undefined, [currencies[Field.INPUT]])

  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.INPUT]: balances[0]
  }

  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])

  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.INPUT]: independentAmount
  }

  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined)

  const { [Field.INPUT]: inputAmount } = parsedAmounts

  const minMaxAmount = useAsyncMemo(async () => {
    if (!tokenAddress || !chainId || !library || !account) return
    try {
      return await getMinMaxPerTxn(tokenAddress, inputCurrency?.decimals, isHome, chainId, library, account)
    } catch (e) {
      console.error(`Failed to fetch min max amount`)
      return { minAmount: '0', maxAmount: '1000' }
    }
  }, [tokenAddress, inputCurrency])

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!currencies[Field.INPUT]) {
    inputError = inputError ?? 'Select a token'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount'
  }

  if (minMaxAmount && Number(typedValue) < Number(minMaxAmount.minAmount)) {
    inputError = inputError ?? `Below minimum limit (${minMaxAmount.minAmount})`
  }

  if (inputAmount && currencyBalances?.[Field.INPUT]?.lessThan(inputAmount)) {
    inputError = 'Insufficient ' + currencies[Field.INPUT]?.symbol + ' balance'
  }

  if (minMaxAmount && Number(typedValue) > Number(minMaxAmount.maxAmount)) {
    inputError = inputError ?? `Above maximum limit (${minMaxAmount.maxAmount})`
  }

  return {
    currencies,
    currencyBalances,
    parsedAmounts,
    inputError,
    bridgeTransactionStatus,
    confirmations
  }
}

export function useBridgeStatus(bridgeStatus: BridgeTransactionStatus): string {
  const { confirmations } = useBridgeState()
  const { isHome } = useChain()

  return useMemo(() => {
    switch (bridgeStatus) {
      case BridgeTransactionStatus.INITIAL:
        return ''
      case BridgeTransactionStatus.TOKEN_TRANSFER_PENDING:
      case BridgeTransactionStatus.TOKEN_TRANSFER_SUCCESS:
        return 'Transfering...'
      case BridgeTransactionStatus.CONFIRMATION_TRANSACTION_PENDING:
      case BridgeTransactionStatus.CONFIRMATION_TRANSACTION_SUCCESS:
        return `Waiting for ${confirmations}/${DEFAULT_CONFIRMATIONS_LIMIT} Confirmations`
      case BridgeTransactionStatus.CONFIRM_TOKEN_TRANSFER_PENDING:
        const network = isHome ? 'Ethereum' : 'Fuse'
        return 'Moving funds to ' + network
      default:
        return ''
    }
  }, [bridgeStatus, confirmations, isHome])
}

export function useBridgeActionHandlers(): {
  onFieldInput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.INPUT, typedValue }))
    },
    [dispatch]
  )

  return { onFieldInput }
}

export function useBridgeFee(tokenAddress: string | undefined) {
  const { chainId, account, library } = useActiveWeb3React()

  return useAsyncMemo(async () => {
    if (!chainId || !account || !library || !tokenAddress || !isMultiErc20ToErc677BridgeToken(tokenAddress)) return

    const address = getHomeMultiErc20ToErc677BridgeAddress()
    const contract = getHomeMultiAMBErc20ToErc677Contract(address, library, account)
    const fee = await contract.getFee(HOME_TO_FOREIGN_FEE_TYPE_HASH, tokenAddress)
    return formatEther(fee)
  }, [account, chainId, library, tokenAddress])
}

export function useCalculatedBridgeFee(tokenAddress: string | undefined, currencyAmount: CurrencyAmount | undefined) {
  const { chainId, account, library } = useActiveWeb3React()
  const amount = currencyAmount?.raw?.toString()

  return useAsyncMemo(async () => {
    if (!chainId || !account || !library || !tokenAddress || !amount || !isMultiErc20ToErc677BridgeToken(tokenAddress))
      return

    const address = getHomeMultiErc20ToErc677BridgeAddress()
    const contract = getHomeMultiAMBErc20ToErc677Contract(address, library, account)
    const fee = await contract.calculateFee(HOME_TO_FOREIGN_FEE_TYPE_HASH, tokenAddress, amount)
    return formatEther(fee)
  }, [account, chainId, amount, library, tokenAddress])
}
