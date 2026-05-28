import { ContractTransaction } from '@ethersproject/contracts'
import i18n from 'uniswap/src/i18n'

import { getMorphoAssetAdapter, type ResolvedMorphoAssetAdapter } from 'pages/Markets/protocol/morpho/adapters'
import { type MorphoAddress, type MorphoMarketId, type MorphoTokenKey } from 'pages/Markets/protocol/morpho/config'
import { TransactionType, type ApproveTransactionInfo, type TransactionInfo } from 'state/transactions/types'

interface ReadableContract {
  [key: string]: (...args: any[]) => Promise<any>
}

interface WritableContract extends ReadableContract {}

interface MorphoFlowContext {
  account: MorphoAddress
  routerAddress: MorphoAddress
  routerMorphoAddress: MorphoAddress
  routerContract: WritableContract
  morphoContract: WritableContract
  getErc20Contract: (address: MorphoAddress) => WritableContract
  setStatus?: (status: string | null) => void
  onTransaction?: (transaction: MorphoTrackedTransaction) => void
}

export interface AssetAmounts {
  underlyingAmount: bigint
  protocolAmount: bigint
}

interface MarketFlowArgs extends MorphoFlowContext {
  marketId: MorphoMarketId
  collateralAssetKey: MorphoTokenKey
  loanAssetKey: MorphoTokenKey
  amounts: AssetAmounts
}

interface VaultFlowArgs extends MorphoFlowContext {
  vaultAddress: MorphoAddress
  assetKey: MorphoTokenKey
  amounts: AssetAmounts
  requiredShareAllowance?: bigint
}

interface VaultRedeemFlowArgs extends MorphoFlowContext {
  vaultAddress: MorphoAddress
  assetKey: MorphoTokenKey
  shares: bigint
}

export interface MorphoTrackedTransaction {
  response: ContractTransaction
  info: TransactionInfo
}

type MorphoSupplyTransactionInfo = Extract<TransactionInfo, { type: TransactionType.MORPHO_SUPPLY }>
type MorphoBorrowTransactionInfo = Extract<TransactionInfo, { type: TransactionType.BORROW }>
type MorphoRepayTransactionInfo = Extract<TransactionInfo, { type: TransactionType.REPAY }>
type MorphoAuthorizationTransactionInfo = Extract<TransactionInfo, { type: TransactionType.MORPHO_AUTHORIZATION }>
type MorphoVaultRedeemTransactionInfo = Extract<TransactionInfo, { type: TransactionType.MORPHO_REDEEM }>
type MorphoVaultDepositTransactionInfo = Extract<
  TransactionInfo,
  { type: TransactionType.DEPOSIT_LIQUIDITY_STAKING; assetAddress: string; protocol: 'morpho-vault' }
>
type MorphoVaultWithdrawTransactionInfo = Extract<
  TransactionInfo,
  { type: TransactionType.WITHDRAW_LIQUIDITY_STAKING; assetAddress: string; protocol: 'morpho-vault' }
>
type MorphoMarketWithdrawTransactionInfo = Extract<
  TransactionInfo,
  { type: TransactionType.WITHDRAW_LIQUIDITY_STAKING; assetAddress: string; protocol: 'morpho-market' }
>

function sameAddress(a: MorphoAddress, b: MorphoAddress) {
  return a.toLowerCase() === b.toLowerCase()
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error ? error.message : undefined
    const maybeReason = 'reason' in error ? error.reason : undefined
    return [maybeMessage, maybeReason].filter((value): value is string => typeof value === 'string').join(' ')
  }

  return ''
}

async function readAllowance(ctx: MorphoFlowContext, token: MorphoAddress, spender: MorphoAddress): Promise<bigint> {
  const contract = ctx.getErc20Contract(token)
  return (await contract.allowance(ctx.account, spender)) as bigint
}

async function ensureErc20Allowance(
  ctx: MorphoFlowContext,
  token: MorphoAddress,
  spender: MorphoAddress,
  amount: bigint,
  symbol: string,
): Promise<ContractTransaction | undefined> {
  const allowance = await readAllowance(ctx, token, spender)
  if (allowance >= amount) {
    return undefined
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.allowanceInsufficientApprovingRouter', { symbol }))
  return (await ctx.getErc20Contract(token).approve(spender, amount)) as ContractTransaction
}

async function ensureMorphoAuthorization(ctx: MorphoFlowContext): Promise<ContractTransaction | undefined> {
  const isAuthorized = (await ctx.morphoContract.isAuthorized(ctx.account, ctx.routerAddress)) as boolean
  if (isAuthorized) {
    return undefined
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.authorizingRouterOnMorpho'))
  try {
    return (await ctx.morphoContract.setAuthorization(ctx.routerAddress, true)) as ContractTransaction
  } catch (error) {
    const errorMessage = getErrorMessage(error).toLowerCase()

    // Morpho may reject duplicate authorizations with "already set".
    // Treat it as a no-op so the user can continue with the actual action.
    if (errorMessage.includes('already set')) {
      return undefined
    }

    const isAuthorizedAfterFailure = (await ctx.morphoContract.isAuthorized(ctx.account, ctx.routerAddress)) as boolean
    if (isAuthorizedAfterFailure) {
      return undefined
    }

    throw error
  }
}

async function assertRouterMarketReady(
  ctx: MorphoFlowContext,
  _wrapper: MorphoAddress,
  marketId: MorphoMarketId,
): Promise<void> {
  const [paused, morphoAddress, isSupportedMarket] = (await Promise.all([
    ctx.routerContract.paused(),
    ctx.routerContract.morpho(),
    ctx.routerContract.isSupportedMarket(marketId),
  ])) as [boolean, MorphoAddress, boolean]

  if (!sameAddress(morphoAddress, ctx.routerMorphoAddress)) {
    throw new Error(i18n.t('common.lendingAction.routerMorphoMismatch'))
  }
  if (paused) {
    throw new Error(i18n.t('common.lendingAction.routerPaused'))
  }
  if (!isSupportedMarket) {
    throw new Error(i18n.t('common.lendingAction.marketNotSupported'))
  }
}

async function assertRouterVaultReady(
  ctx: MorphoFlowContext,
  _wrapper: MorphoAddress,
  vault: MorphoAddress,
): Promise<void> {
  const [paused, morphoAddress, isSupportedVault] = (await Promise.all([
    ctx.routerContract.paused(),
    ctx.routerContract.morpho(),
    ctx.routerContract.isSupportedVault(vault),
  ])) as [boolean, MorphoAddress, boolean]

  if (!sameAddress(morphoAddress, ctx.routerMorphoAddress)) {
    throw new Error(i18n.t('common.lendingAction.routerMorphoMismatch'))
  }
  if (paused) {
    throw new Error(i18n.t('common.lendingAction.routerPaused'))
  }
  if (!isSupportedVault) {
    throw new Error(i18n.t('common.lendingAction.vaultNotSupported'))
  }
}

async function ensureVaultShareAllowance(
  ctx: MorphoFlowContext,
  vaultAddress: MorphoAddress,
  requiredShares: bigint,
): Promise<ContractTransaction | undefined> {
  if (requiredShares <= 0n) {
    throw new Error(i18n.t('common.lendingAction.unableToDeriveShareAllowance'))
  }

  return ensureErc20Allowance(ctx, vaultAddress, ctx.routerAddress, requiredShares, i18n.t('common.shares'))
}

function getWrappedAdapter(
  assetKey: MorphoTokenKey,
): ResolvedMorphoAssetAdapter & { wrapper: NonNullable<ResolvedMorphoAssetAdapter['wrapper']> } {
  const adapter = getMorphoAssetAdapter(assetKey)
  if (!adapter.wrapper) {
    throw new Error(i18n.t('common.lendingAction.wrapperConfigMissing', { symbol: adapter.underlying.symbol }))
  }
  return { ...adapter, wrapper: adapter.wrapper }
}

function buildMarketTitle(loanAssetKey: MorphoTokenKey, collateralAssetKey: MorphoTokenKey): string {
  const loanAdapter = getMorphoAssetAdapter(loanAssetKey)
  const collateralAdapter = getMorphoAssetAdapter(collateralAssetKey)
  return `${loanAdapter.underlying.symbol} / ${collateralAdapter.underlying.symbol}`
}

function buildVaultTitle(assetKey: MorphoTokenKey): string {
  const assetAdapter = getMorphoAssetAdapter(assetKey)
  return `${assetAdapter.underlying.symbol} ${i18n.t('common.vault')}`
}

function toApprovalTransaction(
  response: ContractTransaction,
  token:
    | ResolvedMorphoAssetAdapter['underlying']
    | { address: MorphoAddress; decimals: number; symbol: string; name: string },
  spender: MorphoAddress,
  amount: bigint,
): MorphoTrackedTransaction {
  const info: ApproveTransactionInfo = {
    type: TransactionType.APPROVAL,
    tokenAddress: token.address,
    spender,
    amount: amount.toString(),
    tokenSymbol: token.symbol,
    tokenDecimals: token.decimals,
    tokenName: token.name,
  }

  return { response, info }
}

function pushTrackedTransaction(
  ctx: MorphoFlowContext,
  transactions: MorphoTrackedTransaction[],
  transaction: MorphoTrackedTransaction,
) {
  transactions.push(transaction)
  ctx.onTransaction?.(transaction)
}

function toAuthorizationTransaction(
  response: ContractTransaction,
  targetAddress: MorphoAddress,
): MorphoTrackedTransaction {
  const info: MorphoAuthorizationTransactionInfo = {
    type: TransactionType.MORPHO_AUTHORIZATION,
    targetAddress,
    protocolLabel: 'Morpho',
  }

  return { response, info }
}

export async function runSupplyCollateralFlow({
  marketId,
  loanAssetKey,
  collateralAssetKey,
  amounts,
  ...ctx
}: MarketFlowArgs): Promise<MorphoTrackedTransaction[]> {
  const collateralAdapter = getWrappedAdapter(collateralAssetKey)
  const marketTitle = buildMarketTitle(loanAssetKey, collateralAssetKey)
  const transactions: MorphoTrackedTransaction[] = []

  await assertRouterMarketReady(ctx, collateralAdapter.wrapper.address, marketId)

  const approvalTx = await ensureErc20Allowance(
    ctx,
    collateralAdapter.underlying.address,
    ctx.routerAddress,
    amounts.underlyingAmount,
    collateralAdapter.underlying.symbol,
  )
  if (approvalTx) {
    pushTrackedTransaction(
      ctx,
      transactions,
      toApprovalTransaction(approvalTx, collateralAdapter.underlying, ctx.routerAddress, amounts.underlyingAmount),
    )
  }

  const authTx = await ensureMorphoAuthorization(ctx)
  if (authTx) {
    pushTrackedTransaction(ctx, transactions, toAuthorizationTransaction(authTx, ctx.routerAddress))
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.supplyingCollateralRouter'))
  const info: MorphoSupplyTransactionInfo = {
    type: TransactionType.MORPHO_SUPPLY,
    assetAddress: collateralAdapter.underlying.address,
    assetAmountRaw: amounts.underlyingAmount.toString(),
    assetDecimals: collateralAdapter.underlying.decimals,
    assetSymbol: collateralAdapter.underlying.symbol,
    marketId,
    marketTitle,
  }
  const response = (await ctx.routerContract.supplyCollateralWithWrap(
    marketId,
    collateralAdapter.wrapper.address,
    amounts.underlyingAmount,
  )) as ContractTransaction
  pushTrackedTransaction(ctx, transactions, { response, info })

  return transactions
}

export async function runBorrowFlow({
  marketId,
  collateralAssetKey,
  loanAssetKey,
  amounts,
  ...ctx
}: MarketFlowArgs): Promise<MorphoTrackedTransaction[]> {
  const loanAdapter = getWrappedAdapter(loanAssetKey)
  const marketTitle = buildMarketTitle(loanAssetKey, collateralAssetKey)
  const transactions: MorphoTrackedTransaction[] = []

  await assertRouterMarketReady(ctx, loanAdapter.wrapper.address, marketId)

  const authTx = await ensureMorphoAuthorization(ctx)
  if (authTx) {
    pushTrackedTransaction(ctx, transactions, toAuthorizationTransaction(authTx, ctx.routerAddress))
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.borrowingRouter'))
  const info: MorphoBorrowTransactionInfo = {
    type: TransactionType.BORROW,
    assetAddress: loanAdapter.underlying.address,
    assetAmountRaw: amounts.protocolAmount.toString(),
    assetDecimals: loanAdapter.underlying.decimals,
    assetSymbol: loanAdapter.underlying.symbol,
    marketId,
    marketTitle,
  }
  const response = (await ctx.routerContract.borrowAndUnwrap(
    marketId,
    loanAdapter.wrapper.address,
    amounts.protocolAmount,
  )) as ContractTransaction
  pushTrackedTransaction(ctx, transactions, { response, info })

  return transactions
}

export async function runRepayFlow({
  marketId,
  collateralAssetKey,
  loanAssetKey,
  amounts,
  ...ctx
}: MarketFlowArgs): Promise<MorphoTrackedTransaction[]> {
  const loanAdapter = getWrappedAdapter(loanAssetKey)
  const marketTitle = buildMarketTitle(loanAssetKey, collateralAssetKey)
  const transactions: MorphoTrackedTransaction[] = []

  await assertRouterMarketReady(ctx, loanAdapter.wrapper.address, marketId)

  const approvalTx = await ensureErc20Allowance(
    ctx,
    loanAdapter.underlying.address,
    ctx.routerAddress,
    amounts.underlyingAmount,
    loanAdapter.underlying.symbol,
  )
  if (approvalTx) {
    pushTrackedTransaction(
      ctx,
      transactions,
      toApprovalTransaction(approvalTx, loanAdapter.underlying, ctx.routerAddress, amounts.underlyingAmount),
    )
  }

  const authTx = await ensureMorphoAuthorization(ctx)
  if (authTx) {
    pushTrackedTransaction(ctx, transactions, toAuthorizationTransaction(authTx, ctx.routerAddress))
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.repayingRouter'))
  const info: MorphoRepayTransactionInfo = {
    type: TransactionType.REPAY,
    assetAddress: loanAdapter.underlying.address,
    assetAmountRaw: amounts.underlyingAmount.toString(),
    assetDecimals: loanAdapter.underlying.decimals,
    assetSymbol: loanAdapter.underlying.symbol,
    marketId,
    marketTitle,
  }
  const response = (await ctx.routerContract.repayWithWrap(
    marketId,
    loanAdapter.wrapper.address,
    amounts.underlyingAmount,
  )) as ContractTransaction
  pushTrackedTransaction(ctx, transactions, { response, info })

  return transactions
}

export async function runWithdrawCollateralFlow({
  marketId,
  loanAssetKey,
  collateralAssetKey,
  amounts,
  ...ctx
}: MarketFlowArgs): Promise<MorphoTrackedTransaction[]> {
  const collateralAdapter = getWrappedAdapter(collateralAssetKey)
  const marketTitle = buildMarketTitle(loanAssetKey, collateralAssetKey)
  const transactions: MorphoTrackedTransaction[] = []

  await assertRouterMarketReady(ctx, collateralAdapter.wrapper.address, marketId)

  const authTx = await ensureMorphoAuthorization(ctx)
  if (authTx) {
    pushTrackedTransaction(ctx, transactions, toAuthorizationTransaction(authTx, ctx.routerAddress))
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.withdrawingCollateralRouter'))
  const info: MorphoMarketWithdrawTransactionInfo = {
    type: TransactionType.WITHDRAW_LIQUIDITY_STAKING,
    protocol: 'morpho-market',
    assetAddress: collateralAdapter.underlying.address,
    assetAmountRaw: amounts.protocolAmount.toString(),
    assetDecimals: collateralAdapter.underlying.decimals,
    assetSymbol: collateralAdapter.underlying.symbol,
    marketId,
    marketTitle,
  }
  const response = (await ctx.routerContract.withdrawCollateralAndUnwrap(
    marketId,
    collateralAdapter.wrapper.address,
    amounts.protocolAmount,
  )) as ContractTransaction
  pushTrackedTransaction(ctx, transactions, { response, info })

  return transactions
}

export async function runVaultDepositFlow({
  vaultAddress,
  assetKey,
  amounts,
  ...ctx
}: VaultFlowArgs): Promise<MorphoTrackedTransaction[]> {
  const assetAdapter = getWrappedAdapter(assetKey)
  const vaultTitle = buildVaultTitle(assetKey)
  const transactions: MorphoTrackedTransaction[] = []

  await assertRouterVaultReady(ctx, assetAdapter.wrapper.address, vaultAddress)

  const approvalTx = await ensureErc20Allowance(
    ctx,
    assetAdapter.underlying.address,
    ctx.routerAddress,
    amounts.underlyingAmount,
    assetAdapter.underlying.symbol,
  )
  if (approvalTx) {
    pushTrackedTransaction(
      ctx,
      transactions,
      toApprovalTransaction(approvalTx, assetAdapter.underlying, ctx.routerAddress, amounts.underlyingAmount),
    )
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.depositingVaultRouter'))
  const info: MorphoVaultDepositTransactionInfo = {
    type: TransactionType.DEPOSIT_LIQUIDITY_STAKING,
    protocol: 'morpho-vault',
    vaultAddress,
    vaultTitle,
    assetAddress: assetAdapter.underlying.address,
    assetAmountRaw: amounts.underlyingAmount.toString(),
    assetDecimals: assetAdapter.underlying.decimals,
    assetSymbol: assetAdapter.underlying.symbol,
  }
  const response = (await ctx.routerContract.vaultDepositWithWrap(
    vaultAddress,
    assetAdapter.wrapper.address,
    amounts.underlyingAmount,
  )) as ContractTransaction
  pushTrackedTransaction(ctx, transactions, { response, info })

  return transactions
}

export async function runVaultWithdrawFlow({
  vaultAddress,
  assetKey,
  amounts,
  requiredShareAllowance,
  ...ctx
}: VaultFlowArgs): Promise<MorphoTrackedTransaction[]> {
  const assetAdapter = getWrappedAdapter(assetKey)
  const vaultTitle = buildVaultTitle(assetKey)
  const transactions: MorphoTrackedTransaction[] = []

  await assertRouterVaultReady(ctx, assetAdapter.wrapper.address, vaultAddress)

  const approvalTx = await ensureVaultShareAllowance(ctx, vaultAddress, requiredShareAllowance ?? 0n)
  if (approvalTx) {
    pushTrackedTransaction(
      ctx,
      transactions,
      toApprovalTransaction(
        approvalTx,
        {
          address: vaultAddress,
          decimals: assetAdapter.protocol.decimals,
          symbol: `${assetAdapter.underlying.symbol} ${i18n.t('common.shares')}`,
          name: vaultTitle,
        },
        ctx.routerAddress,
        requiredShareAllowance ?? 0n,
      ),
    )
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.withdrawingVaultRouter'))
  const info: MorphoVaultWithdrawTransactionInfo = {
    type: TransactionType.WITHDRAW_LIQUIDITY_STAKING,
    protocol: 'morpho-vault',
    vaultAddress,
    vaultTitle,
    assetAddress: assetAdapter.underlying.address,
    assetAmountRaw: amounts.protocolAmount.toString(),
    assetDecimals: assetAdapter.underlying.decimals,
    assetSymbol: assetAdapter.underlying.symbol,
  }
  const response = (await ctx.routerContract.vaultWithdrawAndUnwrap(
    vaultAddress,
    assetAdapter.wrapper.address,
    amounts.protocolAmount,
  )) as ContractTransaction
  pushTrackedTransaction(ctx, transactions, { response, info })

  return transactions
}

export async function runVaultRedeemFlow({
  vaultAddress,
  assetKey,
  shares,
  ...ctx
}: VaultRedeemFlowArgs): Promise<MorphoTrackedTransaction[]> {
  const assetAdapter = getWrappedAdapter(assetKey)
  const vaultTitle = buildVaultTitle(assetKey)
  const transactions: MorphoTrackedTransaction[] = []

  await assertRouterVaultReady(ctx, assetAdapter.wrapper.address, vaultAddress)

  const approvalTx = await ensureVaultShareAllowance(ctx, vaultAddress, shares)
  if (approvalTx) {
    pushTrackedTransaction(
      ctx,
      transactions,
      toApprovalTransaction(
        approvalTx,
        {
          address: vaultAddress,
          decimals: assetAdapter.protocol.decimals,
          symbol: `${assetAdapter.underlying.symbol} ${i18n.t('common.shares')}`,
          name: vaultTitle,
        },
        ctx.routerAddress,
        shares,
      ),
    )
  }

  ctx.setStatus?.(i18n.t('common.lendingAction.redeemingVaultRouter'))
  const info: MorphoVaultRedeemTransactionInfo = {
    type: TransactionType.MORPHO_REDEEM,
    assetAddress: assetAdapter.underlying.address,
    assetSymbol: assetAdapter.underlying.symbol,
    vaultAddress,
    vaultTitle,
    shareAmountRaw: shares.toString(),
    shareDecimals: assetAdapter.protocol.decimals,
  }
  const response = (await ctx.routerContract.vaultRedeemAndUnwrap(
    vaultAddress,
    assetAdapter.wrapper.address,
    shares,
  )) as ContractTransaction
  pushTrackedTransaction(ctx, transactions, { response, info })

  return transactions
}
