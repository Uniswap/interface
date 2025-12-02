import { MaxUint256, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import { USDC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import {
  ValidatedSwapTxContext,
  ValidatedUniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { BridgeTrade, ClassicTrade, UniswapXTrade, WrapTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionOriginType, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ETH, WETH } from 'uniswap/src/test/fixtures'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import { createFixture } from 'uniswap/src/test/utils'
import { TransactionService } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { SwapParams } from 'wallet/src/features/transactions/swap/executeSwapSaga'
import { PrepareAndSignSwapSagaParams } from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'
import { TransactionExecutor } from 'wallet/src/features/transactions/swap/services/transactionExecutor'
import {
  SwapTransactionData,
  TransactionParamsFactory,
  UniswapXOrderTransactionData,
} from 'wallet/src/features/transactions/swap/services/transactionParamsFactory'
import {
  PreSignedSwapTransaction,
  UniswapXPreSignedSwapTransaction,
} from 'wallet/src/features/transactions/swap/types/preSignedTransaction'
import { TransactionSagaDependencies } from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

export const mockTransactionService: jest.Mocked<TransactionService> = {
  getNextNonce: jest.fn(),
  prepareAndSignTransaction: jest.fn(),
  submitTransaction: jest.fn(),
  submitTransactionSync: jest.fn(),
  executeTransaction: jest.fn(),
}

export const mockTransactionSigner: jest.Mocked<TransactionSigner> = {
  signTypedData: jest.fn(),
  signTransaction: jest.fn(),
  prepareTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  sendTransactionSync: jest.fn(),
}

export const mockTransactionExecutor: jest.Mocked<TransactionExecutor> = {
  executeStep: jest.fn(),
  executeStepSync: jest.fn(),
  executeSteps: jest.fn(),
}

export const mockTransactionParamsFactory: jest.Mocked<TransactionParamsFactory> = {
  createApprovalParams: jest.fn().mockReturnValue({
    typeInfo: { type: TransactionType.Approve },
  }),
  createPermitParams: jest.fn().mockReturnValue({
    typeInfo: { type: TransactionType.Permit2Approve },
  }),
  createSwapParams: jest.fn().mockImplementation((data: SwapTransactionData) => ({
    typeInfo: {
      type:
        data.swapTxContext.trade.routing === TradingApi.Routing.BRIDGE ? TransactionType.Bridge : TransactionType.Swap,
    },
  })),
  createWrapParams: jest.fn().mockReturnValue({
    typeInfo: { type: TransactionType.Wrap },
  }),
  createUniswapXOrderParams: jest.fn().mockImplementation((data: UniswapXOrderTransactionData) => ({
    permit: data.signedPermit,
    quote: data.quote,
    routing: data.routing,
    typeInfo: { type: TransactionType.Swap },
    txId: data.txId,
    approveTxHash: data.approveTxHash,
    onSuccess: data.onSuccess,
    onFailure: data.onFailure,
  })),
}

export const mockTransactionSagaDependencies: jest.Mocked<TransactionSagaDependencies> = {
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    setDatadogEnabled: jest.fn(),
  },
  createProviderService: jest.fn(),
  createTransactionConfigService: jest.fn(),
  createTransactionSignerService: jest.fn(),
  createBundledDelegationTransactionSignerService: jest.fn(),
  createTransactionService: jest.fn(),
  createAnalyticsService: jest.fn(),
  createTransactionRepository: jest.fn(),
  createFeatureFlagService: jest.fn(),
  createTransactionExecutor: jest.fn().mockReturnValue(mockTransactionExecutor),
  createTransactionParamsFactory: jest.fn().mockReturnValue(mockTransactionParamsFactory),
  getViemClients: jest.fn(),
  getDelegationInfoForTransaction: jest.fn(),
  sendAnalyticsEvent: jest.fn(),
  transactionActions,
  makeSelectAddressTransactions: jest.fn(),
  runSagaEffect: jest.fn(),
}

export const mockClassicTrade: ClassicTrade = {
  routing: TradingApi.Routing.CLASSIC,
  inputAmount: { currency: ETH },
  outputAmount: { currency: USDC },
  quote: { amount: MaxUint256 },
  slippageTolerance: 0.5,
} as unknown as ClassicTrade

export const mockUniswapXTrade: UniswapXTrade = {
  routing: TradingApi.Routing.DUTCH_V2,
  inputAmount: { currency: ETH, quotient: JSBI.BigInt(1000) },
  outputAmount: { currency: USDC },
  quote: { amount: MaxUint256, routing: TradingApi.Routing.DUTCH_V2 },
  slippageTolerance: 0.5,
} as unknown as UniswapXTrade

export const mockWrapTrade: WrapTrade = {
  routing: TradingApi.Routing.WRAP,
  inputAmount: { currency: ETH },
  outputAmount: { currency: WETH },
  tradeType: TradeType.EXACT_INPUT,
} as unknown as WrapTrade

export const mockBridgeTrade: BridgeTrade = {
  routing: TradingApi.Routing.BRIDGE,
  inputAmount: { currency: ETH },
  outputAmount: { currency: USDC },
  quote: { amount: MaxUint256 },
  slippageTolerance: 0.5,
} as unknown as BridgeTrade

export const mockSwapTxRequest = {
  chainId: UniverseChainId.Mainnet,
  to: '0xSwapAddress',
  data: '0x0',
  value: '1000000000000000000',
  gasLimit: '200000',
  gasPrice: '20000000000',
}

const mockSignedTransactionRequest: SignedTransactionRequest = {
  request: {
    ...mockSwapTxRequest,
    nonce: 1,
    gasLimit: BigNumber.from('200000'),
    gasPrice: BigNumber.from('20000000000'),
    value: BigNumber.from('1000000000000000000'),
  },
  signedRequest: '0xsignedTxData',
  timestampBeforeSign: 1487076708000,
}

/**
 * Helper function to create a mockSignedApproveTx with consistent structure and timestamp.
 */
export const createMockSignedApproveTx = (overrides?: Partial<SignedTransactionRequest>): SignedTransactionRequest => ({
  request: {
    nonce: 1,
    to: '0xtoken',
    chainId: UniverseChainId.Mainnet,
    data: '0x',
    value: '0',
    gasLimit: '21000',
    gasPrice: '20000000000',
    ...overrides?.request,
  },
  signedRequest: '0xsignedapproval',
  timestampBeforeSign: 1487076708000,
  ...overrides,
})

export const mockSignerAccount = signerMnemonicAccount()

export const mockAnalytics: SwapTradeBaseProperties = {
  transactionOriginType: TransactionOriginType.Internal,
  token_in_amount_usd: 1000,
  token_out_amount_usd: 950,
  token_in_address: '0xETH',
  token_out_address: '0xUSDC',
  token_in_symbol: 'ETH',
  token_out_symbol: 'USDC',
  estimated_network_fee_usd: '5',
  chain_id: UniverseChainId.Mainnet,
}

export const prepareSwapTxContext = createFixture<ValidatedSwapTxContext>()(() => ({
  routing: TradingApi.Routing.CLASSIC,
  trade: mockClassicTrade,
  txRequests: [mockSwapTxRequest],
  approveTxRequest: undefined,
  permit: undefined,
  gasFee: { value: '5', isLoading: false, error: null },
  gasFeeEstimation: {},
  swapRequestArgs: { quote: mockClassicTrade.quote.quote },
  revocationTxRequest: undefined,
  includesDelegation: false,
  unsigned: false,
}))

export const prepareUniswapXSwapTxContext = createFixture<ValidatedUniswapXSwapTxAndGasInfo>()(() => ({
  ...prepareSwapTxContext(),
  routing: TradingApi.Routing.DUTCH_V2,
  trade: mockUniswapXTrade,
  quote: mockUniswapXTrade.quote,
  gasFeeBreakdown: {
    classicGasUseEstimateUSD: '5',
    approvalCost: '5',
    inputTokenSymbol: 'ETH',
  },
  permit: mockPermit,
}))

export const prepareAndSignSwapSagaParams = createFixture<PrepareAndSignSwapSagaParams>()(() => ({
  swapTxContext: prepareSwapTxContext(),
  account: mockSignerAccount,
  onSuccess: undefined,
  onFailure: undefined,
}))

/**
 * Factory function for creating PreSignedSwapTransaction with sensible defaults.
 */
export const preparePreSignedSwapTransaction = createFixture<PreSignedSwapTransaction>()(() => ({
  signedSwapTx: mockSignedTransactionRequest,
  signedApproveTx: undefined,
  signedPermitTx: undefined,
  swapTxContext: prepareSwapTxContext(),
  chainId: UniverseChainId.Mainnet,
  account: mockSignerAccount,
  metadata: {
    submitViaPrivateRpc: false,
    timestampBeforeSign: Date.now(),
    timestampAfterSign: Date.now(),
  },
}))

export const prepareUniswapXPreSignedSwapTransaction = createFixture<UniswapXPreSignedSwapTransaction>()(() => ({
  signedSwapPermit: {
    permit: mockPermit.typedData,
    signedData: '0xsignedPermit',
  },
  swapTxContext: prepareUniswapXSwapTxContext(),
  chainId: UniverseChainId.Mainnet,
  account: mockSignerAccount,
  metadata: {
    submitViaPrivateRpc: false,
    timestampBeforeSign: Date.now(),
    timestampAfterSign: Date.now(),
  },
}))

/**
 * Factory function for creating SwapParams with sensible defaults.
 */
export const prepareExecuteSwapSagaParams = createFixture<SwapParams>()(() => ({
  txId: 'test-tx-id',
  account: mockSignerAccount,
  analytics: mockAnalytics,
  swapTxContext: prepareSwapTxContext(),
  onSuccess: jest.fn(),
  onFailure: jest.fn(),
  onPending: jest.fn(),
  preSignedTransaction: preparePreSignedSwapTransaction(),
}))
