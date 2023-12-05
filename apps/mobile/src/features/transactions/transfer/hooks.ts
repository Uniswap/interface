import { AnyAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import { useCallback, useMemo } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import {
  selectRecipient,
  toggleShowRecipientSelector,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { GQLNftAsset, useNFT } from 'wallet/src/features/nfts/hooks'
import {
  useOnChainCurrencyBalance,
  useOnChainNativeCurrencyBalance,
} from 'wallet/src/features/portfolio/api'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { transferTokenActions } from 'wallet/src/features/transactions/transfer/transferTokenSaga'
import { TransferTokenParams } from 'wallet/src/features/transactions/transfer/types'
import { useProvider } from 'wallet/src/features/wallet/context'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export type DerivedTransferInfo = BaseDerivedInfo<CurrencyInfo | GQLNftAsset> & {
  currencyTypes: { [CurrencyField.INPUT]?: AssetType }
  currencyInInfo?: CurrencyInfo | null
  chainId: ChainId
  exactAmountFiat: string
  exactCurrencyField: CurrencyField.INPUT
  isFiatInput?: boolean
  nftIn: GQLNftAsset | undefined
  recipient?: string
  txId?: string
}

export function useDerivedTransferInfo(state: TransactionState): DerivedTransferInfo {
  const {
    [CurrencyField.INPUT]: tradeableAsset,
    exactAmountToken,
    exactAmountFiat,
    recipient,
    isFiatInput,
    txId,
  } = state

  const activeAccount = useActiveAccount()
  const chainId = tradeableAsset?.chainId ?? ChainId.Mainnet

  const currencyInInfo = useCurrencyInfo(
    tradeableAsset?.type === AssetType.Currency
      ? buildCurrencyId(tradeableAsset?.chainId, tradeableAsset?.address)
      : undefined
  )

  const currencyIn = currencyInInfo?.currency
  const { data: nftIn } = useNFT(
    activeAccount?.address,
    tradeableAsset?.address,
    tradeableAsset?.type === AssetType.ERC1155 || tradeableAsset?.type === AssetType.ERC721
      ? tradeableAsset.tokenId
      : undefined
  )

  const currencies = useMemo(
    () => ({
      [CurrencyField.INPUT]: currencyInInfo ?? nftIn,
    }),
    [currencyInInfo, nftIn]
  )

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(
    currencyIn?.isToken ? currencyIn : undefined,
    activeAccount?.address
  )

  const { balance: nativeInBalance } = useOnChainNativeCurrencyBalance(
    chainId ?? ChainId.Mainnet,
    activeAccount?.address
  )

  const amountSpecified = useMemo(
    () =>
      getCurrencyAmount({
        value: exactAmountToken,
        valueType: ValueType.Exact,
        currency: currencyIn,
      }),
    [currencyIn, exactAmountToken]
  )
  const currencyAmounts = useMemo(
    () => ({
      [CurrencyField.INPUT]: amountSpecified,
    }),
    [amountSpecified]
  )

  const currencyBalances = useMemo(
    () => ({
      [CurrencyField.INPUT]: currencyIn?.isNative ? nativeInBalance : tokenInBalance,
    }),
    [currencyIn, nativeInBalance, tokenInBalance]
  )
  return useMemo(
    () => ({
      chainId,
      currencies,
      currencyAmounts,
      currencyBalances,
      currencyTypes: { [CurrencyField.INPUT]: tradeableAsset?.type },
      currencyInInfo,
      exactAmountToken,
      exactAmountFiat: exactAmountFiat ?? '',
      exactCurrencyField: CurrencyField.INPUT,
      isFiatInput,
      nftIn: nftIn ?? undefined,
      recipient,
      txId,
    }),
    [
      chainId,
      currencies,
      currencyAmounts,
      currencyBalances,
      currencyInInfo,
      exactAmountToken,
      exactAmountFiat,
      isFiatInput,
      nftIn,
      recipient,
      tradeableAsset?.type,
      txId,
    ]
  )
}

/** Helper transfer callback for ERC20s */
export function useTransferERC20Callback(
  txId?: string,
  chainId?: ChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  amountInWei?: string,
  transferTxWithGasSettings?: providers.TransactionRequest,
  onSubmit?: () => void
): (() => void) | null {
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
          txId,
        }
      : undefined,
    transferTxWithGasSettings,
    onSubmit
  )
}

/** Helper transfer callback for NFTs */
export function useTransferNFTCallback(
  txId?: string,
  chainId?: ChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  tokenId?: string,
  txRequest?: providers.TransactionRequest,
  onSubmit?: () => void
): (() => void) | null {
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
          txId,
        }
      : undefined,
    txRequest,
    onSubmit
  )
}

/** General purpose transfer callback for ERC20s, NFTs, etc. */
function useTransferCallback(
  transferTokenParams?: TransferTokenParams,
  txRequest?: providers.TransactionRequest,
  onSubmit?: () => void
): null | (() => void) {
  const dispatch = useAppDispatch()

  return useMemo(() => {
    if (!transferTokenParams || !txRequest) return null

    return () => {
      dispatch(transferTokenActions.trigger({ transferTokenParams, txRequest }))
      onSubmit?.()
    }
  }, [transferTokenParams, dispatch, txRequest, onSubmit])
}

export function useIsSmartContractAddress(
  address: string | undefined,
  chainId: ChainId
): {
  loading: boolean
  isSmartContractAddress: boolean
} {
  const provider = useProvider(chainId)

  const fetchIsSmartContractAddress = useCallback(async () => {
    if (!address) return false
    const code = await provider?.getCode(address)
    // provider.getCode(address) will return a hex string if a smart contract is deployed at that address
    // returning just 0x means there's no code and it's not a smart contract
    return code !== '0x'
  }, [provider, address])

  const { data, isLoading } = useAsyncData(fetchIsSmartContractAddress)
  return { isSmartContractAddress: !!data, loading: isLoading }
}

export function useOnToggleShowRecipientSelector(dispatch: React.Dispatch<AnyAction>): () => void {
  return useCallback(() => {
    dispatch(toggleShowRecipientSelector())
  }, [dispatch])
}

export function useOnSelectRecipient(
  dispatch: React.Dispatch<AnyAction>
): (recipient: Address) => void {
  const onToggleShowRecipientSelector = useOnToggleShowRecipientSelector(dispatch)
  return useCallback(
    (recipient: Address) => {
      onToggleShowRecipientSelector()
      dispatch(selectRecipient({ recipient }))
    },
    [dispatch, onToggleShowRecipientSelector]
  )
}
