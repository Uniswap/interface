import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import {
  NFTTradeType,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type {
  PlanTransactionDetails,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyIdWithThrow,
} from 'uniswap/src/utils/currencyId'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'

const ADDRESS = '0x0000000000000000000000000000000000000001'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

function createEarnPlanTransaction({
  earnAction,
  status = TransactionStatus.AwaitingAction,
  id = `plan-${earnAction}-${status}`,
  inputCurrencyAmountRaw = '1000000',
  outputCurrencyAmountRaw = '900000',
  planStatus,
  updatedTime = 1,
}: {
  earnAction: TradingApi.EarnAction
  id?: string
  inputCurrencyAmountRaw?: string
  outputCurrencyAmountRaw?: string
  planStatus?: TradingApi.PlanStatus
  status?: TransactionStatus
  updatedTime?: number
}): PlanTransactionDetails {
  const currencyId = buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS)

  return {
    routing: TradingApi.Routing.CHAINED,
    id,
    chainId: UniverseChainId.Mainnet,
    status,
    addedTime: 1,
    updatedTime,
    from: ADDRESS,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo: {
      type: TransactionType.Plan,
      planId: id,
      planStatus:
        planStatus ??
        (status === TransactionStatus.Success
          ? TradingApi.PlanStatus.COMPLETED
          : TradingApi.PlanStatus.AWAITING_ACTION),
      stepDetails: [],
      tokenOutChainId: UniverseChainId.Mainnet,
      inputCurrencyId: currencyId,
      outputCurrencyId: currencyId,
      inputCurrencyAmountRaw,
      outputCurrencyAmountRaw,
      tradeType: 0,
      earnAction,
      transactionHashes: [],
    },
  }
}

function createLpIncentivesClaim({
  id,
  tokenAddresses,
}: {
  id: string
  tokenAddresses?: string[]
}): TransactionDetails {
  return {
    routing: TradingApi.Routing.CLASSIC,
    id,
    chainId: UniverseChainId.Mainnet,
    status: TransactionStatus.Success,
    addedTime: 1,
    updatedTime: 1,
    from: ADDRESS,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo: {
      type: TransactionType.LPIncentivesClaimRewards,
      // Cast so the pre-rename shape (no tokenAddresses) can be exercised.
      tokenAddresses,
    } as TransactionDetails['typeInfo'],
  } as TransactionDetails
}

describe('buildActivityRowFragments', () => {
  describe('margin plans', () => {
    const UNI = buildCurrencyId(UniverseChainId.Mainnet, UNI_ADDRESS)
    const USDC = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const WETH = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet)
    const ETH = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const marginAction = { action: 'open' as const, collateralCurrencyId: WETH, debtCurrencyId: USDC }

    function buildMarginPlanFragments(amounts: { input: string; output: string }) {
      const plan = createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        status: TransactionStatus.Success,
        id: `margin-${amounts.input}`,
      })
      return buildActivityRowFragments({
        ...plan,
        typeInfo: {
          ...plan.typeInfo,
          earnAction: undefined,
          marginAction,
          inputCurrencyId: UNI,
          outputCurrencyId: WETH,
          inputCurrencyAmountRaw: amounts.input,
          outputCurrencyAmountRaw: amounts.output,
        },
      })
    }

    it('shows what the plan paid and the margin it deposited, wrapped native as native', () => {
      const fragments = buildMarginPlanFragments({ input: '54900000000000000', output: '171000000000000' })

      expect(fragments.amount).toEqual({
        kind: 'pair',
        inputCurrencyId: UNI,
        outputCurrencyId: ETH,
        inputAmountRaw: '54900000000000000',
        outputAmountRaw: '171000000000000',
      })
      expect(fragments.typeLabel).toEqual({ baseGroup: null, overrideLabelKey: 'transaction.status.margin.success' })
    })

    it('falls back to the market when the plan has no amounts', () => {
      const fragments = buildMarginPlanFragments({ input: '0', output: '0' })

      expect(fragments.amount).toEqual({ kind: 'multi-token', currencyIds: [ETH, USDC] })
    })
  })

  it('shows interrupted Earn deposit plans as deposit activity', () => {
    const fragments = buildActivityRowFragments(
      createEarnPlanTransaction({ earnAction: TradingApi.EarnAction.DEPOSIT }),
    )

    expect(fragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '1000000',
    })
    expect(fragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.deposit.interrupted',
    })
  })

  it('shows interrupted Earn withdraw plans as withdraw activity', () => {
    const fragments = buildActivityRowFragments(
      createEarnPlanTransaction({ earnAction: TradingApi.EarnAction.WITHDRAW }),
    )

    expect(fragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '900000',
    })
    expect(fragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Receives,
      overrideLabelKey: 'transaction.status.withdraw.interrupted',
    })
  })

  it('does not reuse cached Earn plan fragments after amount updates', () => {
    const id = 'plan-cache-key'
    const originalFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
      }),
    )
    const updatedFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
        inputCurrencyAmountRaw: '2000000',
      }),
    )

    expect(originalFragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '1000000',
    })
    expect(updatedFragments.amount).toEqual({
      kind: 'single',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      amountRaw: '2000000',
    })
  })

  it('maps NFT trades to nft amount fragments with buy/sell labels', () => {
    const createNftTrade = (tradeType: NFTTradeType): TransactionDetails => ({
      routing: TradingApi.Routing.CLASSIC,
      id: `nft-trade-${tradeType}`,
      chainId: UniverseChainId.Mainnet,
      status: TransactionStatus.Success,
      addedTime: 1,
      from: ADDRESS,
      transactionOriginType: TransactionOriginType.Internal,
      options: { request: {} },
      typeInfo: {
        type: TransactionType.NFTTrade,
        tradeType,
        nftSummaryInfo: {
          name: 'nft_name',
          collectionName: 'collection_name',
          imageURL: 'image_url',
          tokenId: 'token_id',
          address: '0x0000000000000000000000000000000000000002',
        },
        purchaseCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
        purchaseCurrencyAmountRaw: '1000000',
      },
    })

    const buyFragments = buildActivityRowFragments(createNftTrade(NFTTradeType.BUY))
    expect(buyFragments.amount).toEqual({
      kind: 'nft',
      nftImageUrl: 'image_url',
      nftName: 'nft_name',
      nftCollectionName: 'collection_name',
      purchaseCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
      purchaseAmountRaw: '1000000',
    })
    expect(buyFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Receives,
      overrideLabelKey: 'transaction.status.buy.success',
    })

    const sellFragments = buildActivityRowFragments(createNftTrade(NFTTradeType.SELL))
    expect(sellFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.sell.success',
    })
  })

  it('does not reuse cached Earn plan fragments after status updates', () => {
    const id = 'plan-cache-status'
    const planStatus = TradingApi.PlanStatus.AWAITING_ACTION
    const originalFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
        planStatus,
      }),
    )
    const updatedFragments = buildActivityRowFragments(
      createEarnPlanTransaction({
        earnAction: TradingApi.EarnAction.DEPOSIT,
        id,
        planStatus,
        status: TransactionStatus.Success,
      }),
    )

    expect(originalFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.deposit.interrupted',
    })
    expect(updatedFragments.typeLabel).toEqual({
      baseGroup: ActivityFilterType.Sends,
      overrideLabelKey: 'transaction.status.deposit.success',
    })
  })

  it('renders a single-token LP incentives claim as a one-currency multi-token row', () => {
    const fragments = buildActivityRowFragments(
      createLpIncentivesClaim({ id: 'lp-claim-single', tokenAddresses: [DAI_ADDRESS] }),
    )

    // Not a `single` row: that path renders the formatter's "-" placeholder for an amountless claim.
    expect(fragments.amount).toEqual({
      kind: 'multi-token',
      currencyIds: [buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS)],
    })
  })

  it('renders every token of a multi-token LP incentives claim', () => {
    const fragments = buildActivityRowFragments(
      createLpIncentivesClaim({ id: 'lp-claim-multi', tokenAddresses: [DAI_ADDRESS, UNI_ADDRESS] }),
    )

    expect(fragments.amount).toEqual({
      kind: 'multi-token',
      currencyIds: [
        buildCurrencyId(UniverseChainId.Mainnet, DAI_ADDRESS),
        buildCurrencyId(UniverseChainId.Mainnet, UNI_ADDRESS),
      ],
    })
  })

  it('renders no currencies for claims persisted before the tokenAddresses rename', () => {
    const fragments = buildActivityRowFragments(createLpIncentivesClaim({ id: 'lp-claim-legacy' }))

    expect(fragments.amount).toEqual({ kind: 'multi-token', currencyIds: [] })
  })
})
