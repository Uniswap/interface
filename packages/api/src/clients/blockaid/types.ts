// The eslint rule is disabled because we want to use the zod schema factory pattern to avoid bundle size bloat
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { z } from 'zod'

/**
 * Lazy-loaded Zod schema factory for Blockaid scan site request
 */
export const getBlockaidScanSiteRequestSchema = () =>
  z.object({
    url: z.string(),
    metadata: z.unknown().optional(),
  })

export type BlockaidScanSiteRequest = z.infer<ReturnType<typeof getBlockaidScanSiteRequestSchema>>

/**
 * Lazy-loaded Zod schema factory for Blockaid scan site "hit" response
 */
export const getBlockaidScanSiteHitResponseSchema = () =>
  z.object({
    status: z.literal('hit'),
    url: z.string(),
    scan_start_time: z.string(),
    scan_end_time: z.string(),
    malicious_score: z.number(),
    is_reachable: z.boolean(),
    is_web3_site: z.boolean(),
    is_malicious: z.boolean(),
    attack_types: z.record(z.unknown()),
    network_operations: z.array(z.string()),
    json_rpc_operations: z.array(z.string()),
    contract_write: z.record(z.unknown()),
    contract_read: z.record(z.unknown()),
  })

export type BlockaidScanSiteHitResponse = z.infer<ReturnType<typeof getBlockaidScanSiteHitResponseSchema>>

/**
 * Lazy-loaded Zod schema factory for Blockaid scan site "miss" response
 */
export const getBlockaidScanSiteMissResponseSchema = () =>
  z.object({
    status: z.literal('miss'),
    url: z.string(),
  })

export type BlockaidScanSiteMissResponse = z.infer<ReturnType<typeof getBlockaidScanSiteMissResponseSchema>>

/**
 * Lazy-loaded Zod schema factory for Blockaid scan site response (discriminated union)
 */
export const getBlockaidScanSiteResponseSchema = () =>
  z.discriminatedUnion('status', [getBlockaidScanSiteHitResponseSchema(), getBlockaidScanSiteMissResponseSchema()])

export type BlockaidScanSiteResponse = z.infer<ReturnType<typeof getBlockaidScanSiteResponseSchema>>

/**
 * Verification status for dApp sites scanned by Blockaid
 */
export enum DappVerificationStatus {
  Verified = 'VERIFIED',
  Unverified = 'UNVERIFIED',
  Threat = 'THREAT',
}

// Transaction Scan Types

/**
 * Zod schema for transaction scan metadata
 */
const getMetadataDappSchema = () =>
  z.object({
    domain: z.string(),
  })

/**
 * Lazy-loaded Zod schema factory for transaction data
 */
const getTransactionDataSchema = () =>
  z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    value: z.string().optional(),
    data: z.string().optional(),
    gas: z.string().optional(),
    gasPrice: z.string().optional(),
    maxFeePerGas: z.string().optional(),
    maxPriorityFeePerGas: z.string().optional(),
    nonce: z.string().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for Blockaid scan transaction request
 */
export const getBlockaidScanTransactionRequestSchema = () =>
  z.object({
    chain: z.string(),
    options: z.array(z.enum(['validation', 'simulation', 'gas_estimation', 'events'])).optional(),
    metadata: getMetadataDappSchema(),
    block: z.union([z.number(), z.string()]).optional(),
    state_override: z.record(z.unknown()).optional(),
    simulate_with_estimated_gas: z.boolean().optional(),
    account_address: z.string(),
    data: getTransactionDataSchema(),
  })

export type BlockaidScanTransactionRequest = z.infer<ReturnType<typeof getBlockaidScanTransactionRequestSchema>>

/**
 * Lazy-loaded Zod schema factory for transaction feature
 */
const getTransactionFeatureSchema = () =>
  z.object({
    type: z.enum(['Malicious', 'Warning', 'Benign', 'Info']),
    feature_id: z.string(),
    description: z.string(),
    address: z.string().optional(),
    entity: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })

/**
 * Lazy-loaded Zod schema factory for asset amount
 * Note: For NFTs (ERC721/ERC1155), 'value' is not present, only 'token_id'
 */
const getAssetAmountSchema = () =>
  z.object({
    value: z.union([z.string(), z.number()]).optional(),
    summary: z.string().optional(),
    usd_price: z.union([z.string(), z.number()]).optional(),
    raw_value: z.string().optional(),
    // NFT-specific fields
    token_id: z.string().optional(),
    arbitrary_collection_token: z.boolean().optional(),
    logo_url: z.string().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for balance change
 */
const getBalanceChangeSchema = () =>
  z.object({
    usd_price: z.string().optional(),
    value: z.union([z.string(), z.number()]),
    raw_value: z.string(),
  })

/**
 * Lazy-loaded Zod schema factory for ERC20 token details
 */
const getERC20TokenDetailsSchema = () =>
  z.object({
    type: z.literal('ERC20'),
    address: z.string(),
    name: z.string().optional(),
    symbol: z.string(),
    decimals: z.number(),
    logo_url: z.string().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for ERC721 token details
 */
const getERC721TokenDetailsSchema = () =>
  z.object({
    type: z.literal('ERC721'),
    address: z.string(),
    name: z.string().optional(),
    symbol: z.string().optional(),
    logo_url: z.string().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for ERC1155 token details
 */
const getERC1155TokenDetailsSchema = () =>
  z.object({
    type: z.literal('ERC1155'),
    address: z.string(),
    name: z.string().optional(),
    symbol: z.string().optional(),
    logo_url: z.string().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for native asset details
 */
const getNativeAssetDetailsSchema = () =>
  z.object({
    type: z.literal('NATIVE'),
    chain_id: z.number(),
    chain_name: z.string(),
    decimals: z.number(),
    name: z.string(),
    logo_url: z.string().optional(),
    symbol: z.string(),
  })

/**
 * Lazy-loaded Zod schema factory for asset details (discriminated union)
 */
const getAssetDetailsSchema = () =>
  z.discriminatedUnion('type', [
    getERC20TokenDetailsSchema(),
    getERC721TokenDetailsSchema(),
    getERC1155TokenDetailsSchema(),
    getNativeAssetDetailsSchema(),
  ])

/**
 * Lazy-loaded Zod schema factory for asset diff
 */
const getAssetDiffSchema = () =>
  z.object({
    asset_type: z.string(),
    asset: getAssetDetailsSchema(),
    in: z.array(getAssetAmountSchema()),
    out: z.array(getAssetAmountSchema()),
    balance_changes: z
      .object({
        before: getBalanceChangeSchema(),
        after: getBalanceChangeSchema(),
      })
      .optional(),
  })

/**
 * Lazy-loaded Zod schema factory for USD diff
 */
const getUsdDiffSchema = () =>
  z.object({
    in: z.string(),
    out: z.string(),
    total: z.string(),
  })

/**
 * Lazy-loaded Zod schema factory for spender exposure
 */
const getSpenderExposureSchema = () =>
  z.object({
    summary: z.string().optional(),
    exposure: z.array(getAssetAmountSchema()).optional(),
    approval: z.string().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for exposure
 */
const getExposureSchema = () =>
  z.object({
    asset_type: z.string().optional(),
    asset: getAssetDetailsSchema(),
    spenders: z.record(getSpenderExposureSchema()),
  })

/**
 * Lazy-loaded Zod schema factory for address detail
 */
const getAddressDetailSchema = () =>
  z.object({
    contract_name: z.string().optional(),
    name_tag: z.string().optional(),
    description: z.string().optional(),
    is_eoa: z.boolean().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for asset trace
 */
const getAssetTraceSchema = () =>
  z.object({
    type: z.string(),
    trace_type: z.string(),
    from_address: z.string().optional(),
    to_address: z.string().optional(),
    owner: z.string().optional(),
    spender: z.string().optional(),
    asset: getAssetDetailsSchema(),
    diff: getAssetAmountSchema().optional(),
    exposed: getAssetAmountSchema().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for account summary
 */
const getAccountSummarySchema = () =>
  z.object({
    assets_diffs: z.array(getAssetDiffSchema()),
    traces: z.array(getAssetTraceSchema()),
    total_usd_diff: getUsdDiffSchema().optional(),
    exposures: z.array(getExposureSchema()),
    total_usd_exposure: z.record(z.string()),
  })

/**
 * Lazy-loaded Zod schema factory for missing balance
 */
const getMissingBalanceSchema = () =>
  z.object({
    asset: getAssetDetailsSchema(),
    required_balance: getAssetAmountSchema(),
    current_balance: getAssetAmountSchema(),
    missing_balance: getAssetAmountSchema(),
  })

/**
 * Lazy-loaded Zod schema factory for transaction params
 */
const getTransactionParamsSchema = () =>
  z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      value: z.string().optional(),
      data: z.string().optional(),
      block_tag: z.string().optional(),
      chain: z.string().optional(),
      calldata: z
        .object({
          function_selector: z.string().optional(),
          function_signature: z.string().optional(),
        })
        .optional(),
    })
    .catchall(z.unknown())

/**
 * Lazy-loaded Zod schema factory for transaction simulation success
 */
const getTransactionSimulationSuccessSchema = () =>
  z.object({
    status: z.literal('Success'),
    assets_diffs: z.record(z.array(getAssetDiffSchema())),
    transaction_actions: z.array(
      z.union([
        z.enum([
          'mint',
          'stake',
          'swap',
          'native_transfer',
          'token_transfer',
          'approval',
          'set_code_account',
          'proxy_upgrade',
          'ownership_change',
        ]),
        z.string(),
      ]),
    ),
    total_usd_diff: z.record(getUsdDiffSchema()),
    exposures: z.record(z.array(getExposureSchema())),
    total_usd_exposure: z.record(z.record(z.string())),
    address_details: z.record(getAddressDetailSchema()),
    account_summary: getAccountSummarySchema(),
    params: getTransactionParamsSchema().optional(),
    contract_management: z.record(z.unknown()).optional(),
    session_key: z.record(z.unknown()).optional(),
    missing_balances: z.array(getMissingBalanceSchema()).optional(),
    simulation_run_count: z.number().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for transaction simulation error
 */
const getTransactionSimulationErrorSchema = () =>
  z.object({
    status: z.literal('Error'),
    error: z.string(),
  })

/**
 * Lazy-loaded Zod schema factory for transaction simulation (discriminated union)
 */
const getTransactionSimulationSchema = () =>
  z.discriminatedUnion('status', [getTransactionSimulationSuccessSchema(), getTransactionSimulationErrorSchema()])

/**
 * Lazy-loaded Zod schema factory for transaction validation success
 */
const getTransactionValidationSuccessSchema = () =>
  z.object({
    status: z.literal('Success'),
    result_type: z.string(),
    description: z.string(),
    reason: z.string(),
    classification: z.string(),
    features: z.array(getTransactionFeatureSchema()),
  })

/**
 * Lazy-loaded Zod schema factory for transaction validation error
 */
const getTransactionValidationErrorSchema = () =>
  z.object({
    status: z.literal('Error'),
    result_type: z.string(),
    description: z.string(),
    reason: z.string(),
    classification: z.string().optional(),
    features: z.array(getTransactionFeatureSchema()),
    error: z.string(),
  })

/**
 * Lazy-loaded Zod schema factory for transaction validation (discriminated union)
 */
const getTransactionValidationSchema = () =>
  z.discriminatedUnion('status', [getTransactionValidationSuccessSchema(), getTransactionValidationErrorSchema()])

/**
 * Lazy-loaded Zod schema factory for event parameter
 */
const getEventParamSchema = () =>
  z.object({
    type: z.string(),
    value: z.union([z.string(), z.record(z.unknown()), z.array(z.unknown())]),
    internalType: z.string().optional(),
    name: z.string().optional(),
  })

/**
 * Lazy-loaded Zod schema factory for transaction event
 */
const getTransactionEventSchema = () =>
  z.object({
    emitter_address: z.string(),
    emitter_name: z.string().optional(),
    name: z.string().optional(),
    params: z.array(getEventParamSchema()).optional(),
    topics: z.array(z.string()),
    data: z.string(),
  })

/**
 * Lazy-loaded Zod schema factory for Blockaid scan transaction response
 */
export const getBlockaidScanTransactionResponseSchema = () =>
  z.object({
    validation: getTransactionValidationSchema().optional(),
    simulation: getTransactionSimulationSchema().optional(),
    events: z.array(getTransactionEventSchema()).optional(),
    gas_estimation: z.unknown().optional(),
    user_operation_gas_estimation: z.unknown().optional(),
    features: z.record(z.unknown()).optional(),
    block: z.string(),
    chain: z.string(),
    account_address: z.string().optional(),
  })

export type BlockaidScanTransactionResponse = z.infer<ReturnType<typeof getBlockaidScanTransactionResponseSchema>>

// JSON-RPC Scan Types

/**
 * Lazy-loaded Zod schema factory for JSON-RPC data
 */
const getJsonRpcDataSchema = () =>
  z.object({
    method: z.enum([
      'eth_sendTransaction',
      'eth_sendRawTransaction',
      'eth_signTransaction',
      'eth_signTypedData',
      'eth_signTypedData_v1',
      'eth_signTypedData_v2',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4',
      'eth_sendUserOperation',
      'personal_sign',
      'eth_sign',
      'wallet_sendCalls',
    ]),
    params: z.array(z.unknown()),
  })

/**
 * Lazy-loaded Zod schema factory for Blockaid scan JSON-RPC request
 */
export const getBlockaidScanJsonRpcRequestSchema = () =>
  z.object({
    chain: z.string(),
    options: z.array(z.enum(['validation', 'simulation', 'gas_estimation', 'events'])).optional(),
    metadata: getMetadataDappSchema(),
    block: z.union([z.number(), z.string()]).optional(),
    state_override: z.record(z.unknown()).optional(),
    simulate_with_estimated_gas: z.boolean().optional(),
    account_address: z.string().optional(),
    data: getJsonRpcDataSchema(),
  })

export type BlockaidScanJsonRpcRequest = z.infer<ReturnType<typeof getBlockaidScanJsonRpcRequestSchema>>

// JSON-RPC scan response uses the same response type as transaction scan
export type BlockaidScanJsonRpcResponse = BlockaidScanTransactionResponse
