import { TradingApi } from '@universe/api'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  getEarnPlanDisplayInfo,
  getEarnPlanVaultStep,
} from 'uniswap/src/features/activity/utils/getEarnPlanDisplayInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  type PlanTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const ADDRESS = '0x0000000000000000000000000000000000000001'
const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const VAULT = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'

function createPlanTypeInfo(overrides: Partial<PlanTransactionInfo> = {}): PlanTransactionInfo {
  return {
    type: TransactionType.Plan,
    planId: 'plan-id',
    planStatus: TradingApi.PlanStatus.COMPLETED,
    stepDetails: [],
    tokenOutChainId: UniverseChainId.Base,
    inputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, VAULT),
    outputCurrencyId: buildCurrencyId(UniverseChainId.Base, USDC_BASE),
    inputCurrencyAmountRaw: '1000000000000000000',
    outputCurrencyAmountRaw: '1000000',
    tradeType: 0,
    transactionHashes: [],
    ...overrides,
  }
}

function createVaultStep(
  type: TransactionType.Deposit | TransactionType.Withdraw,
  overrides: Partial<TransactionDetails> = {},
): TransactionDetails {
  return {
    id: 'vault-step',
    chainId: UniverseChainId.Mainnet,
    routing: TradingApi.Routing.CHAINED,
    from: ADDRESS,
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: {
      type,
      assetType: AssetType.Currency,
      tokenAddress: USDC_MAINNET,
      currencyAmountRaw: '1000000',
      isVault: true,
      vaultAddress: VAULT,
    },
    status: TransactionStatus.Success,
    addedTime: 1,
    updatedTime: 1,
    options: { request: {} },
    ...overrides,
  }
}

describe(getEarnPlanDisplayInfo, () => {
  it('falls back to the plan input amount for Earn deposits without vault step details', () => {
    const typeInfo = createPlanTypeInfo({
      earnAction: TradingApi.EarnAction.DEPOSIT,
      inputCurrencyId: buildCurrencyId(UniverseChainId.Base, USDC_BASE),
      outputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, VAULT),
      inputCurrencyAmountRaw: '2000000',
      outputCurrencyAmountRaw: '1800000000000000000',
    })

    expect(getEarnPlanDisplayInfo(typeInfo)).toEqual({
      amountRaw: '2000000',
      currencyId: buildCurrencyId(UniverseChainId.Base, USDC_BASE),
      transactionType: TransactionType.Deposit,
    })
  })

  it('displays the vault-step underlying amount for swap-then-deposit Earn plans', () => {
    const typeInfo = createPlanTypeInfo({
      earnAction: TradingApi.EarnAction.DEPOSIT,
      inputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, ADDRESS),
      outputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, VAULT),
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '1800000000000000000',
      stepDetails: [createVaultStep(TransactionType.Deposit)],
    })

    expect(getEarnPlanDisplayInfo(typeInfo)).toEqual({
      amountRaw: '1000000',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET),
      transactionType: TransactionType.Deposit,
    })
  })

  it('displays the destination underlying amount for Earn withdraws', () => {
    const typeInfo = createPlanTypeInfo({
      earnAction: TradingApi.EarnAction.WITHDRAW,
      stepDetails: [createVaultStep(TransactionType.Withdraw)],
    })

    expect(getEarnPlanDisplayInfo(typeInfo)).toEqual({
      amountRaw: '1000000',
      currencyId: buildCurrencyId(UniverseChainId.Base, USDC_BASE),
      transactionType: TransactionType.Withdraw,
    })
  })

  it('returns the vault step used by details rows', () => {
    const vaultStep = createVaultStep(TransactionType.Withdraw)
    const typeInfo = createPlanTypeInfo({
      earnAction: TradingApi.EarnAction.WITHDRAW,
      stepDetails: [vaultStep],
    })

    expect(getEarnPlanVaultStep(typeInfo)).toBe(vaultStep)
  })
})
