import { Currency } from '@uniswap/sdk-core'
import { utils } from 'ethers'
import { useEffect, useMemo } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useNativeCurrencyBalance, useTokenBalance } from 'src/features/balances/hooks'
import { useNFT } from 'src/features/nfts/hooks'
import { NFTAsset } from 'src/features/nfts/types'
import { useCurrency } from 'src/features/tokens/useCurrency'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import {
  transferTokenActions,
  transferTokenSagaName,
} from 'src/features/transactions/transfer/transferTokenSaga'
import { TransferTokenParams } from 'src/features/transactions/transfer/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { buildCurrencyId } from 'src/utils/currencyId'
import { SagaStatus } from 'src/utils/saga'
import { tryParseExactAmount } from 'src/utils/tryParseAmount'
import { useSagaStatus } from 'src/utils/useSagaStatus'

export type DerivedTransferInfo = BaseDerivedInfo<Currency | NFTAsset.Asset> & {
  currencyTypes: { [CurrencyField.INPUT]?: AssetType }
  exactCurrencyField: CurrencyField.INPUT
  recipient?: string
}

export function useDerivedTransferInfo(state: TransactionState): DerivedTransferInfo {
  const {
    [CurrencyField.INPUT]: tradeableAsset,
    exactAmountToken,
    exactAmountUSD,
    recipient,
  } = state

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

  return {
    currencies,
    currencyAmounts,
    currencyBalances: {
      [CurrencyField.INPUT]: currencyIn?.isNative ? nativeInBalance : tokenInBalance,
    },
    currencyTypes: {
      [CurrencyField.INPUT]: tradeableAsset?.type,
    },
    exactAmountUSD,
    exactAmountToken,
    exactCurrencyField: CurrencyField.INPUT,
    formattedAmounts: {
      [CurrencyField.INPUT]: exactAmountToken,
    },
    recipient,
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
