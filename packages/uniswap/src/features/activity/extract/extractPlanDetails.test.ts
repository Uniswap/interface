import {
  EarnPlanAction,
  MarginPlanAction,
  PlanStatus,
  PlanStepStatus,
  SwapType,
} from '@uniswap/client-data-api/dist/data/v1/plan_pb'
import type { PlanActivity, PlanTransaction, TokenAmount } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'
import { EarnAction } from '@universe/api/src/clients/trading/__generated__/models/EarnAction'
import { UniverseChainId } from '@universe/chains'
import { DAI } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import extractPlanDetails from 'uniswap/src/features/activity/extract/extractPlanDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures'

// The DAPI `SwapType` enum has no MARGIN_* members yet (indexer migration is separate work) —
// stub the DAPI→TAPI mapper so SwapType.UNKNOWN simulates a future margin activity reaching this
// extractor, while every other SwapType keeps its real mapping (other tests rely on that).
vi.mock('uniswap/src/features/activity/extract/statusMappers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/activity/extract/statusMappers')>()
  return {
    ...actual,
    mapDAPIPlanActivitySwapTypeToTAPIPlanStepType: (
      swapType: Parameters<typeof actual.mapDAPIPlanActivitySwapTypeToTAPIPlanStepType>[0],
    ): TradingApi.PlanStepType | undefined =>
      swapType === SwapType.UNKNOWN
        ? TradingApi.PlanStepType.MARGIN_OPEN
        : actual.mapDAPIPlanActivitySwapTypeToTAPIPlanStepType(swapType),
  }
})

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

  it('does not throw on an activity that maps to a MARGIN_* step type and routes it to CHAINED', () => {
    const details = extractPlanDetails(
      planTransaction({
        assetsIn: [tokenAmount(DAI.address, '1000000')],
        assetsOut: [tokenAmount(VAULT_ADDRESS, '999000')],
        activities: [
          planActivity({
            swapType: SwapType.UNKNOWN, // stubbed above to resolve to MARGIN_OPEN
            tokenInAddress: DAI.address,
            tokenOutAddress: VAULT_ADDRESS,
            tokenInAmount: '1000000',
            tokenOutAmount: '999000',
          }),
        ],
      }),
    )

    expect(details?.typeInfo.stepDetails[0]?.routing).toBe(TradingApi.Routing.CHAINED)
  })

  it.each([
    ['keys margin tokens to the out chain on a bridge-funded plan', VAULT_ADDRESS, `1-${VAULT_ADDRESS}`],
    ['leaves marginAction unset when a margin token is empty', '', undefined],
  ])('%s', (_, debtToken, expectedDebtCurrencyId) => {
    const bridgedIn = {
      ...tokenAmount(DAI.address, '1'),
      token: { address: DAI.address, chainId: UniverseChainId.Base },
    }
    const details = extractPlanDetails({
      ...planTransaction({
        assetsIn: [bridgedIn as TokenAmount],
        assetsOut: [tokenAmount(DAI.address, '1')],
        activities: [],
      }),
      marginMetadata: { action: MarginPlanAction.OPEN, collateralToken: DAI.address, debtToken },
    } as PlanTransaction)

    expect(details?.typeInfo.marginAction?.debtCurrencyId).toBe(expectedDebtCurrencyId)
  })
})
