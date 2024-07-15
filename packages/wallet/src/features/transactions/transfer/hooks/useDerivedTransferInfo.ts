import { useMemo } from 'react'
import { AssetType } from 'uniswap/src/entities/assets'
import { CurrencyField, TransactionState } from 'uniswap/src/features/transactions/transactionState/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useNFT } from 'wallet/src/features/nfts/hooks'
import { useOnChainCurrencyBalance, useOnChainNativeCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

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
  const chainId = tradeableAsset?.chainId ?? UniverseChainId.Mainnet

  const currencyInInfo = useCurrencyInfo(
    tradeableAsset?.type === AssetType.Currency
      ? buildCurrencyId(tradeableAsset?.chainId, tradeableAsset?.address)
      : undefined,
  )

  const currencyIn = currencyInInfo?.currency
  const { data: nftIn } = useNFT(
    activeAccount?.address,
    tradeableAsset?.address,
    tradeableAsset?.type === AssetType.ERC1155 || tradeableAsset?.type === AssetType.ERC721
      ? tradeableAsset.tokenId
      : undefined,
  )

  const currencies = useMemo(
    () => ({
      [CurrencyField.INPUT]: currencyInInfo ?? nftIn,
    }),
    [currencyInInfo, nftIn],
  )

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(
    currencyIn?.isToken ? currencyIn : undefined,
    activeAccount?.address,
  )

  const { balance: nativeInBalance } = useOnChainNativeCurrencyBalance(
    chainId ?? UniverseChainId.Mainnet,
    activeAccount?.address,
  )

  const amountSpecified = useMemo(
    () =>
      getCurrencyAmount({
        value: exactAmountToken,
        valueType: ValueType.Exact,
        currency: currencyIn,
      }),
    [currencyIn, exactAmountToken],
  )
  const currencyAmounts = useMemo(
    () => ({
      [CurrencyField.INPUT]: amountSpecified,
    }),
    [amountSpecified],
  )

  const currencyBalances = useMemo(
    () => ({
      [CurrencyField.INPUT]: currencyIn?.isNative ? nativeInBalance : tokenInBalance,
    }),
    [currencyIn, nativeInBalance, tokenInBalance],
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
    ],
  )
}
