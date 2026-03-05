import { UNI_ADDRESSES } from '@uniswap/sdk-core'
import { ActivityRowFragments } from 'components/ActivityTable/activityTableModels'
import { AssetType } from 'uniswap/src/entities/assets'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

/**
 * Builds activity row fragments for a transaction by mapping from parsed typeInfo.
 * Returns empty object for unsupported transaction types.
 *
 * @param details - The transaction details with parsed typeInfo
 * @returns Activity row fragments containing amount, counterparty, and type label data
 */
export function buildActivityRowFragments(details: TransactionDetails): ActivityRowFragments {
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
          baseGroup: 'swaps',
          overrideLabelKey: 'transaction.status.swap.success',
        },
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
          baseGroup: 'swaps',
        },
      }

    case TransactionType.Send: {
      const currencyId =
        typeInfo.assetType === AssetType.Currency ? buildCurrencyId(chainId, typeInfo.tokenAddress) : undefined

      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.currencyAmountRaw,
        },
        counterparty: typeInfo.recipient ? getValidAddress({ address: typeInfo.recipient, chainId }) : null,
        typeLabel: {
          baseGroup: 'sent',
        },
      }
    }

    case TransactionType.Receive: {
      const currencyId =
        typeInfo.assetType === AssetType.Currency ? buildCurrencyId(chainId, typeInfo.tokenAddress) : undefined

      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.currencyAmountRaw,
        },
        counterparty: typeInfo.sender ? getValidAddress({ address: typeInfo.sender, chainId }) : null,
        typeLabel: {
          baseGroup: 'received',
        },
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
          baseGroup: null,
          overrideLabelKey: 'common.approved',
        },
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
          baseGroup: 'swaps',
          overrideLabelKey: typeInfo.unwrapped ? 'common.unwrapped' : 'common.wrapped',
        },
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
          baseGroup: null,
          overrideLabelKey: 'pool.create',
        },
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
          baseGroup: 'deposits',
          overrideLabelKey: 'common.addLiquidity',
        },
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
          baseGroup: null,
          overrideLabelKey: 'pool.removeLiquidity',
        },
      }

    case TransactionType.NFTMint: {
      const currencyId = typeInfo.purchaseCurrencyId
      return {
        amount: {
          kind: 'single',
          currencyId,
          amountRaw: typeInfo.purchaseCurrencyAmountRaw,
        },
        counterparty: typeInfo.dappInfo?.address
          ? getValidAddress({ address: typeInfo.dappInfo.address, chainId })
          : null,
        typeLabel: {
          baseGroup: null,
          overrideLabelKey: 'transaction.status.mint.success',
        },
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
          baseGroup: null,
          overrideLabelKey: 'transaction.status.collected.fees',
        },
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
          baseGroup: null,
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
          baseGroup: null,
          overrideLabelKey: 'common.claimed',
        },
      }
    }

    default:
      return {}
  }
}
