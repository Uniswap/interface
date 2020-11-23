import { AppState, AppDispatch } from '../index'
import { TransactionResponse } from '@ethersproject/providers'
import { useSelector, useDispatch } from 'react-redux'
import { useCallback, useMemo, Dispatch } from 'react'
import { useAsyncMemo } from 'use-async-memo'
import {
  typeInput,
  Field,
  updateConfirmationsCount,
  confirmTransactionSuccess,
  confirmTransactionPending,
  confirmTokenTransferSuccess,
  confirmTokenTransferPending,
  tokenTransferPending,
  tokenTransferSuccess,
  BridgeTransactionStatus,
  transferError
} from './actions'
import { Currency, CurrencyAmount } from '@fuseio/fuse-swap-sdk'
import { useCurrencyBalances } from '../wallet/hooks'
import { useActiveWeb3React, useChain } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'
import {
  getERC677TokenContract,
  calculateGasMargin,
  getHomeBridgeContractJsonRpc,
  getForiegnBridgeContract,
  getForiegnBridgeContractJsonRpc,
  getHomeMultiBridgeContract,
  getBasicForeignBridgeAddress,
  getAMBErc677To677Contract,
  getBasicHomeBridgeAddress,
  getMinMaxPerTxn
} from '../../utils'
import { useTransactionAdder } from '../transactions/hooks'
import { getNetworkLibrary, getNetworkLibraryByChain } from '../../connectors'
import { AnyAction } from '@reduxjs/toolkit'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../constants/bridge'
import { useCurrency } from '../../hooks/Tokens'

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
    return await getMinMaxPerTxn(tokenAddress, inputCurrency?.decimals, isHome, chainId, library, account)
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
    inputError = inputError ?? 'Below minimum limit'
  }

  if (inputAmount && currencyBalances?.[Field.INPUT]?.lessThan(inputAmount)) {
    inputError = 'Insufficient ' + currencies[Field.INPUT]?.symbol + ' balance'
  }

  if (minMaxAmount && Number(typedValue) > Number(minMaxAmount.maxAmount)) {
    inputError = inputError ?? 'Above maximum limit'
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
        const network = isHome ? 'Etheruem' : 'Fuse'
        return 'Moving funds to ' + network
      default:
        return ''
    }
  }, [bridgeStatus, confirmations, isHome])
}

export function useWaitForTransaction(): (transactionHash: string, confirmationsLimit: number) => any {
  const dispatch = useDispatch<AppDispatch>()
  const { library } = useActiveWeb3React()

  return useCallback(
    async (transactionHash: string, confirmations: number) => {
      if (!library) return

      const receipt = await library.getTransactionReceipt(transactionHash)

      if ((receipt ? receipt.confirmations : 0) >= confirmations) return receipt

      dispatch(confirmTransactionPending())
      return new Promise(resolve => {
        let done = false

        const interval = setInterval(async () => {
          const receipt = await library.getTransactionReceipt(transactionHash)
          const confirmedBlocks = receipt ? receipt.confirmations : 0
          const count = confirmedBlocks

          if (!receipt) {
            dispatch(updateConfirmationsCount({ confirmations: count }))
            return
          }
          if (!done) {
            const val = count > confirmations ? confirmations : count
            dispatch(updateConfirmationsCount({ confirmations: val }))
          }
          if (count < confirmations) {
            return
          }

          done = true
          clearInterval(interval)
          dispatch(confirmTransactionSuccess())
          resolve(receipt)
        }, 500)
      })
    },
    [library, dispatch]
  )
}

function watchHomeBasicBridge(account: string, foreignTokenAddress: string, dispatch: Dispatch<AnyAction>) {
  return new Promise(resolve => {
    const address = getBasicHomeBridgeAddress(foreignTokenAddress) ?? ''
    const network = getNetworkLibrary()
    const contract = getAMBErc677To677Contract(address, network, account)

    dispatch(confirmTokenTransferPending())

    const listener = async (recipient: string) => {
      if (recipient === account) {
        contract.removeListener('TokensBridged', listener)
        dispatch(confirmTokenTransferSuccess())
        resolve()
      }
    }

    contract.on('TokensBridged', listener)
  })
}

function watchHomeMultiBridge(
  chainId: number,
  account: string,
  foreignTokenAddress: string,
  dispatch: Dispatch<AnyAction>
) {
  return new Promise<string>(resolve => {
    const contract = getHomeBridgeContractJsonRpc(chainId)

    dispatch(confirmTokenTransferPending())

    const listener = async (homeTokenAddress: string, recipient: string) => {
      const address = await contract.foreignTokenAddress(homeTokenAddress)
      if (recipient === account && foreignTokenAddress === address) {
        contract.removeListener('TokensBridged', listener)
        dispatch(confirmTokenTransferSuccess())
        resolve(homeTokenAddress)
      }
    }

    contract.on('TokensBridged', listener)
  })
}

export function useWatchForHomeBridgeEvent(): (foreignTokenAddress: string, isMultiBridge?: boolean) => any {
  const { chainId, account } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    async (foreignTokenAddress: string, isMultiBridge?: boolean) => {
      if (!chainId || !account) return

      try {
        if (isMultiBridge) {
          await watchHomeMultiBridge(chainId, account, foreignTokenAddress, dispatch)
        } else {
          await watchHomeBasicBridge(account, foreignTokenAddress, dispatch)
        }
      } catch (error) {
        console.error(error)
      }
    },
    [account, chainId, dispatch]
  )
}

function watchForeignMultiBridge(
  chainId: number,
  account: string,
  library: any,
  homeTokenAddress: string,
  dispatch: Dispatch<AnyAction>
) {
  return new Promise<string>(resolve => {
    const bridgeContract = getForiegnBridgeContractJsonRpc(chainId)

    dispatch(confirmTokenTransferPending())

    const listener = async (tokenAddress: string, recipient: string) => {
      const contract = getHomeMultiBridgeContract(library, account)
      const address = await contract.foreignTokenAddress(homeTokenAddress)

      if (recipient === account && tokenAddress === address) {
        contract.removeListener('TokensBridged', listener)
        dispatch(confirmTokenTransferSuccess())
        resolve(tokenAddress)
      }
    }

    bridgeContract.on('TokensBridged', listener)
  })
}

function watchForeignBasicBridge(
  chainId: number,
  homeTokenAddress: string,
  account: string,
  dispatch: Dispatch<AnyAction>
) {
  return new Promise(resolve => {
    const address = getBasicForeignBridgeAddress(homeTokenAddress, chainId) ?? ''
    const network = getNetworkLibraryByChain(chainId)
    const contract = getAMBErc677To677Contract(address, network, account)

    dispatch(confirmTokenTransferPending())

    const listener = async (recipient: string) => {
      if (recipient === account) {
        contract.removeListener('TokensBridged', listener)
        dispatch(confirmTokenTransferSuccess())
        resolve()
      }
    }

    contract.on('TokensBridged', listener)
  })
}

export function useWatchForForeignBridgeEvent(): (homeTokenAddress: string, isMultiBridge: boolean) => any {
  const { chainId, account, library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    async (homeTokenAddress: string, isMultiBridge: boolean) => {
      if (!chainId || !library || !account) return

      try {
        if (isMultiBridge) {
          await watchForeignMultiBridge(chainId, account, library, homeTokenAddress, dispatch)
        } else {
          await watchForeignBasicBridge(chainId, homeTokenAddress, account, dispatch)
        }
      } catch (error) {
        console.log(error)
      }
    },
    [account, chainId, dispatch, library]
  )
}

export function useSendToForeignTransaction(): (
  tokenAddress: string,
  bridgeAddress: string,
  amount: CurrencyAmount,
  isMultiBridge: boolean
) => Promise<TransactionResponse> | undefined {
  const dispatch = useDispatch<AppDispatch>()
  const { library, account } = useActiveWeb3React()

  return useCallback(
    async (tokenAddress: string, bridgeAddress: string, amount: CurrencyAmount, isMultiBridge: boolean) => {
      if (!library) return

      dispatch(tokenTransferPending())

      try {
        const address = isMultiBridge ? bridgeAddress : getBasicHomeBridgeAddress(tokenAddress)
        const contract = getERC677TokenContract(tokenAddress, library, account ?? undefined)
        const args = [address, amount.raw.toString(), []]

        const estimatedGas = await contract.estimateGas.transferAndCall(...args, {})
        const response = await contract.transferAndCall(...args, { gasLimit: calculateGasMargin(estimatedGas) })

        dispatch(tokenTransferSuccess())

        return response
      } catch (error) {
        dispatch(transferError())

        if (error?.code !== 4001) {
          console.error(error)
        }
      }
    },
    [account, dispatch, library]
  )
}

export function useSendToHomeTransaction(): (
  tokenAddress: string,
  amount: CurrencyAmount,
  isMultiBridge: boolean
) => Promise<TransactionResponse> | undefined {
  const dispatch = useDispatch<AppDispatch>()
  const { library, account, chainId } = useActiveWeb3React()

  return useCallback(
    async (tokenAddress: string, amount: CurrencyAmount, isMultiBridge: boolean) => {
      if (!chainId || !library || !account) return

      dispatch(tokenTransferPending())

      try {
        let estimate, method, args

        if (isMultiBridge) {
          const contract = getForiegnBridgeContract(chainId, library, account)

          estimate = contract.estimateGas['relayTokens(address,uint256)']
          method = contract['relayTokens(address,uint256)']
          args = [tokenAddress, amount.raw.toString()]
        } else {
          const contract = getERC677TokenContract(tokenAddress, library, account)
          const foreignBridgeAddress = getBasicForeignBridgeAddress(tokenAddress, chainId)

          estimate = contract.estimateGas.transferAndCall
          method = contract.transferAndCall
          args = [foreignBridgeAddress, amount.raw.toString(), []]
        }

        const estimatedGas = await estimate(...args, {})
        const response = await method(...args, { gasLimit: calculateGasMargin(estimatedGas) })

        dispatch(tokenTransferSuccess())

        return response
      } catch (error) {
        dispatch(transferError())

        if (error?.code !== 4001) {
          console.log(error)
        }
      }
    },
    [account, chainId, dispatch, library]
  )
}

export function useBridgeActionHandlers(): {
  onFieldInput: (typedValue: string) => void
  transferToForeign: (
    tokenAddress: string,
    bridgeAddress: string,
    amount: CurrencyAmount,
    isMultiBridge: boolean
  ) => Promise<void>
  transferToHome: (tokenAddress: string, amount: CurrencyAmount, isMultiBridge: boolean) => Promise<void>
} {
  const dispatch = useDispatch<AppDispatch>()
  const waitForTransaction = useWaitForTransaction()
  const watchForHomeBridgeEvent = useWatchForHomeBridgeEvent()
  const watchForForeignBridgeEvent = useWatchForForeignBridgeEvent()
  const sendToForeignTransaction = useSendToForeignTransaction()
  const sendToHomeTransaction = useSendToHomeTransaction()
  const addTransaction = useTransactionAdder()

  const onFieldInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.INPUT, typedValue }))
    },
    [dispatch]
  )

  const transferToForeign = useCallback(
    async (tokenAddress: string, bridgeAddress: string, amount: CurrencyAmount, isMultiBridge: boolean) => {
      const response = await sendToForeignTransaction(tokenAddress, bridgeAddress, amount, isMultiBridge)

      if (!response) return

      await watchForForeignBridgeEvent(tokenAddress, isMultiBridge)

      addTransaction(response, {
        summary: 'Your tokens were transferred successfully to Ethereum please switch to Ethereum to use them'
      })
    },
    [addTransaction, sendToForeignTransaction, watchForForeignBridgeEvent]
  )

  const transferToHome = useCallback(
    async (tokenAddress: string, amount: CurrencyAmount, isMultiBridge: boolean) => {
      const response = await sendToHomeTransaction(tokenAddress, amount, isMultiBridge)

      if (!response) return

      await waitForTransaction(response.hash, DEFAULT_CONFIRMATIONS_LIMIT)
      await watchForHomeBridgeEvent(tokenAddress, isMultiBridge)
      addTransaction(response, {
        summary: 'Your tokens were transferred successfully to Fuse please switch to Fuse to use them'
      })
    },
    [addTransaction, sendToHomeTransaction, waitForTransaction, watchForHomeBridgeEvent]
  )

  return { onFieldInput, transferToForeign, transferToHome }
}
