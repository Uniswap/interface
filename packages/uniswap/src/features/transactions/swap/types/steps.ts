import { TypedDataDomain, TypedDataField } from "@ethersproject/abstract-signer"
import { Currency, CurrencyAmount, Token } from "@uniswap/sdk-core"
import { DutchQuoteV2, DutchQuoteV3, PriorityQuote } from "uniswap/src/data/tradingApi/__generated__"
import { ValidatedTransactionRequest } from "uniswap/src/features/transactions/swap/utils/trade"




export enum TransactionStepType {
  TokenApprovalTransaction = 'TokenApproval',
  TokenRevocationTransaction = 'TokenRevocation',
  SwapTransaction = 'SwapTransaction',
  WrapTransaction = 'WrapTransaction',
  SwapTransactionAsync = 'SwapTransactionAsync',
  Permit2Signature = 'Permit2Signature',
  UniswapXSignature = 'UniswapXSignature',
  IncreasePositionTransaction = 'IncreasePositionTransaction',
  IncreasePositionTransactionAsync = 'IncreasePositionTransactionAsync',
  DecreasePositionTransaction = 'DecreasePositionTransaction',
  MigratePositionTransactionStep = 'MigratePositionTransaction',
  MigratePositionTransactionStepAsync = 'MigratePositionTransactionAsync',
  CollectFeesTransactionStep = 'CollectFeesTransaction',
}

export type UniswapXSwapSteps =
  | WrapTransactionStep
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | UniswapXSignatureStep

export type ClassicSwapSteps =
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | Permit2SignatureStep
  | SwapTransactionStep
  | SwapTransactionStepAsync

  export type IncreasePositionSteps =
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | Permit2SignatureStep
  | IncreasePositionTransactionStep
  | IncreasePositionTransactionStepAsync

export type DecreasePositionSteps = TokenApprovalTransactionStep | DecreasePositionTransactionStep

export type MigratePositionSteps = Permit2SignatureStep | MigratePositionTransactionStep | MigratePositionTransactionStepAsync

export type CollectFeesSteps = CollectFeesTransactionStep

// TODO: add v4 lp flow
export type TransactionStep = ClassicSwapSteps | UniswapXSwapSteps | IncreasePositionSteps | DecreasePositionSteps | MigratePositionSteps | CollectFeesSteps
export type OnChainTransactionStep = TransactionStep & OnChainTransactionFields
export type SignatureTransactionStep = TransactionStep & SignTypedDataStepFields

interface SignTypedDataStepFields {
  domain: TypedDataDomain
  types: Record<string, TypedDataField[]>
  values: Record<string, unknown>
}

interface OnChainTransactionFields {
  txRequest: ValidatedTransactionRequest
}

export interface WrapTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.WrapTransaction
  amount: CurrencyAmount<Currency>
}

export interface TokenApprovalTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.TokenApprovalTransaction
  token: Token
  spender: string
  pair?: [Currency, Currency]
  // TODO(WEB-5083): this is used to distinguish a revoke from an approve. It can likely be replaced by a boolean because for LP stuff the amount isn't straight forward.
  amount: string
}

export interface TokenRevocationTransactionStep extends Omit<TokenApprovalTransactionStep, 'type'> {
  type: TransactionStepType.TokenRevocationTransaction
  amount: '0'
}

// Classic Swap
export interface Permit2SignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.Permit2Signature
  token: Currency // Check if this needs to handle multiple tokens for LPing
}
export interface SwapTransactionStep extends OnChainTransactionFields {
  // Swaps that don't require permit
  type: TransactionStepType.SwapTransaction
}
export interface SwapTransactionStepAsync {
  // Swaps that require permit
  type: TransactionStepType.SwapTransactionAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined> // fetches tx request from trading api with signature
}

export interface IncreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.IncreasePositionTransaction
}

export interface IncreasePositionTransactionStepAsync {
  // Requires permit
  type: TransactionStepType.IncreasePositionTransactionAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined> // fetches tx request from trading api with signature
}

export interface DecreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.DecreasePositionTransaction
}

export interface MigratePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.MigratePositionTransactionStep
}

export interface MigratePositionTransactionStepAsync {
  // Requires permit
  type: TransactionStepType.MigratePositionTransactionStepAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined> // fetches tx request from trading api with signature
}

export interface CollectFeesTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.CollectFeesTransactionStep
}

export type ClassicSwapFlow =
  | {
      revocation?: TokenRevocationTransactionStep
      approval?: TokenApprovalTransactionStep
      permit: undefined
      swap: SwapTransactionStep
    }
  | {
      revocation?: TokenRevocationTransactionStep
      approval?: TokenApprovalTransactionStep
      permit: Permit2SignatureStep
      swap: SwapTransactionStepAsync
    }

export type IncreasePositionFlow =
  | {
      wrap?: WrapTransactionStep
      approvalToken0?: TokenApprovalTransactionStep
      approvalToken1?: TokenApprovalTransactionStep
      approvalPositionToken?: TokenApprovalTransactionStep
      revokeToken0?: TokenRevocationTransactionStep
      revokeToken1?: TokenRevocationTransactionStep
      permit: undefined
      increasePosition: IncreasePositionTransactionStep
    }
  | {
      wrap?: WrapTransactionStep
      approvalToken0?: TokenApprovalTransactionStep
      approvalToken1?: TokenApprovalTransactionStep
      approvalPositionToken?: TokenApprovalTransactionStep
      revokeToken0?: TokenRevocationTransactionStep
      revokeToken1?: TokenRevocationTransactionStep
      permit: Permit2SignatureStep
      increasePosition: IncreasePositionTransactionStepAsync
    }

export type MigratePositionFlow = 
  | { permit: undefined, migrate: MigratePositionTransactionStep} 
  | { permit: Permit2SignatureStep, migrate: MigratePositionTransactionStepAsync }

export type DecreasePositionFlow = {
  approvalPositionToken?: TokenApprovalTransactionStep
  decreasePosition: DecreasePositionTransactionStep
}

// UniswapX
export interface UniswapXSignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.UniswapXSignature
  deadline: number
  quote: DutchQuoteV2 | DutchQuoteV3 | PriorityQuote
}

export type UniswapXSwapFlow = {
  wrap?: WrapTransactionStep
  revocation?: TokenRevocationTransactionStep
  approval?: TokenApprovalTransactionStep
  signOrder: UniswapXSignatureStep
}
