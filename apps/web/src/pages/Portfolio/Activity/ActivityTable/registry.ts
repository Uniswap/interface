import { UNI_ADDRESSES } from '@uniswap/sdk-core'
import { ActivityProtocolInfo, ActivityRowFragments } from 'pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { ActivityFilterType } from 'pages/Portfolio/Activity/Filters/utils'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  DappInfoTransactionDetails,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

function toProtocolInfo(dappInfo: DappInfoTransactionDetails | undefined): ActivityProtocolInfo | null {
  if (!dappInfo?.name) {
    return null
  }
  return {
    name: normalizeProtocolName(dappInfo.name),
    logoUrl: dappInfo.icon,
  }
}

/**
 * Normalizes protocol names for display in the activity table.
 * Applies hardcoded corrections to protocol names from the backend.
 */
function normalizeProtocolName(name: string): string {
  if (name === 'Across API') {
    return 'Across'
  }
  if (name === 'Uniswap V4' || name === 'Uniswap V3' || name === 'Uniswap V2') {
    return 'Uniswap'
  }
  return name
}

// Cache size set to 2x the maximum possible transactions (250) to handle refetches and scrolling
const MAX_CACHE_SIZE = 500
const fragmentsCache = new Map<string, ActivityRowFragments>()

/**
 * Creates a stable cache key from transaction details.
 * Uses chainId and id which are stable identifiers that persist across refetches.
 */
function getTransactionCacheKey(details: TransactionDetails): string {
  return `${details.chainId}:${details.id}`
}

/**
 * Builds activity row fragments for a transaction by mapping from parsed typeInfo.
 * Returns empty object for unsupported transaction types.
 * Results are memoized per transaction identifier to avoid redundant computation.
 *
 * @param details - The transaction details with parsed typeInfo
 * @returns Activity row fragments containing amount, counterparty, and type label data
 */
export function buildActivityRowFragments(details: TransactionDetails): ActivityRowFragments {
  // Check cache first using stable identifier
  const cacheKey = getTransactionCacheKey(details)
  const cached = fragmentsCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Compute fragments
  const fragments = buildActivityRowFragmentsInternal(details)

  // Simple LRU: remove oldest entry if cache is full
  if (fragmentsCache.size >= MAX_CACHE_SIZE) {
    const firstKey = fragmentsCache.keys().next().value

    if (typeof firstKey === 'string') {
      fragmentsCache.delete(firstKey)
    }
  }

  // Cache and return
  fragmentsCache.set(cacheKey, fragments)
  return fragments
}

/**
 * Internal implementation that actually builds the fragments.
 * Separated to allow memoization wrapper.
 */
function buildActivityRowFragmentsInternal(details: TransactionDetails): ActivityRowFragments {
  const { typeInfo, chainId } = details

  switch (typeInfo.type) {
    case TransactionType.Swap:
      return {
        amount: {
          kind: 'pair',
          inputCurrencyId: typeInfo.inputCurrencyId,
          outputCurrencyId: typeInfo.outputCurrencyId,
          inputAmountRaw: 'inputCurrencyAmountRaw' in typeInfo ? typeInfo.inputCurrencyAmountRaw : undefined,
          outputAmountRaw: 'outputCurrencyAmountRaw' in typeInfo ? typeInfo.outputCurrencyAmountRaw : undefined,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Swaps,
          overrideLabelKey: 'transaction.status.swap.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }

    case TransactionType.Bridge:
      return {
        amount: {
          kind: 'pair',
          inputCurrencyId: typeInfo.inputCurrencyId,
          outputCurrencyId: typeInfo.outputCurrencyId,
          inputAmountRaw: 'inputCurrencyAmountRaw' in typeInfo ? typeInfo.inputCurrencyAmountRaw : undefined,
          outputAmountRaw: 'outputCurrencyAmountRaw' in typeInfo ? typeInfo.outputCurrencyAmountRaw : undefined,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Swaps,
          overrideLabelKey: 'transaction.status.swap.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.routingDappInfo),
      }

    case TransactionType.Send: {
      const currencyId = buildCurrencyId(chainId, typeInfo.tokenAddress)

      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.currencyAmountRaw,
        },
        counterparty: typeInfo.recipient ? getValidAddress({ address: typeInfo.recipient, chainId }) : null,
        typeLabel: {
          baseGroup: ActivityFilterType.Sends,
          overrideLabelKey: 'transaction.status.send.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.Receive: {
      // Handle NFT receives
      if (typeInfo.assetType === AssetType.ERC721 || typeInfo.assetType === AssetType.ERC1155) {
        return {
          amount: typeInfo.nftSummaryInfo
            ? {
                kind: 'nft',
                nftImageUrl: typeInfo.nftSummaryInfo.imageURL,
                nftName: typeInfo.nftSummaryInfo.name,
                nftCollectionName: typeInfo.nftSummaryInfo.collectionName,
              }
            : null,
          counterparty: typeInfo.sender ? getValidAddress({ address: typeInfo.sender, chainId }) : null,
          typeLabel: {
            baseGroup: ActivityFilterType.Receives,
          },
          protocolInfo: toProtocolInfo(typeInfo.dappInfo),
        }
      }

      // Handle regular token receives
      const currencyId = buildCurrencyId(chainId, typeInfo.tokenAddress)

      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.currencyAmountRaw,
        },
        counterparty: typeInfo.sender ? getValidAddress({ address: typeInfo.sender, chainId }) : null,
        typeLabel: {
          baseGroup: ActivityFilterType.Receives,
          overrideLabelKey: 'transaction.status.receive.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.Approve: {
      const currencyId = buildCurrencyId(chainId, typeInfo.tokenAddress)

      return {
        amount: {
          kind: 'approve',
          currencyId,
          approvalAmount: typeInfo.approvalAmount,
        },
        counterparty: typeInfo.spender ? getValidAddress({ address: typeInfo.spender, chainId }) : null,
        typeLabel: {
          baseGroup: ActivityFilterType.Approvals,
          overrideLabelKey: 'common.approved',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.Wrap:
      return {
        amount: {
          kind: 'wrap',
          unwrapped: typeInfo.unwrapped,
          amountRaw: typeInfo.currencyAmountRaw,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Wraps,
          overrideLabelKey: typeInfo.unwrapped ? 'common.unwrapped' : 'common.wrapped',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }

    case TransactionType.CreatePool:
    case TransactionType.CreatePair:
      return {
        amount: {
          kind: 'liquidity-pair',
          currency0Id: typeInfo.currency0Id,
          currency1Id: typeInfo.currency1Id,
          currency0AmountRaw: typeInfo.currency0AmountRaw,
          currency1AmountRaw: typeInfo.currency1AmountRaw,
        },
        counterparty: typeInfo.dappInfo?.address
          ? getValidAddress({ address: typeInfo.dappInfo.address, chainId })
          : null,
        typeLabel: {
          baseGroup: ActivityFilterType.CreatePool,
          overrideLabelKey: 'pool.create',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }

    case TransactionType.LiquidityIncrease:
      return {
        amount: {
          kind: 'liquidity-pair',
          currency0Id: typeInfo.currency0Id,
          currency1Id: typeInfo.currency1Id,
          currency0AmountRaw: typeInfo.currency0AmountRaw,
          currency1AmountRaw: typeInfo.currency1AmountRaw,
        },
        counterparty: typeInfo.dappInfo?.address
          ? getValidAddress({ address: typeInfo.dappInfo.address, chainId })
          : null,
        typeLabel: {
          baseGroup: ActivityFilterType.AddLiquidity,
          overrideLabelKey: 'common.addLiquidity',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }

    case TransactionType.LiquidityDecrease:
      return {
        amount: {
          kind: 'liquidity-pair',
          currency0Id: typeInfo.currency0Id,
          currency1Id: typeInfo.currency1Id,
          currency0AmountRaw: typeInfo.currency0AmountRaw,
          currency1AmountRaw: typeInfo.currency1AmountRaw,
        },
        counterparty: typeInfo.dappInfo?.address
          ? getValidAddress({ address: typeInfo.dappInfo.address, chainId })
          : null,
        typeLabel: {
          baseGroup: ActivityFilterType.RemoveLiquidity,
          overrideLabelKey: 'pool.removeLiquidity',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }

    case TransactionType.NFTMint: {
      return {
        amount: {
          kind: 'nft',
          nftImageUrl: typeInfo.nftSummaryInfo.imageURL,
          nftName: typeInfo.nftSummaryInfo.name,
          nftCollectionName: typeInfo.nftSummaryInfo.collectionName,
          purchaseCurrencyId: typeInfo.purchaseCurrencyId,
          purchaseAmountRaw: typeInfo.purchaseCurrencyAmountRaw,
        },
        counterparty: typeInfo.dappInfo?.address
          ? getValidAddress({ address: typeInfo.dappInfo.address, chainId })
          : null,
        typeLabel: {
          baseGroup: ActivityFilterType.Mints,
          overrideLabelKey: 'transaction.status.mint.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.CollectFees:
      return {
        amount: typeInfo.currency1Id
          ? {
              kind: 'liquidity-pair',
              currency0Id: typeInfo.currency0Id,
              currency1Id: typeInfo.currency1Id,
              currency0AmountRaw: typeInfo.currency0AmountRaw,
              currency1AmountRaw: typeInfo.currency1AmountRaw,
            }
          : {
              kind: 'single',
              currencyId: typeInfo.currency0Id,
              amountRaw: typeInfo.currency0AmountRaw,
            },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.ClaimFees,
          overrideLabelKey: 'transaction.status.collected.fees',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }

    case TransactionType.LPIncentivesClaimRewards: {
      const currencyId = buildCurrencyId(chainId, typeInfo.tokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: undefined,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.ClaimFees,
          overrideLabelKey: 'transaction.status.collected.fees',
        },
      }
    }

    case TransactionType.ClaimUni: {
      const tokenAddress = UNI_ADDRESSES[chainId]
      const currencyId = tokenAddress ? buildCurrencyId(chainId, tokenAddress) : undefined
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.uniAmountRaw,
        },
        counterparty: getValidAddress({ address: typeInfo.recipient, chainId }),
        typeLabel: {
          baseGroup: ActivityFilterType.ClaimFees,
          overrideLabelKey: 'common.claimed',
        },
      }
    }

    case TransactionType.Unknown: {
      return {
        amount: typeInfo.tokenAddress
          ? {
              kind: 'single',
              currencyId: buildCurrencyId(chainId, typeInfo.tokenAddress),
              amountRaw: undefined,
            }
          : null,
        counterparty: null,
        typeLabel: undefined,
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    default:
      return {}
  }
}
