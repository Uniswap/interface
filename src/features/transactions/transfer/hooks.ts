import { Currency } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnyAction } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { useProvider } from 'src/app/walletContext'
import { WarningModalType } from 'src/components/warnings/types'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useNativeCurrencyBalance, useTokenBalance } from 'src/features/balances/hooks'
import { useAllBalancesList } from 'src/features/dataApi/balances'
import { estimateGasAction } from 'src/features/gas/estimateGasSaga'
import { useNFT } from 'src/features/nfts/hooks'
import { NFTAsset } from 'src/features/nfts/types'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import {
  CurrencyField,
  showNewAddressWarningModal,
  showNoBalancesWarningModal,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import {
  transferTokenActions,
  transferTokenSagaName,
} from 'src/features/transactions/transfer/transferTokenSaga'
import { TransferTokenParams } from 'src/features/transactions/transfer/types'
import { getTransferWarnings } from 'src/features/transactions/transfer/validate'
import { TransactionType } from 'src/features/transactions/types'
import {
  useActiveAccount,
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
} from 'src/features/wallet/hooks'
import { buildCurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { SagaStatus } from 'src/utils/saga'
import { tryParseExactAmount } from 'src/utils/tryParseAmount'
import { useSagaStatus } from 'src/utils/useSagaStatus'

export type DerivedTransferInfo = BaseDerivedInfo<Currency | NFTAsset.Asset> & {
  currencyTypes: { [CurrencyField.INPUT]?: AssetType }
  exactCurrencyField: CurrencyField.INPUT
  recipient?: string
  isUSDInput?: boolean
  warningModalType?: WarningModalType
}

export function useDerivedTransferInfo(state: TransactionState): DerivedTransferInfo {
  const {
    [CurrencyField.INPUT]: tradeableAsset,
    exactAmountToken,
    exactAmountUSD,
    recipient,
    isUSDInput,
    warningModalType,
  } = state
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const chainId = tradeableAsset?.chainId ?? ChainId.Mainnet

  const currencyIn = useCurrency(
    tradeableAsset?.type === AssetType.Currency
      ? buildCurrencyId(tradeableAsset?.chainId, tradeableAsset?.address)
      : undefined
  )

  const { asset: nftIn } = useNFT(
    activeAccount?.address,
    tradeableAsset?.address && utils.getAddress(tradeableAsset.address),
    tradeableAsset?.type === AssetType.ERC1155 || tradeableAsset?.type === AssetType.ERC721
      ? tradeableAsset.tokenId
      : undefined
  )

  const currencies = {
    [CurrencyField.INPUT]: currencyIn ?? nftIn,
  }

  const { balance: tokenInBalance } = useTokenBalance(
    currencyIn?.isToken ? currencyIn : undefined,
    activeAccount?.address
  )

  const { balance: nativeInBalance } = useNativeCurrencyBalance(chainId, activeAccount?.address)

  const amountSpecified = useMemo(
    () => tryParseExactAmount(exactAmountToken, currencyIn),
    [currencyIn, exactAmountToken]
  )
  const currencyAmounts = {
    [CurrencyField.INPUT]: amountSpecified,
  }
  const currencyBalances = {
    [CurrencyField.INPUT]: currencyIn?.isNative ? nativeInBalance : tokenInBalance,
  }

  const warnings = getTransferWarnings(t, {
    currencies,
    currencyAmounts,
    currencyBalances,
    recipient,
  })

  return {
    currencies,
    currencyAmounts,
    currencyBalances,
    currencyTypes: {
      [CurrencyField.INPUT]: tradeableAsset?.type,
    },
    exactAmountUSD,
    exactAmountToken,
    exactCurrencyField: CurrencyField.INPUT,
    formattedAmounts: {
      [CurrencyField.INPUT]: isUSDInput ? exactAmountUSD || '' : exactAmountToken,
    },
    isUSDInput,
    recipient,
    warnings,
    warningModalType,
  }
}

/** Helper transfer callback for ERC20s */
export function useTransferERC20Callback(
  chainId?: ChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  amountInWei?: string,
  onSubmit?: () => void
) {
  const account = useActiveAccount()

  return useTransferCallback(
    chainId && toAddress && tokenAddress && amountInWei && account
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          amountInWei,
          type: AssetType.Currency,
        }
      : null,
    onSubmit
  )
}

/** Helper transfer callback for NFTs */
export function useTransferNFTCallback(
  chainId?: ChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  tokenId?: string,
  onSubmit?: () => void
) {
  const account = useActiveAccount()

  return useTransferCallback(
    account && chainId && toAddress && tokenAddress && tokenId
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          tokenId,
          type: AssetType.ERC721,
        }
      : null,
    onSubmit
  )
}

/** General purpose transfer callback for ERC20s, NFTs, etc. */
function useTransferCallback(
  transferTokenParams: TransferTokenParams | null,
  onSubmit?: () => void
): null | (() => void) {
  const dispatch = useAppDispatch()

  const transferState = useSagaStatus(transferTokenSagaName, undefined, true)

  useEffect(() => {
    if (transferState.status === SagaStatus.Started) {
      onSubmit?.()
    }
  }, [onSubmit, transferState.status])

  return useMemo(() => {
    return transferTokenParams
      ? () => {
          dispatch(transferTokenActions.trigger(transferTokenParams))
        }
      : null
  }, [dispatch, transferTokenParams])
}

export function useUpdateTransferGasEstimate(
  transactionStateDispatch: React.Dispatch<AnyAction>,
  chainId: ChainId | undefined,
  tokenAddress: string | undefined,
  amount: string | undefined,
  toAddress: string | undefined,
  tokenId: string | undefined,
  assetType: AssetType | undefined
) {
  const dispatch = useAppDispatch()
  const account = useActiveAccountWithThrow()

  useEffect(() => {
    const isNFT = assetType === AssetType.ERC1155 || assetType === AssetType.ERC721
    if (
      !chainId ||
      !tokenAddress ||
      !toAddress ||
      !assetType ||
      (!isNFT && !amount) ||
      (isNFT && !tokenId)
    ) {
      logger.info(
        'hooks',
        'useUpdateTransferGasEstimate',
        'One of the required parameters is undefined'
      )
      return
    }

    let params: TransferTokenParams
    if (isNFT) {
      if (!tokenId) return // already checked this but ts is dumb
      params = {
        account,
        chainId,
        toAddress,
        tokenAddress,
        type: assetType,
        tokenId,
      }
    } else {
      params = {
        account,
        chainId,
        toAddress,
        tokenAddress,
        type: AssetType.Currency,
        amountInWei: amount || '1',
      }
    }

    dispatch(
      estimateGasAction({
        txType: TransactionType.Send,
        params,
        transactionStateDispatch,
      })
    )
  }, [
    account,
    toAddress,
    tokenId,
    chainId,
    dispatch,
    amount,
    tokenAddress,
    transactionStateDispatch,
    assetType,
  ])
}

export function useRecipientHasZeroBalances(recipient: string | undefined, chainId: ChainId) {
  const { totalCount, loading } = useAllBalancesList(recipient, [chainId])
  return loading ? null : totalCount === 0
}

export function useRecipientIsNewAddress(recipient: string | undefined) {
  const activeAddress = useActiveAccountAddressWithThrow()
  const txnsToSelectedAddress = useAllTransactionsBetweenAddresses(activeAddress, recipient)
  return txnsToSelectedAddress?.length === 0
}

export function useIsSmartContractAddress(address: string | undefined, chainId: ChainId) {
  const provider = useProvider(chainId)
  const [state, setState] = useState<{ loading: boolean; isSmartContractAddress: boolean }>({
    loading: false,
    isSmartContractAddress: false,
  })

  useEffect(() => {
    if (!address) return setState({ loading: false, isSmartContractAddress: false })
    setState((s) => ({ ...s, loading: true }))
    provider?.getCode(address).then((code: string) => {
      // provider.getCode(address) will return a hex string if code is deployed at that address = it's a smart contract
      // returning just 0x means there's no code and it's not a smart contract
      const isSmartContractAddress = code !== '0x'
      setState({ loading: false, isSmartContractAddress })
    })
  }, [address, provider])
  return state
}

export function useHandleTransferWarningModals(
  state: TransactionState,
  dispatch: React.Dispatch<AnyAction>,
  onNext: () => void,
  recipient: string | undefined,
  chainId: ChainId
) {
  const { showNewAddressWarning, showNoBalancesWarning } = state

  const recipientHasNoBalances = useRecipientHasZeroBalances(recipient, chainId)
  const hasNoBalancesWarning = !!recipient && !!recipientHasNoBalances
  const hasNewAddressWarning = useRecipientIsNewAddress(recipient)

  const onPressReview = useCallback(() => {
    if (!hasNewAddressWarning && !hasNoBalancesWarning) {
      onNext()
      return
    }
    if (hasNoBalancesWarning) dispatch(showNoBalancesWarningModal())
    if (hasNewAddressWarning) dispatch(showNewAddressWarningModal())
  }, [hasNewAddressWarning, hasNoBalancesWarning, dispatch, onNext])

  const moreThanOneModalOpen = showNewAddressWarning && showNoBalancesWarning
  const onPressWarningContinue = useCallback(
    () => (moreThanOneModalOpen ? null : onNext()),
    [moreThanOneModalOpen, onNext]
  )

  return useMemo(() => {
    return {
      warningsLoading: recipientHasNoBalances === null,
      onPressReview,
      onPressWarningContinue,
    }
  }, [recipientHasNoBalances, onPressReview, onPressWarningContinue])
}
