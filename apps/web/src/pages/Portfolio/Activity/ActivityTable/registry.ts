import { UNI_ADDRESSES } from '@uniswap/sdk-core'
import { AssetType } from 'uniswap/src/entities/assets'
import { getAmountsFromTrade } from 'uniswap/src/features/transactions/swap/utils/getAmountsFromTrade'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionDetails } from 'uniswap/src/features/transactions/types/utils'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId, buildNativeCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { ActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { toProtocolInfo } from '~/pages/Portfolio/Activity/ActivityTable/protocolInfo'
import {
  cacheActivityRowFragments,
  getCachedActivityRowFragments,
} from '~/pages/Portfolio/Activity/ActivityTable/registryCache'
import { buildEarnPlanActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registryEarnPlanFragments'
import { logInvalidTransactionType } from '~/pages/Portfolio/Activity/ActivityTable/registryLogging'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'

type ActivityRowFragmentsOptions = { isEarnActivityDisplayEnabled?: boolean }

/**
 * Builds activity row fragments for a transaction by mapping from parsed typeInfo.
 * Returns empty object for unsupported transaction types.
 * Results are memoized per transaction identifier to avoid redundant computation.
 *
 * @param details - The transaction details with parsed typeInfo
 * @returns Activity row fragments containing amount, counterparty, and type label data
 */
export function buildActivityRowFragments(
  details: TransactionDetails,
  { isEarnActivityDisplayEnabled = true }: ActivityRowFragmentsOptions = {},
): ActivityRowFragments {
  const options = { isEarnActivityDisplayEnabled }
  const cached = getCachedActivityRowFragments(details, options)
  if (cached) {
    return cached
  }

  const fragments = buildActivityRowFragmentsInternal(details, options)
  cacheActivityRowFragments({ details, fragments, isEarnActivityDisplayEnabled })
  return fragments
}

/**
 * Internal implementation that actually builds the fragments.
 * Separated to allow memoization wrapper.
 */
// oxlint-disable-next-line complexity
function buildActivityRowFragmentsInternal(
  details: TransactionDetails,
  { isEarnActivityDisplayEnabled }: Required<ActivityRowFragmentsOptions>,
): ActivityRowFragments {
  const { typeInfo, chainId } = details

  switch (typeInfo.type) {
    case TransactionType.Swap: {
      const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
      return {
        amount: {
          kind: 'pair',
          inputCurrencyId: typeInfo.inputCurrencyId,
          outputCurrencyId: typeInfo.outputCurrencyId,
          inputAmountRaw: inputCurrencyAmountRaw || undefined,
          outputAmountRaw: outputCurrencyAmountRaw || undefined,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Swaps,
          overrideLabelKey: 'transaction.status.swap.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }
    case TransactionType.Plan: {
      if (!isPlanTransactionDetails(details)) {
        logInvalidTransactionType(typeInfo)
        return {}
      }
      const status = details.status
      if (isEarnActivityDisplayEnabled && typeInfo.earnAction) {
        return buildEarnPlanActivityRowFragments(typeInfo, status)
      }

      const overrideLabelKey =
        status === TransactionStatus.Success
          ? 'transaction.status.swap.success'
          : 'transaction.status.plan.interruptedShort'
      return {
        amount: {
          kind: 'pair',
          inputCurrencyId: typeInfo.inputCurrencyId,
          outputCurrencyId: typeInfo.outputCurrencyId,
          inputAmountRaw: typeInfo.inputCurrencyAmountRaw,
          outputAmountRaw: typeInfo.outputCurrencyAmountRaw,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Swaps,
          overrideLabelKey,
        },
      }
    }
    case TransactionType.Bridge: {
      const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)
      return {
        amount: {
          kind: 'pair',
          inputCurrencyId: typeInfo.inputCurrencyId,
          outputCurrencyId: typeInfo.outputCurrencyId,
          inputAmountRaw: inputCurrencyAmountRaw || undefined,
          outputAmountRaw: outputCurrencyAmountRaw || undefined,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Swaps,
          overrideLabelKey: 'transaction.status.swap.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.routingDappInfo),
      }
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
            overrideLabelKey: 'transaction.status.receive.success',
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
    case TransactionType.Deposit: {
      const currencyId = buildCurrencyId(chainId, typeInfo.tokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.currencyAmountRaw,
        },
        counterparty: typeInfo.dappInfo?.address
          ? getValidAddress({ address: typeInfo.dappInfo.address, chainId })
          : null,
        typeLabel: {
          baseGroup: ActivityFilterType.Sends,
          overrideLabelKey: 'transaction.status.deposit.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }
    case TransactionType.Withdraw: {
      const currencyId = buildCurrencyId(chainId, typeInfo.tokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.currencyAmountRaw,
        },
        counterparty: typeInfo.dappInfo?.address
          ? getValidAddress({ address: typeInfo.dappInfo.address, chainId })
          : null,
        typeLabel: {
          baseGroup: ActivityFilterType.Receives,
          overrideLabelKey: 'transaction.status.withdraw.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
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

    case TransactionType.ToucanBid: {
      const currencyId = isNativeCurrencyAddress(chainId, typeInfo.bidTokenAddress)
        ? buildNativeCurrencyId(chainId)
        : buildCurrencyId(chainId, typeInfo.bidTokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.amountRaw,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Sends,
          overrideLabelKey: 'transaction.status.submitBid.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.AuctionBid: {
      const currencyId = isNativeCurrencyAddress(chainId, typeInfo.bidTokenAddress)
        ? buildNativeCurrencyId(chainId)
        : buildCurrencyId(chainId, typeInfo.bidTokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.amountRaw,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Sends,
          overrideLabelKey: 'transaction.status.submitBid.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.AuctionClaimed: {
      const currencyId = isNativeCurrencyAddress(chainId, typeInfo.tokenAddress)
        ? buildNativeCurrencyId(chainId)
        : buildCurrencyId(chainId, typeInfo.tokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.amountRaw,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Receives,
          overrideLabelKey: 'transaction.status.auctionClaimed.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.AuctionExited: {
      const currencyId = isNativeCurrencyAddress(chainId, typeInfo.tokenAddress)
        ? buildNativeCurrencyId(chainId)
        : buildCurrencyId(chainId, typeInfo.tokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.amountRaw,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Receives,
          overrideLabelKey: 'transaction.status.withdrawBid.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
      }
    }

    case TransactionType.AuctionLaunch: {
      const currencyId = buildCurrencyId(chainId, typeInfo.predictedTokenAddress)
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: undefined,
        },
        counterparty: null,
        typeLabel: {
          baseGroup: ActivityFilterType.Sends,
          overrideLabelKey: 'toucan.createAuction.transaction.success',
        },
        protocolInfo: toProtocolInfo(typeInfo.dappInfo),
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
