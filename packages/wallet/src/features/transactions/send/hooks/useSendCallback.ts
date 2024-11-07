import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { sendTokenActions } from 'wallet/src/features/transactions/send/sendTokenSaga'
import { SendTokenParams } from 'wallet/src/features/transactions/send/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

/** Helper send callback for ERC20s */
export function useSendERC20Callback(
  txId?: string,
  chainId?: UniverseChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  amountInWei?: string,
  transferTxWithGasSettings?: providers.TransactionRequest,
  onSubmit?: () => void,
  currencyAmountUSD?: Maybe<CurrencyAmount<Currency>>, // for analytics
  gasEstimates?: GasFeeEstimates,
): (() => void) | null {
  const account = useActiveAccount()

  return useSendCallback(
    chainId && toAddress && tokenAddress && amountInWei && account
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          amountInWei,
          type: AssetType.Currency,
          txId,
          currencyAmountUSD,
          gasEstimates,
        }
      : undefined,
    transferTxWithGasSettings,
    onSubmit,
  )
}

/** Helper send callback for NFTs */
export function useSendNFTCallback(
  txId?: string,
  chainId?: UniverseChainId,
  toAddress?: Address,
  tokenAddress?: Address,
  tokenId?: string,
  txRequest?: providers.TransactionRequest,
  onSubmit?: () => void,
  gasEstimates?: GasFeeEstimates,
): (() => void) | null {
  const account = useActiveAccount()

  return useSendCallback(
    account && chainId && toAddress && tokenAddress && tokenId
      ? {
          account,
          chainId,
          toAddress,
          tokenAddress,
          tokenId,
          type: AssetType.ERC721,
          txId,
          gasEstimates,
        }
      : undefined,
    txRequest,
    onSubmit,
  )
}

/** General purpose send callback for ERC20s, NFTs, etc. */
function useSendCallback(
  sendTokenParams?: SendTokenParams,
  txRequest?: providers.TransactionRequest,
  onSubmit?: () => void,
): null | (() => void) {
  const dispatch = useDispatch()

  return useMemo(() => {
    if (!sendTokenParams || !txRequest) {
      return null
    }

    return () => {
      dispatch(sendTokenActions.trigger({ sendTokenParams, txRequest }))
      onSubmit?.()
    }
  }, [sendTokenParams, dispatch, txRequest, onSubmit])
}
