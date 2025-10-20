import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { GasEstimate } from '@universe/api'
import { providers } from 'ethers'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { AssetType } from 'uniswap/src/entities/assets'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { sendTokenActions } from 'wallet/src/features/transactions/send/sendTokenSaga'
import { SendTokenParams } from 'wallet/src/features/transactions/send/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

/** Helper send callback for ERC20s */
export function useSendERC20Callback({
  txId,
  chainId,
  toAddress,
  tokenAddress,
  amountInWei,
  transferTxWithGasSettings,
  onSubmit,
  currencyAmountUSD,
  gasEstimate,
}: {
  txId?: string
  chainId?: UniverseChainId
  toAddress?: Address
  tokenAddress?: Address
  amountInWei?: string
  transferTxWithGasSettings?: providers.TransactionRequest
  onSubmit?: () => void
  currencyAmountUSD?: Maybe<CurrencyAmount<Currency>> // for analytics
  gasEstimate?: GasEstimate
}): (() => void) | null {
  const account = useActiveAccount()

  return useSendCallback({
    sendTokenParams:
      chainId && toAddress && tokenAddress && amountInWei && account && account.type === AccountType.SignerMnemonic
        ? {
            account,
            chainId,
            toAddress,
            tokenAddress,
            amountInWei,
            type: AssetType.Currency,
            txId,
            currencyAmountUSD,
            gasEstimate,
          }
        : undefined,
    txRequest: transferTxWithGasSettings,
    onSubmit,
  })
}

/** Helper send callback for NFTs */
export function useSendNFTCallback({
  txId,
  chainId,
  toAddress,
  tokenAddress,
  tokenId,
  txRequest,
  onSubmit,
  gasEstimate,
}: {
  txId?: string
  chainId?: UniverseChainId
  toAddress?: Address
  tokenAddress?: Address
  tokenId?: string
  txRequest?: providers.TransactionRequest
  onSubmit?: () => void
  gasEstimate?: GasEstimate
}): (() => void) | null {
  const account = useActiveAccount()

  return useSendCallback({
    sendTokenParams:
      account && account.type === AccountType.SignerMnemonic && chainId && toAddress && tokenAddress && tokenId
        ? {
            account,
            chainId,
            toAddress,
            tokenAddress,
            tokenId,
            type: AssetType.ERC721,
            txId,
            gasEstimate,
          }
        : undefined,
    txRequest,
    onSubmit,
  })
}

/** General purpose send callback for ERC20s, NFTs, etc. */
function useSendCallback({
  sendTokenParams,
  txRequest,
  onSubmit,
}: {
  sendTokenParams?: SendTokenParams
  txRequest?: providers.TransactionRequest
  onSubmit?: () => void
}): null | (() => void) {
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
