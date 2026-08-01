import { EarnPlanAction, PlanStatus, PlanStepStatus, SwapType } from '@uniswap/client-data-api/dist/data/v1/plan_pb'
import type { PlanActivity, PlanTransaction, TokenAmount } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { EarnAction } from '@universe/api/src/clients/trading/__generated__/models/EarnAction'
import { DAI } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import extractPlanDetails from 'uniswap/src/features/activity/extract/extractPlanDetails'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures'

const PLAN_ID = 'plan-id'
const SWAPPER = SAMPLE_SEED_ADDRESS_1
const VAULT_ADDRESS = SAMPLE_SEED_ADDRESS_2
const CREATED_AT_MILLIS = 1 as unknown as bigint
const LAST_USER_ACTION_AT_MILLIS = 2 as unknown as bigint

function tokenAmount(address: Address, amount: string): TokenAmount {
  return {
    token: {
      address,
      chainId: UniverseChainId.Mainnet,
    },
    amount: { raw: amount },
  } as TokenAmount
}

function planActivity({
  swapType,
  tokenInAddress,
  tokenOutAddress,
  tokenInAmount,
  tokenOutAmount,
}: {
  swapType: SwapType
  tokenInAddress: Address
  tokenOutAddress: Address
  tokenInAmount: string
  tokenOutAmount: string
}): PlanActivity {
  return {
    swapType,
    tokenIn: {
      address: tokenInAddress,
      chainId: UniverseChainId.Mainnet,
    },
    tokenOut: {
      address: tokenOutAddress,
      chainId: UniverseChainId.Mainnet,
    },
    tokenInAmount: { raw: tokenInAmount },
    tokenOutAmount: { raw: tokenOutAmount },
    transactionHash: '0xhash',
    status: PlanStepStatus.COMPLETE,
  } as PlanActivity
}

function planTransaction({
  earnAction,
  assetsIn,
  assetsOut,
  activities,
}: {
  earnAction?: EarnPlanAction
  assetsIn: TokenAmount[]
  assetsOut: TokenAmount[]
  activities: PlanActivity[]
}): PlanTransaction {
  return {
    planId: PLAN_ID,
    createdAtMillis: CREATED_AT_MILLIS,
    lastUserActionAtMillis: LAST_USER_ACTION_AT_MILLIS,
    status: PlanStatus.COMPLETED,
    swapper: SWAPPER,
    assetsIn,
    assetsOut,
    activities,
    earnMetadata:
      earnAction === undefined
        ? undefined
        : {
            action: earnAction,
            vault: VAULT_ADDRESS,
            chainId: UniverseChainId.Mainnet,
          },
  } as PlanTransaction
}

describe(extractPlanDetails, () => {
  it('maps DAPI Earn deposit metadata and vault deposit steps', () => {
    const details = extractPlanDetails(
      planTransaction({
        earnAction: EarnPlanAction.DEPOSIT,
        assetsIn: [tokenAmount(DAI.address, '1000000')],
        assetsOut: [tokenAmount(VAULT_ADDRESS, '999000')],
        activities: [
          planActivity({
            swapType: SwapType.VAULT_DEPOSIT,
            tokenInAddress: DAI.address,
            tokenOutAddress: VAULT_ADDRESS,
            tokenInAmount: '1000000',
            tokenOutAmount: '999000',
          }),
        ],
      }),
    )

    expect(details?.typeInfo.earnAction).toBe(EarnAction.DEPOSIT)
    expect(details?.typeInfo.stepDetails[0]?.typeInfo).toEqual({
      type: TransactionType.Deposit,
      assetType: AssetType.Currency,
      tokenAddress: DAI.address,
      currencyAmountRaw: '1000000',
      isVault: true,
      vaultAddress: VAULT_ADDRESS,
    })
  })

  it('maps DAPI Earn withdraw metadata and vault withdraw steps', () => {
    const details = extractPlanDetails(
      planTransaction({
        earnAction: EarnPlanAction.WITHDRAW,
        assetsIn: [tokenAmount(VAULT_ADDRESS, '999000')],
        assetsOut: [tokenAmount(DAI.address, '1000000')],
        activities: [
          planActivity({
            swapType: SwapType.VAULT_WITHDRAW,
            tokenInAddress: VAULT_ADDRESS,
            tokenOutAddress: DAI.address,
            tokenInAmount: '999000',
            tokenOutAmount: '1000000',
          }),
        ],
      }),
    )

    expect(details?.typeInfo.earnAction).toBe(EarnAction.WITHDRAW)
    expect(details?.typeInfo.stepDetails[0]?.typeInfo).toEqual({
      type: TransactionType.Withdraw,
      assetType: AssetType.Currency,
      tokenAddress: DAI.address,
      currencyAmountRaw: '1000000',
      isVault: true,
      vaultAddress: VAULT_ADDRESS,
    })
  })

  it('leaves non-Earn plan metadata unset', () => {
    const details = extractPlanDetails(
      planTransaction({
        earnAction: EarnPlanAction.UNKNOWN,
        assetsIn: [tokenAmount(DAI.address, '1000000')],
        assetsOut: [tokenAmount(VAULT_ADDRESS, '999000')],
        activities: [],
      }),
    )

    expect(details?.typeInfo.earnAction).toBeUndefined()
  })
})
