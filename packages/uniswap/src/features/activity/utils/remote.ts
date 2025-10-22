import { SpamCode as RestSpamCode, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Token as SdkToken } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Maps token type to asset type for the transaction
 */
export function mapTokenTypeToAssetType(tokenType?: TokenType): AssetType {
  switch (tokenType) {
    case TokenType.ERC721:
      return AssetType.ERC721
    case TokenType.ERC1155:
      return AssetType.ERC1155
    case TokenType.NATIVE:
    case TokenType.ERC20:
    default:
      return AssetType.Currency
  }
}

export enum AssetCase {
  Nft = 'nft',
  Token = 'token',
}

/**
 * Parses an asset from API and returns either the token address or native currency address
 * for the involved asset.
 * @returns Token address, custom native address or null
 */
export function getAddressFromAsset({
  tokenStandard,
  chain,
  address,
}: {
  tokenStandard: GraphQLApi.TokenStandard
  chain: GraphQLApi.Chain | undefined
  address: Maybe<string>
}): Maybe<string> {
  const supportedChainId = fromGraphQLChain(chain)
  if (!supportedChainId) {
    return null
  }
  if (tokenStandard === GraphQLApi.TokenStandard.Native) {
    return getNativeAddress(supportedChainId)
  }
  return address
}

/**
 * Determines if a token is spam based on REST API spam codes
 */
export function isRestTokenSpam(spamCode?: RestSpamCode): boolean {
  return spamCode === RestSpamCode.SPAM || spamCode === RestSpamCode.SPAM_URL
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed USD value as a number if currency is of type USD
 */
export function parseUSDValueFromAssetChange(transactedValue: Maybe<Partial<GraphQLApi.Amount>>): number | undefined {
  return transactedValue?.currency === GraphQLApi.Currency.Usd ? (transactedValue.value ?? undefined) : undefined
}

/**
 * Constructs a CurrencyAmount based on asset details and quantity. Checks if token is native
 * or ERC20 to determine decimal amount.
 * @param tokenStandard token standard type from api query
 * @param quantity // formatted amount of asset transferred
 * @param decimals // decimals ((optional) if native token)
 * @returns
 */
export function deriveCurrencyAmountFromAssetResponse({
  tokenStandard,
  chain,
  address,
  decimals,
  quantity,
}: {
  tokenStandard: GraphQLApi.TokenStandard
  chain: GraphQLApi.Chain
  address: Maybe<string>
  decimals: Maybe<number>
  quantity: string
}): string {
  const chainId = fromGraphQLChain(chain)
  if (!chainId) {
    return ''
  }

  const currency =
    tokenStandard === GraphQLApi.TokenStandard.Native
      ? nativeOnChain(chainId)
      : address && decimals
        ? new SdkToken(chainId, address, decimals)
        : undefined

  const currencyAmount = getCurrencyAmount({
    value: quantity,
    valueType: ValueType.Exact,
    currency,
  })

  return currencyAmount?.quotient.toString() ?? ''
}

// eslint-disable-next-line consistent-return
export function remoteTxStatusToLocalTxStatus(
  type: GraphQLApi.TransactionType,
  status: GraphQLApi.TransactionStatus,
): TransactionStatus {
  switch (status) {
    case GraphQLApi.TransactionStatus.Failed:
      if (type === GraphQLApi.TransactionType.Cancel) {
        return TransactionStatus.FailedCancel
      }
      return TransactionStatus.Failed
    case GraphQLApi.TransactionStatus.Pending:
      if (type === GraphQLApi.TransactionType.Cancel) {
        return TransactionStatus.Cancelling
      }
      return TransactionStatus.Pending
    case GraphQLApi.TransactionStatus.Confirmed:
      if (type === GraphQLApi.TransactionType.Cancel) {
        return TransactionStatus.Canceled
      }
      return TransactionStatus.Success
  }
}
