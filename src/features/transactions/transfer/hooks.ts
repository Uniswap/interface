import { Currency } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnyAction } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { useProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useNativeCurrencyBalance, useTokenBalance } from 'src/features/balances/hooks'
import { estimateGasAction } from 'src/features/gas/estimateGasSaga'
import { FeeInfo, GasSpeed } from 'src/features/gas/types'
import { useNFT } from 'src/features/nfts/hooks'
import { NFTAsset } from 'src/features/nfts/types'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useAllTransactionsBetweenAddresses } from 'src/features/transactions/hooks'
import {
  CurrencyField,
  GasFeeByTransactionType,
  OptimismL1FeeEstimate,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import {
  transferTokenActions,
  TransferTokenParams,
} from 'src/features/transactions/transfer/transferTokenSaga'
import { getTransferWarnings } from 'src/features/transactions/transfer/validate'
import { TransactionType } from 'src/features/transactions/types'
import {
  useActiveAccount,
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
} from 'src/features/wallet/hooks'
import { buildCurrencyId, currencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { tryParseExactAmount } from 'src/utils/tryParseAmount'

export type DerivedTransferInfo = BaseDerivedInfo<Currency | NFTAsset.Asset> & {
  currencyTypes: { [CurrencyField.INPUT]?: AssetType }
  currencyIn: Currency | undefined
  nftIn: NFTAsset.Asset | undefined
  chainId: ChainId | undefined
  exactCurrencyField: CurrencyField.INPUT
  recipient?: string
  isUSDInput?: boolean
}

interface UpdateTransferGasEstimateParams {
  transactionStateDispatch: React.Dispatch<AnyAction>
  chainId: NullUndefined<ChainId>
  currencyIn: Currency | undefined
  nftIn: NFTAsset.Asset | undefined
  amount: string | undefined
  recipient: Address | undefined
  assetType: AssetType | undefined
}

export function useDerivedTransferInfo(state: TransactionState): DerivedTransferInfo {
  const {
    [CurrencyField.INPUT]: tradeableAsset,
    exactAmountToken,
    exactAmountUSD,
    recipient,
    isUSDInput,
  } = state
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const chainId = tradeableAsset?.chainId

  const currencyIn = useCurrency(
    tradeableAsset?.type === AssetType.Currency
      ? buildCurrencyId(tradeableAsset?.chainId, tradeableAsset?.address)
      : undefined
  )

  const { asset: nftIn } = useNFT(
    activeAccount?.address,
    tradeableAsset?.address,
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

  const { balance: nativeInBalance } = useNativeCurrencyBalance(
    chainId ?? ChainId.Mainnet,
    activeAccount?.address
  )

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
    currencyBalances,
    currencyAmounts,
    recipient,
    currencyIn: currencyIn ?? undefined,
    nftIn,
    chainId,
  })

  return {
    currencies,
    currencyAmounts,
    currencyBalances,
    currencyTypes: { [CurrencyField.INPUT]: tradeableAsset?.type },
    chainId,
    currencyIn: currencyIn ?? undefined,
    nftIn: nftIn ?? undefined,
    exactAmountUSD,
    exactAmountToken,
    exactCurrencyField: CurrencyField.INPUT,
    formattedAmounts: {
      [CurrencyField.INPUT]: isUSDInput ? exactAmountUSD || '' : exactAmountToken,
    },
    isUSDInput,
    recipient,
    warnings,
  }
}

/** Helper transfer callback for ERC20s */
export function useTransferERC20Callback(
  txId?: string,
  chainId?: ChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  amountInWei?: string,
  feeInfo?: FeeInfo,
  onSubmit?: () => void
) {
  const account = useActiveAccount()

  return useTransferCallback(
    chainId && toAddress && tokenAddress && amountInWei && account && feeInfo
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          amountInWei,
          type: AssetType.Currency,
          txId,
          feeInfo,
        }
      : null,
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
  feeInfo?: FeeInfo,
  onSubmit?: () => void
) {
  const account = useActiveAccount()

  return useTransferCallback(
    account && chainId && toAddress && tokenAddress && tokenId && feeInfo
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          tokenId,
          type: AssetType.ERC721,
          txId,
          feeInfo,
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

  return useMemo(() => {
    return transferTokenParams
      ? () => {
          dispatch(transferTokenActions.trigger(transferTokenParams))
          onSubmit?.()
        }
      : null
  }, [dispatch, transferTokenParams, onSubmit])
}

export function useUpdateTransferGasEstimate({
  transactionStateDispatch,
  chainId,
  currencyIn,
  nftIn,
  amount,
  recipient,
  assetType,
}: UpdateTransferGasEstimateParams) {
  const dispatch = useAppDispatch()
  const account = useActiveAccountWithThrow()
  const tokenAddress = currencyIn ? currencyAddress(currencyIn) : nftIn?.asset_contract.address

  useEffect(() => {
    if (!chainId || !tokenAddress || !recipient || !assetType || (!currencyIn && !nftIn)) {
      logger.info(
        'hooks',
        'useUpdateTransferGasEstimate',
        'One of the required parameters is undefined'
      )
      return
    }

    let params: TransferTokenParams
    if (assetType === AssetType.ERC1155 || assetType === AssetType.ERC721) {
      if (!nftIn) {
        logger.info(
          'hooks',
          'useUpdateTransferGasEstimate',
          'Asset type corresponds to a NFT but `nftIn` is undefined'
        )
        return
      }

      params = {
        account,
        chainId,
        toAddress: recipient,
        tokenAddress,
        type: assetType,
        tokenId: nftIn.token_id,
      }
    } else {
      if (!currencyIn || amount === undefined) {
        logger.info(
          'hooks',
          'useUpdateTransferGasEstimate',
          'Asset type corresponds to a Currency but `currencyIn` or `amount` is undefined'
        )
        return
      }

      params = {
        account,
        chainId,
        toAddress: recipient,
        tokenAddress,
        type: AssetType.Currency,
        amountInWei: amount,
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
    recipient,
    chainId,
    dispatch,
    amount,
    tokenAddress,
    transactionStateDispatch,
    assetType,
    currencyIn,
    nftIn,
  ])
}

export function useTransferGasFee(
  gasFeeEstimate: GasFeeByTransactionType | undefined,
  gasSpeedPreference: GasSpeed,
  optimismL1Fee?: OptimismL1FeeEstimate
) {
  const txFee = gasFeeEstimate?.[TransactionType.Send]?.fee[gasSpeedPreference]
  const optimismL1TransferFee = optimismL1Fee?.[TransactionType.Send]

  return useMemo(() => {
    if (!txFee) return undefined

    return optimismL1TransferFee
      ? BigNumber.from(txFee).add(optimismL1TransferFee).toString()
      : txFee
  }, [txFee, optimismL1TransferFee])
}

export function useIsSmartContractAddress(address: string | undefined, chainId: ChainId) {
  const provider = useProvider(chainId)
  const [state, setState] = useState<{ loading: boolean; isSmartContractAddress: boolean }>({
    loading: true,
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

export function useShowTransferWarnings(
  recipient: string | undefined,
  chainId: ChainId | undefined
) {
  const activeAddress = useActiveAccountAddressWithThrow()
  const isNewRecipient = useAllTransactionsBetweenAddresses(activeAddress, recipient).length === 0

  const { isSmartContractAddress, loading: addressLoading } = useIsSmartContractAddress(
    recipient,
    chainId ?? ChainId.Mainnet
  )

  return {
    showNewRecipientWarning: isNewRecipient && !isSmartContractAddress,
    showSmartContractWarning: isSmartContractAddress,
    areWarningsLoading: addressLoading,
  }
}
