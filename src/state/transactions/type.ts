import { ChainId } from '@kyberswap/ks-sdk-core'

export interface SerializableTransactionReceipt {
  blockHash: string
  status?: number
}

// ex: approve knc, stake 2 knc
export type TransactionExtraInfo1Token = {
  tokenAddress: string
  tokenSymbol: string
  tokenAmount?: string
  contract?: string // recipient, contract, spender, ...
}

// ex: swap 2knc to 2usdt
export type TransactionExtraInfo2Token = {
  tokenAddressIn: string
  tokenAddressOut: string
  tokenSymbolIn: string
  tokenSymbolOut: string
  tokenAmountIn: string
  tokenAmountOut: string

  contract?: string // recipient, contract, spender, ...
  chainIdIn?: ChainId
  chainIdOut?: ChainId
  nftId?: string
}

export type TransactionExtraInfoHarvestFarm = {
  tokenAddressIn?: string
  tokenAddressOut?: string
  tokenSymbolIn?: string
  tokenSymbolOut?: string
  rewards: { tokenAddress: string; tokenSymbol: string; tokenAmount: string }[]
  contract?: string // recipient, contract, spender, ...
}

export type TransactionExtraInfoStakeFarm = {
  pairs: {
    tokenAddressIn: string
    tokenAddressOut: string
    tokenSymbolIn: string
    tokenSymbolOut: string
    tokenAmountIn: string
    tokenAmountOut: string
    poolAddress: string
    nftId: string
  }[]
  contract?: string // recipient, contract, spender, ...
}

export type TransactionExtraBaseInfo = {
  summary?: string
  contract?: string // recipient, contract, spender, ...
}

// structure data, let's create a new type if your transaction does not match 1 of 3 template
export type TransactionExtraInfo = (
  | TransactionExtraInfo1Token
  | TransactionExtraInfo2Token
  | TransactionExtraBaseInfo
  | TransactionExtraInfoHarvestFarm
  | TransactionExtraInfoStakeFarm
) & {
  actuallySuccess?: boolean
  needCheckSubgraph?: boolean
  arbitrary?: any // To store anything arbitrary, so it has any type
}

export interface TransactionDetails {
  hash: string
  type: TRANSACTION_TYPE
  receipt?: SerializableTransactionReceipt
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string
  to?: string
  data?: string
  nonce?: number
  sentAtBlock?: number
  extraInfo?: TransactionExtraInfo
  group: TRANSACTION_GROUP
  chainId: ChainId
}

export interface GroupedTxsByHash {
  [firstTxHash: string]: TransactionDetails[] | undefined
}

export type TransactionHistory = {
  hash: string
  desiredChainId?: ChainId // ChainID after switching.
  type: TRANSACTION_TYPE
  firstTxHash?: string
  extraInfo?: TransactionExtraInfo
}

export type TransactionPayload = TransactionHistory & {
  from: string
  to?: string
  nonce?: number
  data?: string
  sentAtBlock?: number
  chainId: ChainId
}

/**
 * when you put a new type, let's do:
 * 1. classify it by putting it into GROUP_TRANSACTION_BY_TYPE
 * 2. add a case in SUMMARY in TransactionPopup.tsx to render notification detail by type
 * 3. add a case in RENDER_DESCRIPTION_MAP in TransactionItem.tsx to render transaction detail by type
 * if you forgot. typescript error will occur.
 */
export enum TRANSACTION_TYPE {
  WRAP_TOKEN = 'Wrap Token',
  UNWRAP_TOKEN = 'Unwrap Token',
  APPROVE = 'Approve',
  BRIDGE = 'Bridge Token',
  SWAP = 'Swap',

  CLASSIC_CREATE_POOL = 'Classic Create Pool',
  ELASTIC_CREATE_POOL = 'Elastic Create Pool',
  CLASSIC_ADD_LIQUIDITY = 'Classic Add Liquidity',
  ELASTIC_ADD_LIQUIDITY = 'Elastic Add Liquidity',
  CLASSIC_REMOVE_LIQUIDITY = 'Classic Remove Liquidity',
  ELASTIC_REMOVE_LIQUIDITY = 'Elastic Remove Liquidity',
  ELASTIC_INCREASE_LIQUIDITY = 'Elastic Increase Liquidity',
  ELASTIC_COLLECT_FEE = 'Elastic Collect Fee',

  STAKE = 'Stake Into Farm',
  UNSTAKE = 'Unstake From Farm',

  HARVEST = 'Harvest',
  CLAIM_REWARD = 'Claim Reward',
  ELASTIC_DEPOSIT_LIQUIDITY = 'Elastic Deposit Liquidity',
  ELASTIC_WITHDRAW_LIQUIDITY = 'Elastic Withdraw Liquidity',
  ELASTIC_FORCE_WITHDRAW_LIQUIDITY = 'Elastic Force Withdraw Liquidity',
  SETUP_SOLANA_SWAP = 'Set Up Swap Solana',

  KYBERDAO_STAKE = 'KyberDAO Stake',
  KYBERDAO_UNSTAKE = 'KyberDAO Unstake',
  KYBERDAO_DELEGATE = 'KyberDAO Delegate',
  KYBERDAO_UNDELEGATE = 'KyberDAO Undelegate',
  KYBERDAO_MIGRATE = 'KyberDAO Migrate',
  KYBERDAO_VOTE = 'KyberDAO Vote',
  KYBERDAO_CLAIM = 'KyberDAO Claim Voting Reward',

  CANCEL_LIMIT_ORDER = 'Cancel Limit Order',
  TRANSFER_TOKEN = 'Send',
}

export const GROUP_TRANSACTION_BY_TYPE = {
  SWAP: [
    TRANSACTION_TYPE.SWAP,
    TRANSACTION_TYPE.WRAP_TOKEN,
    TRANSACTION_TYPE.UNWRAP_TOKEN,
    TRANSACTION_TYPE.SETUP_SOLANA_SWAP,
  ],
  LIQUIDITY: [
    TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.CLASSIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
    TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
    TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY,
    TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY,
    TRANSACTION_TYPE.STAKE,
    TRANSACTION_TYPE.UNSTAKE,
    TRANSACTION_TYPE.HARVEST,
    TRANSACTION_TYPE.ELASTIC_COLLECT_FEE,
    TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY,
  ],
  KYBERDAO: [
    TRANSACTION_TYPE.KYBERDAO_STAKE,
    TRANSACTION_TYPE.KYBERDAO_UNSTAKE,
    TRANSACTION_TYPE.KYBERDAO_DELEGATE,
    TRANSACTION_TYPE.KYBERDAO_UNDELEGATE,
    TRANSACTION_TYPE.KYBERDAO_MIGRATE,
    TRANSACTION_TYPE.KYBERDAO_VOTE,
    TRANSACTION_TYPE.KYBERDAO_CLAIM,
  ],
  OTHER: [
    // to make sure you don't forgot
    TRANSACTION_TYPE.APPROVE,
    TRANSACTION_TYPE.CLAIM_REWARD,
    TRANSACTION_TYPE.BRIDGE,
    TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
    TRANSACTION_TYPE.TRANSFER_TOKEN,
  ],
}

export enum TRANSACTION_GROUP {
  SWAP = 'swap',
  LIQUIDITY = 'liquidity',
  KYBERDAO = 'kyber_dao',
  OTHER = 'other',
}

const totalType = Object.values(TRANSACTION_TYPE).length
const totalClassify = Object.values(GROUP_TRANSACTION_BY_TYPE).reduce((total, element) => total + element.length, 0)
if (totalType !== totalClassify) {
  throw new Error('Please set up group of the new transaction. Put your new type into GROUP_TRANSACTION_BY_TYPE')
}
