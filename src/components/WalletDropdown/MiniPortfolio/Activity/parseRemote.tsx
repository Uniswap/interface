import { t } from '@lingui/macro'
import { formatNumberOrString, NumberType } from '@uniswap/conedison/format'
import { SupportedChainId } from '@uniswap/sdk-core'
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, UNI_ADDRESS } from 'constants/addresses'
import { nativeOnChain } from 'constants/tokens'
import {
  ActivityType,
  AssetActivityPartsFragment,
  NftApprovalPartsFragment,
  NftApproveForAllPartsFragment,
  NftTransferPartsFragment,
  TokenApprovalPartsFragment,
  TokenTransferPartsFragment,
} from 'graphql/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'graphql/data/util'
import ms from 'ms.macro'
import { useEffect, useState } from 'react'
import { isAddress } from 'utils'

import { Activity } from './types'

type TransactionChanges = {
  NftTransfer: NftTransferPartsFragment[]
  TokenTransfer: TokenTransferPartsFragment[]
  TokenApproval: TokenApprovalPartsFragment[]
  NftApproval: NftApprovalPartsFragment[]
  NftApproveForAll: NftApproveForAllPartsFragment[]
}

// TODO: Move common contract metadata to a backend service
const UNI_IMG =
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png'

const ENS_IMG =
  'https://464911102-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/collections%2F2TjMAeHSzwlQgcOdL48E%2Ficon%2FKWP0gk2C6bdRPliWIA6o%2Fens%20transparent%20background.png?alt=media&token=bd28b063-5a75-4971-890c-97becea09076'

const COMMON_CONTRACTS: { [key: string]: Partial<Activity> | undefined } = {
  [UNI_ADDRESS[SupportedChainId.MAINNET].toLowerCase()]: {
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

function isSameAddress(a?: string, b?: string) {
  return a === b || a?.toLowerCase() === b?.toLowerCase() // Lazy-lowercases the addresses
}

function callsPositionManagerContract(assetActivity: AssetActivityPartsFragment) {
  return isSameAddress(
    assetActivity.transaction.to,
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[fromGraphQLChain(assetActivity.chain)]
  )
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

function getSwapTitle(sent: TokenTransferPartsFragment, received: TokenTransferPartsFragment) {
  if (
    sent.tokenStandard === 'NATIVE' &&
    isSameAddress(nativeOnChain(fromGraphQLChain(sent.asset.chain)).wrapped.address, received.asset.address)
  )
    return t`Wrapped`
  else if (
    received.tokenStandard === 'NATIVE' &&
    isSameAddress(nativeOnChain(fromGraphQLChain(received.asset.chain)).wrapped.address, received.asset.address)
  ) {
    return t`Unwrapped`
  } else {
    return t`Swapped`
  }
}

function parseSwap(changes: TransactionChanges) {
  if (changes.NftTransfer.length > 0 && changes.TokenTransfer.length === 1) {
    const collectionCounts = getCollectionCounts(changes.NftTransfer)

    const title = changes.NftTransfer[0].direction === 'IN' ? t`Bought` : t`Sold`
    const descriptor = Object.entries(collectionCounts)
      .map(([collectionName, count]) => `${count} ${collectionName}`)
      .join()

    return { title, descriptor }
  } else if (changes.TokenTransfer.length === 2) {
    const sent = changes.TokenTransfer.find((t) => t?.__typename === 'TokenTransfer' && t.direction === 'OUT')
    const received = changes.TokenTransfer.find((t) => t?.__typename === 'TokenTransfer' && t.direction === 'IN')
    if (sent && received) {
      const inputAmount = formatNumberOrString(sent.quantity, NumberType.TokenNonTx)
      const outputAmount = formatNumberOrString(received.quantity, NumberType.TokenNonTx)
      return {
        title: getSwapTitle(sent, received),
        descriptor: `${inputAmount} ${sent.asset.symbol} for ${outputAmount} ${received.asset.symbol}`,
      }
    }
  }
  return { title: t`Unknown Swap` }
}

function parseApprove(changes: TransactionChanges) {
  if (changes.TokenApproval.length === 1) {
    const title = parseInt(changes.TokenApproval[0].quantity) === 0 ? t`Revoked Approval` : t`Approved`
    const descriptor = `${changes.TokenApproval[0].asset.symbol}`
    return { title, descriptor }
  }
  return { title: t`Unknown Approval` }
}

function parseLPTransfers(changes: TransactionChanges) {
  const poolTokenA = changes.TokenTransfer[0]
  const poolTokenB = changes.TokenTransfer[1]

  const tokenAQuanitity = formatNumberOrString(poolTokenA.quantity, NumberType.TokenNonTx)
  const tokenBQuantity = formatNumberOrString(poolTokenB.quantity, NumberType.TokenNonTx)

  return {
    descriptor: `${tokenAQuanitity} ${poolTokenA.asset.symbol} and ${tokenBQuantity} ${poolTokenB.asset.symbol}`,
    logos: [poolTokenA.asset.project?.logo?.url, poolTokenB.asset.project?.logo?.url],
  }
}

function parseSendReceive(changes: TransactionChanges, assetActivity: AssetActivityPartsFragment) {
  // TODO(cartcrom): remove edge cases after backend implements
  // Edge case: Receiving two token transfers in interaction w/ V3 manager === removing liquidity. These edge cases should potentially be moved to backend
  if (changes.TokenTransfer.length === 2 && callsPositionManagerContract(assetActivity)) {
    return { title: t`Removed Liquidity`, ...parseLPTransfers(changes) }
  }

  let transfer: NftTransferPartsFragment | TokenTransferPartsFragment | undefined
  let assetName: string | undefined
  let amount: string | undefined

  if (changes.NftTransfer.length === 1) {
    transfer = changes.NftTransfer[0]
    assetName = transfer.asset.collection?.name
    amount = '1'
  } else if (changes.TokenTransfer.length === 1) {
    transfer = changes.TokenTransfer[0]
    assetName = transfer.asset.symbol
    amount = formatNumberOrString(transfer.quantity, NumberType.TokenNonTx)
  }

  if (transfer && assetName && amount) {
    return transfer.direction === 'IN'
      ? {
          title: t`Received`,
          descriptor: `${amount} ${assetName} ${t`from`} `,
          otherAccount: isAddress(transfer.sender) || undefined,
        }
      : {
          title: t`Sent`,
          descriptor: `${amount} ${assetName} ${t`to`} `,
          otherAccount: isAddress(transfer.recipient) || undefined,
        }
  }
  return { title: t`Unknown Send` }
}

function parseMint(changes: TransactionChanges, assetActivity: AssetActivityPartsFragment) {
  const collectionMap = getCollectionCounts(changes.NftTransfer)
  if (Object.keys(collectionMap).length === 1) {
    const collectionName = Object.keys(collectionMap)[0]

    // Edge case: Minting a v3 positon represents adding liquidity
    if (changes.TokenTransfer.length === 2 && callsPositionManagerContract(assetActivity)) {
      return { title: t`Added Liquidity`, ...parseLPTransfers(changes) }
    }
    return { title: t`Minted`, descriptor: `${collectionMap[collectionName]} ${collectionName}` }
  }
  return { title: t`Unknown Mint` }
}

function parseUnknown(_changes: TransactionChanges, assetActivity: AssetActivityPartsFragment) {
  return { title: t`Contract Interaction`, ...COMMON_CONTRACTS[assetActivity.transaction.to.toLowerCase()] }
}

type ActivityTypeParser = (changes: TransactionChanges, assetActivity: AssetActivityPartsFragment) => Partial<Activity>
const ActivityParserByType: { [key: string]: ActivityTypeParser | undefined } = {
  [ActivityType.Swap]: parseSwap,
  [ActivityType.Approve]: parseApprove,
  [ActivityType.Send]: parseSendReceive,
  [ActivityType.Receive]: parseSendReceive,
  [ActivityType.Mint]: parseMint,
  [ActivityType.Unknown]: parseUnknown,
}

function getLogoSrcs(changes: TransactionChanges): string[] {
  // Uses set to avoid duplicate logos (e.g. nft's w/ same image url)
  const logoSet = new Set<string | undefined>()
  // Uses only NFT logos if they are present (will not combine nft image w/ token image)
  if (changes.NftTransfer.length > 0) {
    changes.NftTransfer.forEach((nftChange) => logoSet.add(nftChange.asset.image?.url))
  } else {
    changes.TokenTransfer.forEach((tokenChange) => logoSet.add(tokenChange.asset.project?.logo?.url))
    changes.TokenApproval.forEach((tokenChange) => logoSet.add(tokenChange.asset.project?.logo?.url))
  }
  return Array.from(logoSet).filter(Boolean) as string[]
}

function parseRemoteActivity(assetActivity: AssetActivityPartsFragment): Activity | undefined {
  try {
    const changes = assetActivity.assetChanges.reduce(
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
    const defaultFields = {
      hash: assetActivity.transaction.hash,
      chainId: fromGraphQLChain(assetActivity.chain),
      status: assetActivity.transaction.status,
      timestamp: assetActivity.timestamp,
      logos: getLogoSrcs(changes),
      title: assetActivity.type,
      descriptor: assetActivity.transaction.to,
      receipt: assetActivity.transaction,
    }
    const parsedFields = ActivityParserByType[assetActivity.type]?.(changes, assetActivity)

    return { ...defaultFields, ...parsedFields }
  } catch (e) {
    console.error('Failed to parse activity', e, assetActivity)
    return undefined
  }
}

export function parseRemoteActivities(assetActivities?: AssetActivityPartsFragment[]) {
  return assetActivities?.reduce((acc: { [hash: string]: Activity }, assetActivity) => {
    const activity = parseRemoteActivity(assetActivity)
    if (activity) acc[activity.hash] = activity
    return acc
  }, {})
}

const getTimeSince = (timestamp: number) => {
  const seconds = Math.floor(Date.now() - timestamp * 1000)

  let interval
  // TODO(cartcrom): use locale to determine date shorthands to use for non-english
  if ((interval = seconds / ms`1y`) > 1) return Math.floor(interval) + 'y'
  if ((interval = seconds / ms`30d`) > 1) return Math.floor(interval) + 'mo'
  if ((interval = seconds / ms`1d`) > 1) return Math.floor(interval) + 'd'
  if ((interval = seconds / ms`1h`) > 1) return Math.floor(interval) + 'h'
  if ((interval = seconds / ms`1m`) > 1) return Math.floor(interval) + 'm'
  else return Math.floor(seconds / ms`1s`) + 's'
}

/**
 * Keeps track of the time since a given timestamp, keeping it up to date every second when necessary
 * @param timestamp
 * @returns
 */
export function useTimeSince(timestamp: number) {
  const [timeSince, setTimeSince] = useState<string>(getTimeSince(timestamp))

  useEffect(() => {
    const refreshTime = () => {
      if (Math.floor(Date.now() - timestamp * 1000) / ms`61s` <= 1) {
        setTimeSince(getTimeSince(timestamp))
        setTimeout(() => {
          refreshTime()
        }, ms`1s`)
      }
    }
    refreshTime()
  }, [timestamp])

  return timeSince
}
