import { t } from '@lingui/macro'
import { ChainId, Currency, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, UNI_ADDRESSES } from '@uniswap/sdk-core'
import UniswapXBolt from 'assets/svg/bolt.svg'
import moonpayLogoSrc from 'assets/svg/moonpay.svg'
import { nativeOnChain } from 'constants/tokens'
import {
  ActivityType,
  AssetActivityPartsFragment,
  Currency as GQLCurrency,
  NftApprovalPartsFragment,
  NftApproveForAllPartsFragment,
  NftTransferPartsFragment,
  SwapOrderDetailsPartsFragment,
  SwapOrderStatus,
  TokenApprovalPartsFragment,
  TokenAssetPartsFragment,
  TokenTransferPartsFragment,
  TransactionDetailsPartsFragment,
} from 'graphql/data/__generated__/types-and-hooks'
import { gqlToCurrency, logSentryErrorForUnsupportedChain, supportedChainIdFromGQLChain } from 'graphql/data/util'
import ms from 'ms'
import { useEffect, useState } from 'react'
import { isAddress } from 'utils'
import { isSameAddress } from 'utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { MOONPAY_SENDER_ADDRESSES, OrderStatusTable, OrderTextTable } from '../constants'
import { Activity } from './types'

type TransactionChanges = {
  NftTransfer: NftTransferPartsFragment[]
  TokenTransfer: TokenTransferPartsFragment[]
  TokenApproval: TokenApprovalPartsFragment[]
  NftApproval: NftApprovalPartsFragment[]
  NftApproveForAll: NftApproveForAllPartsFragment[]
}

type FormatNumberOrStringFunctionType = ReturnType<typeof useFormatter>['formatNumberOrString']

// TODO: Move common contract metadata to a backend service
const UNI_IMG =
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png'

const ENS_IMG =
  'https://464911102-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/collections%2F2TjMAeHSzwlQgcOdL48E%2Ficon%2FKWP0gk2C6bdRPliWIA6o%2Fens%20transparent%20background.png?alt=media&token=bd28b063-5a75-4971-890c-97becea09076'

const COMMON_CONTRACTS: { [key: string]: Partial<Activity> | undefined } = {
  [UNI_ADDRESSES[ChainId.MAINNET].toLowerCase()]: {
    title: t`UNI Governance`,
    descriptor: t`Contract Interaction`,
    logos: [UNI_IMG],
  },
  // TODO(cartcrom): Add permit2-specific logo
  '0x000000000022d473030f116ddee9f6b43ac78ba3': {
    title: t`Permit2`,
    descriptor: t`Uniswap Protocol`,
    logos: [UNI_IMG],
  },
  '0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41': {
    title: t`Ethereum Name Service`,
    descriptor: t`Public Resolver`,
    logos: [ENS_IMG],
  },
  '0x58774bb8acd458a640af0b88238369a167546ef2': {
    title: t`Ethereum Name Service`,
    descriptor: t`DNS Registrar`,
    logos: [ENS_IMG],
  },
  '0x084b1c3c81545d370f3634392de611caabff8148': {
    title: t`Ethereum Name Service`,
    descriptor: t`Reverse Registrar`,
    logos: [ENS_IMG],
  },
  '0x283af0b28c62c092c9727f1ee09c02ca627eb7f5': {
    title: t`Ethereum Name Service`,
    descriptor: t`ETH Registrar Controller`,
    logos: [ENS_IMG],
  },
}

function callsPositionManagerContract(assetActivity: TransactionActivity) {
  const supportedChain = supportedChainIdFromGQLChain(assetActivity.chain)
  if (!supportedChain) return false
  return isSameAddress(assetActivity.details.to, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[supportedChain])
}

// Gets counts for number of NFTs in each collection present
function getCollectionCounts(nftTransfers: NftTransferPartsFragment[]): { [key: string]: number | undefined } {
  return nftTransfers.reduce((acc, NFTChange) => {
    const key = NFTChange.asset.collection?.name ?? NFTChange.asset.name
    if (key) {
      acc[key] = (acc?.[key] ?? 0) + 1
    }
    return acc
  }, {} as { [key: string]: number | undefined })
}

function getSwapTitle(sent: TokenTransferPartsFragment, received: TokenTransferPartsFragment): string | undefined {
  const supportedSentChain = supportedChainIdFromGQLChain(sent.asset.chain)
  const supportedReceivedChain = supportedChainIdFromGQLChain(received.asset.chain)
  if (!supportedSentChain || !supportedReceivedChain) {
    logSentryErrorForUnsupportedChain({
      extras: { sentAsset: sent.asset, receivedAsset: received.asset },
      errorMessage: 'Invalid activity from unsupported chain received from GQL',
    })
    return undefined
  }
  if (
    sent.tokenStandard === 'NATIVE' &&
    isSameAddress(nativeOnChain(supportedSentChain).wrapped.address, received.asset.address)
  )
    return t`Wrapped`
  else if (
    received.tokenStandard === 'NATIVE' &&
    isSameAddress(nativeOnChain(supportedReceivedChain).wrapped.address, received.asset.address)
  ) {
    return t`Unwrapped`
  } else {
    return t`Swapped`
  }
}

function getSwapDescriptor({
  tokenIn,
  inputAmount,
  tokenOut,
  outputAmount,
}: {
  tokenIn: TokenAssetPartsFragment
  outputAmount: string
  tokenOut: TokenAssetPartsFragment
  inputAmount: string
}) {
  return `${inputAmount} ${tokenIn.symbol} for ${outputAmount} ${tokenOut.symbol}`
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed & formatted USD value as a string if currency is of type USD
 */
function getTransactedValue(transactedValue: TokenTransferPartsFragment['transactedValue']): number | undefined {
  if (!transactedValue) return undefined
  const price = transactedValue?.currency === GQLCurrency.Usd ? transactedValue.value ?? undefined : undefined
  return price
}

function parseSwap(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  if (changes.NftTransfer.length > 0 && changes.TokenTransfer.length === 1) {
    const collectionCounts = getCollectionCounts(changes.NftTransfer)

    const title = changes.NftTransfer[0].direction === 'IN' ? t`Bought` : t`Sold`
    const descriptor = Object.entries(collectionCounts)
      .map(([collectionName, count]) => `${count} ${collectionName}`)
      .join()

    return { title, descriptor }
  }
  // Some swaps may have more than 2 transfers, e.g. swaps with fees on tranfer
  if (changes.TokenTransfer.length >= 2) {
    const sent = changes.TokenTransfer.find((t) => t.direction === 'OUT')
    // Any leftover native token is refunded on exact_out swaps where the input token is native
    const refund = changes.TokenTransfer.find(
      (t) => t.direction === 'IN' && t.asset.id === sent?.asset.id && t.asset.standard === 'NATIVE'
    )
    const received = changes.TokenTransfer.find((t) => t.direction === 'IN' && t !== refund)

    if (sent && received) {
      const adjustedInput = parseFloat(sent.quantity) - parseFloat(refund?.quantity ?? '0')
      const inputAmount = formatNumberOrString({ input: adjustedInput, type: NumberType.TokenNonTx })
      const outputAmount = formatNumberOrString({ input: received.quantity, type: NumberType.TokenNonTx })
      return {
        title: getSwapTitle(sent, received),
        descriptor: getSwapDescriptor({ tokenIn: sent.asset, inputAmount, tokenOut: received.asset, outputAmount }),
        currencies: [gqlToCurrency(sent.asset), gqlToCurrency(received.asset)],
      }
    }
  }
  return { title: t`Unknown Swap` }
}

/**
 * Wrap/unwrap transactions are labelled as lend transactions on the backend.
 * This function parses the transaction changes to determine if the transaction is a wrap/unwrap transaction.
 */
function parseLend(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  const native = changes.TokenTransfer.find((t) => t.tokenStandard === 'NATIVE')?.asset
  const erc20 = changes.TokenTransfer.find((t) => t.tokenStandard === 'ERC20')?.asset
  if (native && erc20 && gqlToCurrency(native)?.wrapped.address === gqlToCurrency(erc20)?.wrapped.address) {
    return parseSwap(changes, formatNumberOrString)
  }
  return { title: t`Unknown Lend` }
}

function parseSwapOrder(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  return { ...parseSwap(changes, formatNumberOrString), prefixIconSrc: UniswapXBolt }
}

function parseApprove(changes: TransactionChanges) {
  if (changes.TokenApproval.length === 1) {
    const title = parseInt(changes.TokenApproval[0].quantity) === 0 ? t`Revoked Approval` : t`Approved`
    const descriptor = `${changes.TokenApproval[0].asset.symbol}`
    const currencies = [gqlToCurrency(changes.TokenApproval[0].asset)]
    return { title, descriptor, currencies }
  }
  return { title: t`Unknown Approval` }
}

function parseLPTransfers(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  const poolTokenA = changes.TokenTransfer[0]
  const poolTokenB = changes.TokenTransfer[1]

  const tokenAQuanitity = formatNumberOrString({ input: poolTokenA.quantity, type: NumberType.TokenNonTx })
  const tokenBQuantity = formatNumberOrString({ input: poolTokenB.quantity, type: NumberType.TokenNonTx })

  return {
    descriptor: `${tokenAQuanitity} ${poolTokenA.asset.symbol} and ${tokenBQuantity} ${poolTokenB.asset.symbol}`,
    logos: [poolTokenA.asset.project?.logo?.url, poolTokenB.asset.project?.logo?.url],
    currencies: [gqlToCurrency(poolTokenA.asset), gqlToCurrency(poolTokenB.asset)],
  }
}

type TransactionActivity = AssetActivityPartsFragment & { details: TransactionDetailsPartsFragment }
type OrderActivity = AssetActivityPartsFragment & { details: SwapOrderDetailsPartsFragment }

function parseSendReceive(
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity
) {
  // TODO(cartcrom): remove edge cases after backend implements
  // Edge case: Receiving two token transfers in interaction w/ V3 manager === removing liquidity. These edge cases should potentially be moved to backend
  if (changes.TokenTransfer.length === 2 && callsPositionManagerContract(assetActivity)) {
    return { title: t`Removed Liquidity`, ...parseLPTransfers(changes, formatNumberOrString) }
  }

  let transfer: NftTransferPartsFragment | TokenTransferPartsFragment | undefined
  let assetName: string | undefined
  let amount: string | undefined
  let currencies: (Currency | undefined)[] | undefined

  if (changes.NftTransfer.length === 1) {
    transfer = changes.NftTransfer[0]
    assetName = transfer.asset.collection?.name
    amount = '1'
  } else if (changes.TokenTransfer.length === 1) {
    transfer = changes.TokenTransfer[0]
    assetName = transfer.asset.symbol
    amount = formatNumberOrString({ input: transfer.quantity, type: NumberType.TokenNonTx })
    currencies = [gqlToCurrency(transfer.asset)]
  }

  if (transfer && assetName && amount) {
    const isMoonpayPurchase = MOONPAY_SENDER_ADDRESSES.some((address) => isSameAddress(address, transfer?.sender))

    if (transfer.direction === 'IN') {
      return isMoonpayPurchase && transfer.__typename === 'TokenTransfer'
        ? {
            title: t`Purchased`,
            descriptor: `${amount} ${assetName} ${t`for`} ${formatNumberOrString({
              input: getTransactedValue(transfer.transactedValue),
              type: NumberType.FiatTokenPrice,
            })}`,
            logos: [moonpayLogoSrc],
            currencies,
          }
        : {
            title: t`Received`,
            descriptor: `${amount} ${assetName} ${t`from`} `,
            otherAccount: isAddress(transfer.sender) || undefined,
            currencies,
          }
    } else {
      return {
        title: t`Sent`,
        descriptor: `${amount} ${assetName} ${t`to`} `,
        otherAccount: isAddress(transfer.recipient) || undefined,
        currencies,
      }
    }
  }
  return { title: t`Unknown Send` }
}

function parseMint(
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity
) {
  const collectionMap = getCollectionCounts(changes.NftTransfer)
  if (Object.keys(collectionMap).length === 1) {
    const collectionName = Object.keys(collectionMap)[0]

    // Edge case: Minting a v3 positon represents adding liquidity
    if (changes.TokenTransfer.length === 2 && callsPositionManagerContract(assetActivity)) {
      return { title: t`Added Liquidity`, ...parseLPTransfers(changes, formatNumberOrString) }
    }
    return { title: t`Minted`, descriptor: `${collectionMap[collectionName]} ${collectionName}` }
  }
  return { title: t`Unknown Mint` }
}

function parseUnknown(
  _changes: TransactionChanges,
  _formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity
) {
  return { title: t`Contract Interaction`, ...COMMON_CONTRACTS[assetActivity.details.to.toLowerCase()] }
}

type ActivityTypeParser = (
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity
) => Partial<Activity>
const ActivityParserByType: { [key: string]: ActivityTypeParser | undefined } = {
  [ActivityType.Swap]: parseSwap,
  [ActivityType.Lend]: parseLend,
  [ActivityType.SwapOrder]: parseSwapOrder,
  [ActivityType.Approve]: parseApprove,
  [ActivityType.Send]: parseSendReceive,
  [ActivityType.Receive]: parseSendReceive,
  [ActivityType.Mint]: parseMint,
  [ActivityType.Unknown]: parseUnknown,
}

function getLogoSrcs(changes: TransactionChanges): Array<string | undefined> {
  // Uses set to avoid duplicate logos (e.g. nft's w/ same image url)
  const logoSet = new Set<string | undefined>()
  // Uses only NFT logos if they are present (will not combine nft image w/ token image)
  if (changes.NftTransfer.length > 0) {
    changes.NftTransfer.forEach((nftChange) => logoSet.add(nftChange.asset.image?.url))
  } else {
    changes.TokenTransfer.forEach((tokenChange) => logoSet.add(tokenChange.asset.project?.logo?.url))
    changes.TokenApproval.forEach((tokenChange) => logoSet.add(tokenChange.asset.project?.logo?.url))
  }
  return Array.from(logoSet)
}

function parseUniswapXOrder({ details, chain, timestamp }: OrderActivity): Activity | undefined {
  // We currently only have a polling mechanism for locally-sent pending orders, so we hide remote pending orders since they won't update upon completion
  // TODO(WEB-2487): Add polling mechanism for remote orders to allow displaying remote pending orders
  if (details.orderStatus === SwapOrderStatus.Open) return undefined

  const { inputToken, inputTokenQuantity, outputToken, outputTokenQuantity, orderStatus } = details
  const uniswapXOrderStatus = OrderStatusTable[orderStatus]
  const { status, statusMessage, title } = OrderTextTable[uniswapXOrderStatus]
  const descriptor = getSwapDescriptor({
    tokenIn: inputToken,
    inputAmount: inputTokenQuantity,
    tokenOut: outputToken,
    outputAmount: outputTokenQuantity,
  })

  const supportedChain = supportedChainIdFromGQLChain(chain)
  if (!supportedChain) {
    logSentryErrorForUnsupportedChain({
      extras: { details },
      errorMessage: 'Invalid activity from unsupported chain received from GQL',
    })
    return undefined
  }

  return {
    hash: details.hash,
    chainId: supportedChain,
    status,
    statusMessage,
    offchainOrderStatus: uniswapXOrderStatus,
    timestamp,
    logos: [inputToken.project?.logo?.url, outputToken.project?.logo?.url],
    currencies: [gqlToCurrency(inputToken), gqlToCurrency(outputToken)],
    title,
    descriptor,
    from: details.offerer,
    prefixIconSrc: UniswapXBolt,
  }
}

function parseRemoteActivity(
  assetActivity: AssetActivityPartsFragment,
  formatNumberOrString: FormatNumberOrStringFunctionType
): Activity | undefined {
  try {
    if (assetActivity.details.__typename === 'SwapOrderDetails') {
      return parseUniswapXOrder(assetActivity as OrderActivity)
    }

    const changes = assetActivity.details.assetChanges.reduce(
      (acc: TransactionChanges, assetChange) => {
        if (assetChange.__typename === 'NftApproval') acc.NftApproval.push(assetChange)
        else if (assetChange.__typename === 'NftApproveForAll') acc.NftApproveForAll.push(assetChange)
        else if (assetChange.__typename === 'NftTransfer') acc.NftTransfer.push(assetChange)
        else if (assetChange.__typename === 'TokenTransfer') acc.TokenTransfer.push(assetChange)
        else if (assetChange.__typename === 'TokenApproval') acc.TokenApproval.push(assetChange)

        return acc
      },
      { NftTransfer: [], TokenTransfer: [], TokenApproval: [], NftApproval: [], NftApproveForAll: [] }
    )
    const supportedChain = supportedChainIdFromGQLChain(assetActivity.chain)
    if (!supportedChain) {
      logSentryErrorForUnsupportedChain({
        extras: { assetActivity },
        errorMessage: 'Invalid activity from unsupported chain received from GQL',
      })
      return undefined
    }

    const defaultFields = {
      hash: assetActivity.details.hash,
      chainId: supportedChain,
      status: assetActivity.details.status,
      timestamp: assetActivity.timestamp,
      logos: getLogoSrcs(changes),
      title: assetActivity.details.type,
      descriptor: assetActivity.details.to,
      from: assetActivity.details.from,
      nonce: assetActivity.details.nonce,
    }

    const parsedFields = ActivityParserByType[assetActivity.details.type]?.(
      changes,
      formatNumberOrString,
      assetActivity as TransactionActivity
    )
    return { ...defaultFields, ...parsedFields }
  } catch (e) {
    console.error('Failed to parse activity', e, assetActivity)
    return undefined
  }
}

export function parseRemoteActivities(
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivities?: readonly AssetActivityPartsFragment[]
) {
  return assetActivities?.reduce((acc: { [hash: string]: Activity }, assetActivity) => {
    const activity = parseRemoteActivity(assetActivity, formatNumberOrString)
    if (activity) acc[activity.hash] = activity
    return acc
  }, {})
}

const getTimeSince = (timestamp: number) => {
  const seconds = Math.floor(Date.now() - timestamp * 1000)

  let interval
  // TODO(cartcrom): use locale to determine date shorthands to use for non-english
  if ((interval = seconds / ms(`1y`)) > 1) return Math.floor(interval) + 'y'
  if ((interval = seconds / ms(`30d`)) > 1) return Math.floor(interval) + 'mo'
  if ((interval = seconds / ms(`1d`)) > 1) return Math.floor(interval) + 'd'
  if ((interval = seconds / ms(`1h`)) > 1) return Math.floor(interval) + 'h'
  if ((interval = seconds / ms(`1m`)) > 1) return Math.floor(interval) + 'm'
  else return Math.floor(seconds / ms(`1s`)) + 's'
}

/**
 * Keeps track of the time since a given timestamp, keeping it up to date every second when necessary
 * @param timestamp
 * @returns
 */
export function useTimeSince(timestamp: number) {
  const [timeSince, setTimeSince] = useState<string>(getTimeSince(timestamp))

  useEffect(() => {
    const refreshTime = () =>
      setTimeout(() => {
        if (Math.floor(Date.now() - timestamp * 1000) / ms(`61s`) <= 1) {
          setTimeSince(getTimeSince(timestamp))
          timeout = refreshTime()
        }
      }, ms(`1s`))

    let timeout = refreshTime()

    return () => {
      timeout && clearTimeout(timeout)
    }
  }, [timestamp])

  return timeSince
}
