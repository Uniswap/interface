import { TradingApi } from '@universe/api'
import { DAI } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { createTransactionDetails } from 'uniswap/src/features/activity/extract/extractPlanUtils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures'

const PLAN_ID = 'plan-id'
const VAULT_ADDRESS = SAMPLE_SEED_ADDRESS_2
const SWAPPER = SAMPLE_SEED_ADDRESS_1

describe('createTransactionDetails', () => {
  it('maps vault deposit plan steps to vault deposit transaction details', () => {
    const details = createTransactionDetails({
      routing: TradingApi.Routing.CHAINED,
      planStepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
      planId: PLAN_ID,
      status: TransactionStatus.AwaitingAction,
      tokenInChainId: UniverseChainId.Mainnet,
      tokenInAddress: DAI.address,
      tokenOutChainId: UniverseChainId.Mainnet,
      tokenOutAddress: VAULT_ADDRESS,
      inputCurrencyAmountRaw: '1000000',
      outputCurrencyAmountRaw: '999000',
      addedTime: 1,
      from: SWAPPER,
      hash: '0xdeposit',
    })

    expect(details?.typeInfo).toEqual({
      type: TransactionType.Deposit,
      assetType: AssetType.Currency,
      tokenAddress: DAI.address,
      currencyAmountRaw: '1000000',
      isVault: true,
      vaultAddress: VAULT_ADDRESS,
    })
  })

  it('maps vault withdraw plan steps to vault withdraw transaction details', () => {
    const details = createTransactionDetails({
      routing: TradingApi.Routing.CHAINED,
      planStepType: TradingApi.PlanStepType.VAULT_WITHDRAW,
      planId: PLAN_ID,
      status: TransactionStatus.AwaitingAction,
      tokenInChainId: UniverseChainId.Mainnet,
      tokenInAddress: VAULT_ADDRESS,
      tokenOutChainId: UniverseChainId.Mainnet,
      tokenOutAddress: DAI.address,
      inputCurrencyAmountRaw: '999000',
      outputCurrencyAmountRaw: '1000000',
      addedTime: 1,
      from: SWAPPER,
      hash: '0xwithdraw',
    })

    expect(details?.typeInfo).toEqual({
      type: TransactionType.Withdraw,
      assetType: AssetType.Currency,
      tokenAddress: DAI.address,
      currencyAmountRaw: '1000000',
      isVault: true,
      vaultAddress: VAULT_ADDRESS,
    })
  })
})
