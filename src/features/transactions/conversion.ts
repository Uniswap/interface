import { TradeType } from '@uniswap/sdk-core'
import { utils } from 'ethers/lib/ethers'
import { NATIVE_ADDRESS, SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { Transaction } from 'src/features/dataApi/zerion/types'
import { TransactionSummaryInfo } from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { currencyIdToAddress } from 'src/utils/currencyId'

/**
 * For extracting essential data required for transaction history UI.
 * Accepts multiple types to help merge both local and remotely fetched transactions.
 *
 * @TODO test this as a util.
 */
export function extractTransactionSummaryInfo(
  transaction: Transaction | TransactionDetails
): TransactionSummaryInfo {
  if ('typeInfo' in transaction) {
    return parseLocalTransactionItem(transaction)
  }
  return parseExternalTransactionItem(transaction)
}

function parseLocalTransactionItem(transaction: TransactionDetails): TransactionSummaryInfo {
  const { chainId, hash, status, typeInfo } = transaction

  let tokenAddress: string | undefined
  let otherTokenAddress: string | undefined
  let amountRaw: string | undefined
  let assetType = AssetType.Currency // default to currency unless NFT found
  let msTimestampAdded = transaction.addedTime

  switch (typeInfo.type) {
    case TransactionType.Approve:
      tokenAddress = typeInfo.tokenAddress
      break
    case TransactionType.Receive:
      tokenAddress = typeInfo.tokenAddress
      amountRaw = typeInfo.currencyAmountRaw
      assetType = typeInfo.assetType
      break
    case TransactionType.Send:
      tokenAddress = typeInfo.tokenAddress
      amountRaw = typeInfo.currencyAmountRaw
      assetType = typeInfo.assetType
      break
    case TransactionType.Swap:
      tokenAddress = currencyIdToAddress(typeInfo.outputCurrencyId)
      otherTokenAddress = currencyIdToAddress(typeInfo.inputCurrencyId)
      amountRaw =
        typeInfo.tradeType === TradeType.EXACT_INPUT
          ? typeInfo.expectedOutputCurrencyAmountRaw
          : typeInfo.outputCurrencyAmountRaw
      break
  }

  return {
    chainId,
    status,
    hash,
    type: typeInfo.type,
    tokenAddress,
    otherTokenAddress,
    amountRaw,
    assetType,
    msTimestampAdded,
  }
}

function parseExternalTransactionItem(transaction: Transaction): TransactionSummaryInfo {
  let type = TransactionType.Unknown
  let assetType = AssetType.Currency
  let status = TransactionStatus.Unknown
  let amountRaw: string | undefined
  let tokenAddress: string | undefined
  let otherTokenAddress: string | undefined
  let nftMetaData:
    | {
        name: string
        imageURL: string
      }
    | undefined

  const hash = transaction.hash
  let chainId = ChainId.Mainnet // TODO: if remote txn fetching includes other networks will need to include this.
  let msTimestampAdded = transaction.mined_at * 1000 // adjust for ms

  switch (transaction.status) {
    case 'pending':
      status = TransactionStatus.Pending
      break
    case 'confirmed':
      status = TransactionStatus.Success
      break
    case 'failed':
      status = TransactionStatus.Failed
      break
  }

  switch (transaction.type) {
    case 'execution':
      // Special case failed swaps from Zerion. (token meta data is not available in return value)
      if (transaction.address_to === SWAP_ROUTER_ADDRESSES[chainId].toLocaleLowerCase()) {
        type = TransactionType.Swap
        tokenAddress = transaction.changes?.[0]?.asset?.id
      }
      break
    case 'authorize':
      type = TransactionType.Approve
      tokenAddress = transaction.address_to
      break
    case 'send':
      type = TransactionType.Send
      let change = transaction.changes?.[0]
      if (change?.nft_asset) {
        assetType = AssetType.ERC721
      }
      amountRaw = change?.value?.toString()
      tokenAddress = transaction.changes?.[0].asset.id
      break
    case 'receive':
      type = TransactionType.Receive
      change = transaction.changes?.[0]
      if (change?.nft_asset) {
        assetType = AssetType.ERC721
      }
      amountRaw = change?.value?.toString()
      tokenAddress = transaction.changes?.[0].asset.id
      break
    case 'trade':
      type = TransactionType.Swap
      const changeIn = transaction.changes?.[0]
      const changeOut = transaction.changes?.[1]
      // NFT transfer
      if (changeOut?.nft_asset) {
        assetType = AssetType.ERC721
        tokenAddress = changeOut.nft_asset.asset.contract_address
        amountRaw = '0'
        type = changeOut.direction === 'in' ? TransactionType.Receive : TransactionType.Send
        nftMetaData = {
          name: changeOut.nft_asset.asset.name,
          imageURL: changeOut.nft_asset.asset.detail.url,
        }
      } else {
        tokenAddress = changeOut?.asset?.id
        otherTokenAddress = changeIn?.asset?.id
        amountRaw = changeOut?.value.toString()
      }
      break
  }

  // Transform returned ids for native currencies
  tokenAddress = normalizeIfNativeId(tokenAddress)
  otherTokenAddress = normalizeIfNativeId(otherTokenAddress)

  // Must checksum as Zerion does not, checksum needed for caching
  tokenAddress = tokenAddress ? utils.getAddress(tokenAddress) : undefined
  otherTokenAddress = otherTokenAddress ? utils.getAddress(otherTokenAddress) : undefined

  return {
    chainId,
    status,
    hash,
    type,
    tokenAddress,
    otherTokenAddress,
    amountRaw,
    assetType,
    msTimestampAdded,
    nftMetaData,
  }
}

// Convert asset id 'eth' returned from Zerion to native address.
function normalizeIfNativeId(id: string | undefined) {
  if (id === 'eth') return NATIVE_ADDRESS
  return id
}
