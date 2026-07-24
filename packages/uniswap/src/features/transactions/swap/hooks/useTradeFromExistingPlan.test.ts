import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { transformPlanResponseToChainedQuote } from 'uniswap/src/features/transactions/swap/hooks/useTradeFromExistingPlan'
import { type ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { createChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'

const USDC = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'
const SWAPPER = '0x23f989AE5121c3cCD72416Ca66386Bb06Ba2f50A'

describe('transformPlanResponseToChainedQuote', () => {
  it('preserves Earn quote requestedAssets from the plan response', () => {
    const requestedAssets = '2000000'
    const validatedInput: ValidatedTradeInput = {
      currencyIn: USDC,
      currencyOut: USDC,
      amount: CurrencyAmount.fromRawAmount(USDC, requestedAssets),
      requestTradeType: TradingApi.TradeType.EXACT_OUTPUT,
      tokenInChainId: TradingApi.ChainId._1,
      tokenOutChainId: TradingApi.ChainId._1,
      tokenInAddress: USDC.address,
      tokenOutAddress: VAULT_ADDRESS,
      activeAccountAddress: SWAPPER,
      earnIntent: {
        action: TradingApi.EarnAction.DEPOSIT,
        vault: VAULT_ADDRESS,
        chainId: TradingApi.ChainId._1,
      },
    }

    const result = transformPlanResponseToChainedQuote({
      validatedInput,
      slippageTolerance: 2.5,
      planResponse: {
        requestId: 'request-id',
        planId: 'plan-id',
        swapper: SWAPPER,
        recipient: SWAPPER,
        quoteId: 'quote-id',
        status: TradingApi.PlanStatus.IN_PROGRESS,
        currentStepIndex: 0,
        expectedOutput: '2800994864966439066',
        steps: [],
        earnIntent: {
          action: TradingApi.EarnAction.DEPOSIT,
          vault: VAULT_ADDRESS,
          chainId: TradingApi.ChainId._1,
          underlyingAsset: USDC.address,
          requestedAssets,
        },
      },
    })

    expect(result.quote.earnIntent?.requestedAssets).toBe(requestedAssets)
  })

  it('hydrates ChainedActionTrade earnIntent from an adapted plan quote when resume params do not include it', () => {
    const earnIntent: TradingApi.EarnQuoteIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: VAULT_ADDRESS,
      chainId: TradingApi.ChainId._1,
      underlyingAsset: USDC.address,
    }
    const validatedInput: ValidatedTradeInput = {
      currencyIn: USDC,
      currencyOut: USDC,
      amount: CurrencyAmount.fromRawAmount(USDC, '2000000'),
      requestTradeType: TradingApi.TradeType.EXACT_INPUT,
      tokenInChainId: TradingApi.ChainId._1,
      tokenOutChainId: TradingApi.ChainId._1,
      tokenInAddress: USDC.address,
      tokenOutAddress: VAULT_ADDRESS,
      activeAccountAddress: SWAPPER,
    }
    const quote = transformPlanResponseToChainedQuote({
      validatedInput,
      slippageTolerance: 2.5,
      planResponse: {
        requestId: 'request-id',
        planId: 'plan-id',
        swapper: SWAPPER,
        recipient: SWAPPER,
        quoteId: 'quote-id',
        status: TradingApi.PlanStatus.IN_PROGRESS,
        currentStepIndex: 0,
        expectedOutput: '2000000',
        steps: [],
        earnIntent: {
          ...earnIntent,
          // Deposit trades need a displayable underlying amount — without a preview (from the
          // intent or a VAULT_DEPOSIT step) trade creation intentionally fails.
          preview: {
            type: TradingApi.EarnDepositPreview.type.DEPOSIT,
            depositAssets: [{ token: USDC.address, chainId: TradingApi.ChainId._1, amount: '2000000' }],
            estimatedSharesOut: '2000000',
          },
        },
      },
    })

    const trade = createChainedActionTrade({
      quote,
      currencyIn: validatedInput.currencyIn,
      currencyOut: validatedInput.currencyOut,
    })

    if (!trade) {
      throw new Error('Expected chained action trade to be created')
    }

    expect(trade.earnIntent).toMatchObject(earnIntent)
  })
})
