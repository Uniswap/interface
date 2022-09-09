import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ChainId } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
import {
  Chain,
  TokenStandard,
} from 'src/features/transactions/history/__generated__/transactionHistoryQuery.graphql'

interface Asset {
  readonly address: string | null
  readonly chain: Chain
  readonly decimals: number | null
  readonly name: string | null
  readonly symbol: string | null
}

/**
 * Constructs a CurrencyAmount based on asset details and quantity. Checks if token is native
 * or ERC20 to determine decimal amount.
 * @param tokenStandard token standard type from api query
 * @param asset // asset to use decimals from
 * @param quantity // formatted amount of asset transfered
 * @returns
 */
export function deriveCurrencyAmountFromAssetResponse(
  tokenStandard: TokenStandard,
  asset: Asset,
  quantity: string
) {
  const nativeCurrency = nativeOnChain(ChainId.Mainnet)
  return parseUnits(
    quantity,
    tokenStandard === 'NATIVE'
      ? BigNumber.from(nativeCurrency.decimals)
      : asset?.decimals
      ? BigNumber.from(asset.decimals)
      : undefined
  ).toString()
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed USD value as a number if currency is of type USD
 */
export function parseUSDValueFromAssetChange(
  transactedValue: {
    currency: string | null
    value: number | null
  } | null
) {
  return transactedValue?.currency === 'USD' ? transactedValue.value ?? undefined : undefined
}
