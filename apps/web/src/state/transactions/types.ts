import { TransactionResponse } from '@ethersproject/abstract-provider'
import { TradeType } from '@uniswap/sdk-core'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export enum TransactionType {
  APPROVAL = 0,
  SWAP = 1,
  DEPOSIT_LIQUIDITY_STAKING = 2,
  WITHDRAW_LIQUIDITY_STAKING = 3,
  CLAIM = 4,
  VOTE = 5,
  DELEGATE = 6,
  WRAP = 7,
  CREATE_V3_POOL = 8,
  ADD_LIQUIDITY_V3_POOL = 9,
  ADD_LIQUIDITY_V2_POOL = 10,
  MIGRATE_LIQUIDITY_V2_TO_V3 = 11,
  COLLECT_FEES = 12,
  REMOVE_LIQUIDITY_V3 = 13,
  SUBMIT_PROPOSAL = 14,
  QUEUE = 15,
  EXECUTE = 16,
  BUY = 17,
  SEND = 18,
  RECEIVE = 19,
  MINT = 20,
  BURN = 21,
  BORROW = 22,
  REPAY = 23,
  DEPLOY = 24,
  CANCEL = 25,
  LIMIT = 26,
  INCREASE_LIQUIDITY = 27,
  DECREASE_LIQUIDITY = 28,
  BRIDGE = 29,
  CREATE_POSITION = 30,
  MIGRATE_LIQUIDITY_V3_TO_V4 = 31,
}
interface BaseTransactionInfo {
  type: TransactionType
}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.APPROVAL
  tokenAddress: string
  spender: string
  amount: string
}

interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.SWAP
  tradeType: TradeType
  inputCurrencyId: string
  outputCurrencyId: string
  isUniswapXOrder: boolean
}

export interface BridgeTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.BRIDGE
  inputCurrencyId: string
  inputChainId: UniverseChainId
  inputCurrencyAmountRaw: string
  outputCurrencyId: string
  outputChainId: UniverseChainId
  outputCurrencyAmountRaw: string
  quoteId?: string
  depositConfirmed: boolean
}

export interface ExactInputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_INPUT
  inputCurrencyAmountRaw: string
  expectedOutputCurrencyAmountRaw: string
  minimumOutputCurrencyAmountRaw: string
  settledOutputCurrencyAmountRaw?: string
}
export interface ExactOutputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_OUTPUT
  outputCurrencyAmountRaw: string
  expectedInputCurrencyAmountRaw: string
  maximumInputCurrencyAmountRaw: string
}

interface DepositLiquidityStakingTransactionInfo {
  type: TransactionType.DEPOSIT_LIQUIDITY_STAKING
  token0Address: string
  token1Address: string
}

interface WithdrawLiquidityStakingTransactionInfo {
  type: TransactionType.WITHDRAW_LIQUIDITY_STAKING
  token0Address: string
  token1Address: string
}

export interface WrapTransactionInfo {
  type: TransactionType.WRAP
  unwrapped: boolean
  currencyAmountRaw: string
  chainId?: number
}

interface ClaimTransactionInfo {
  type: TransactionType.CLAIM
  recipient: string
  uniAmountRaw?: string
}

export interface CreateV3PoolTransactionInfo {
  type: TransactionType.CREATE_V3_POOL
  baseCurrencyId: string
  quoteCurrencyId: string
}

export interface IncreaseLiquidityTransactionInfo {
  type: TransactionType.INCREASE_LIQUIDITY
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface DecreaseLiquidityTransactionInfo {
  type: TransactionType.DECREASE_LIQUIDITY
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface CreatePositionTransactionInfo {
  type: TransactionType.CREATE_POSITION
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface CollectFeesTransactionInfo {
  type: TransactionType.COLLECT_FEES
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface MigrateV3LiquidityToV4TransactionInfo {
  type: TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface AddLiquidityV3PoolTransactionInfo {
  type: TransactionType.ADD_LIQUIDITY_V3_POOL
  createPool: boolean
  baseCurrencyId: string
  quoteCurrencyId: string
  feeAmount: number
  expectedAmountBaseRaw: string
  expectedAmountQuoteRaw: string
}

export interface AddLiquidityV2PoolTransactionInfo {
  type: TransactionType.ADD_LIQUIDITY_V2_POOL
  baseCurrencyId: string
  quoteCurrencyId: string
  expectedAmountBaseRaw: string
  expectedAmountQuoteRaw: string
}

export interface MigrateV2LiquidityToV3TransactionInfo {
  type: TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3
  baseCurrencyId: string
  quoteCurrencyId: string
  isFork: boolean
}

export interface RemoveLiquidityV3TransactionInfo {
  type: TransactionType.REMOVE_LIQUIDITY_V3
  baseCurrencyId: string
  quoteCurrencyId: string
  expectedAmountBaseRaw: string
  expectedAmountQuoteRaw: string
}

interface SubmitProposalTransactionInfo {
  type: TransactionType.SUBMIT_PROPOSAL
}

export interface SendTransactionInfo {
  type: TransactionType.SEND
  currencyId: string
  amount: string
  recipient: string
}

export type TransactionInfo =
  | ApproveTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | ClaimTransactionInfo
  | DepositLiquidityStakingTransactionInfo
  | WithdrawLiquidityStakingTransactionInfo
  | WrapTransactionInfo
  | CreateV3PoolTransactionInfo
  | AddLiquidityV3PoolTransactionInfo
  | AddLiquidityV2PoolTransactionInfo
  | MigrateV2LiquidityToV3TransactionInfo
  | CollectFeesTransactionInfo
  | RemoveLiquidityV3TransactionInfo
  | SubmitProposalTransactionInfo
  | SendTransactionInfo
  | IncreaseLiquidityTransactionInfo
  | DecreaseLiquidityTransactionInfo
  | BridgeTransactionInfo
  | CreatePositionTransactionInfo
  | MigrateV3LiquidityToV4TransactionInfo

interface BaseTransactionDetails {
  status: TransactionStatus
  hash: string
  addedTime: number
  from: string
  info: TransactionInfo
  nonce?: number
  cancelled?: true
}

export interface PendingTransactionDetails extends BaseTransactionDetails {
  status: TransactionStatus.Pending
  lastCheckedBlockNumber?: number
  deadline?: number
}

export interface ConfirmedTransactionDetails extends BaseTransactionDetails {
  status: TransactionStatus.Confirmed | TransactionStatus.Failed
  confirmedTime: number
}

export type TransactionDetails = PendingTransactionDetails | ConfirmedTransactionDetails

export type VitalTxFields = Pick<TransactionResponse, 'hash' | 'nonce' | 'data'>
