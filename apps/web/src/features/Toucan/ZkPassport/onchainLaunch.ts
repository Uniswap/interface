import { type PartialMessage } from '@bufbuild/protobuf'
import {
  type CreateAuctionRequest,
  PriceRangeStrategy as ProtoPriceRangeStrategy,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import {
  buildLaunchTransactions,
  buildLpAllocationSchedule,
  buildPositionDefinitions,
  computeInitializerSalt,
  deriveAuctionPricing,
  deriveBlocks,
  deriveConvexAuctionSteps,
  encodeAuctionParams,
  encodeAuctionSteps,
  encodeConfigData,
  encodeLpAllocationSchedule,
  encodePositionDefinitions,
  encodeTokenData,
  encodeTokenSplitterConfig,
  feeToTickSpacing,
  floorPriceToX96,
  FUNDS_RECIPIENT_SENTINEL,
  getBlockTimeSeconds,
  getErc20Decimals,
  getLauncherAddresses,
  type LpAllocationInput,
  NEW_TOKEN_DECIMALS,
  predictAuctionAddress,
  predictTokenAddress,
  type PriceRangeKind,
  requiredCurrencyRaised,
  resolvePoolFee,
  selectTokenFactory,
} from '@uniswap/liquidity-launcher-sdk'
import { type Address, type Hex, type PublicClient, zeroAddress } from 'viem'

export interface OnchainCreateAuctionResult {
  predictedTokenAddress: string
  predictedAuctionAddress: string
  transactions: Array<{
    to: string
    from: string
    data: string
    value: bigint
    chainId: number
  }>
  atomicallyBundleable: boolean
  requestId: string
}

class OnchainLaunchUnsupportedError extends Error {
  constructor(feature: string) {
    super(
      `${feature} is not supported by the on-chain launch fallback; disable it or launch from an origin with liquidity-backend access`,
    )
    this.name = 'OnchainLaunchUnsupportedError'
  }
}

function toPriceRangeKind(strategy: ProtoPriceRangeStrategy): PriceRangeKind {
  switch (strategy) {
    case ProtoPriceRangeStrategy.CONCENTRATED_FULL_RANGE:
      return 'CONCENTRATED_FULL_RANGE'
    case ProtoPriceRangeStrategy.FULL_RANGE:
      return 'FULL_RANGE'
    case ProtoPriceRangeStrategy.CUSTOM_RANGE:
      return 'CUSTOM_RANGE'
    default:
      throw new OnchainLaunchUnsupportedError(`Price range strategy ${strategy}`)
  }
}

function toLpAllocationInput(
  lpAllocation: NonNullable<NonNullable<PartialMessage<CreateAuctionRequest>['pool']>['lpAllocation']>,
  raiseCurrencyDecimals: number,
): LpAllocationInput {
  const kind = lpAllocation.kind
  if (kind?.case === 'singlePercent') {
    return { kind: 'single', percent: kind.value }
  }
  if (kind?.case === 'tiered') {
    return {
      kind: 'tiered',
      raiseCurrencyDecimals,
      tiers: (kind.value.tiers ?? []).map((tier) => ({
        raiseMilestone: tier.raiseMilestone ?? '',
        percent: tier.percent ?? 0,
      })),
    }
  }
  throw new OnchainLaunchUnsupportedError('Unset LP allocation')
}

/**
 * Local equivalent of the liquidity backend's CreateAuction: derives the
 * contract-native launch parameters from the wizard request and assembles the
 * launcher multicall. Supports the demo path — a NEW token with an optional
 * validation hook and no liquidity lock; unsupported wizard features throw so
 * the existing error surface reports them.
 */
export async function buildOnchainCreateAuction({
  request,
  chainId,
  publicClient,
}: {
  request: PartialMessage<CreateAuctionRequest>
  chainId: number
  publicClient: PublicClient
}): Promise<OnchainCreateAuctionResult> {
  const auction = request.auction
  const pool = request.pool
  const walletAddress = request.walletAddress as Address | undefined
  const salt = request.salt as Hex | undefined
  if (!auction || !pool || !walletAddress || !salt) {
    throw new Error('Incomplete auction request')
  }
  if (request.tokenInfo?.source?.case !== 'newToken') {
    throw new OnchainLaunchUnsupportedError('Launching an existing token')
  }
  if (pool.liquidityLock) {
    throw new OnchainLaunchUnsupportedError('Liquidity locking')
  }
  const newToken = request.tokenInfo.source.value

  const addresses = getLauncherAddresses(chainId)
  const tokenFactory = selectTokenFactory(addresses)
  if (!tokenFactory) {
    throw new OnchainLaunchUnsupportedError(`New-token launches on chain ${chainId}`)
  }

  const totalSupply = BigInt(newToken.totalSupply ?? '0')
  const auctionSupply = BigInt(auction.auctionSupply ?? '0')
  const returnedSupply = BigInt(auction.returnedSupply ?? '0')
  const reservedForLp = BigInt(pool.reservedSupplyForLp ?? '0')
  const lbpAmount = auctionSupply - returnedSupply
  const soldSupply = lbpAmount - reservedForLp
  const currency = (auction.currencyAddress || zeroAddress) as Address
  const poolOwner = (pool.poolOwner || walletAddress) as Address

  const tokenData = encodeTokenData({
    description: newToken.metadata?.description ?? '',
    website: '',
    image: newToken.metadata?.image ?? '',
    extraData: '0x',
  })

  const [predictedTokenAddress, currentBlock, currencyDecimals] = await Promise.all([
    predictTokenAddress(publicClient, {
      factory: tokenFactory.factory,
      kind: tokenFactory.kind,
      launcherAddress: addresses.liquidityLauncher,
      wallet: walletAddress,
      name: newToken.name ?? '',
      symbol: newToken.symbol ?? '',
      decimals: NEW_TOKEN_DECIMALS,
      homeChainId: BigInt(chainId),
    }),
    publicClient.getBlockNumber(),
    currency === zeroAddress ? Promise.resolve(18) : getErc20Decimals(publicClient, currency),
  ])

  const blocks = deriveBlocks({
    startTimeUnix: BigInt(auction.startTimeUnix ?? 0n),
    endTimeUnix: BigInt(auction.endTimeUnix ?? 0n),
    currentBlock,
    nowUnix: BigInt(Math.floor(Date.now() / 1000)),
    blockTimeSeconds: getBlockTimeSeconds(chainId),
  })

  const pricing = deriveAuctionPricing(
    floorPriceToX96(auction.floorPriceRaisePerToken ?? '0', NEW_TOKEN_DECIMALS, currencyDecimals),
  )
  const graduationX96 = auction.graduationPriceRaisePerToken
    ? deriveAuctionPricing(floorPriceToX96(auction.graduationPriceRaisePerToken, NEW_TOKEN_DECIMALS, currencyDecimals))
        .floorPriceX96
    : pricing.floorPriceX96

  const auctionParams = encodeAuctionParams({
    currency,
    tokensRecipient: walletAddress,
    fundsRecipient: FUNDS_RECIPIENT_SENTINEL,
    startBlock: blocks.startBlock,
    endBlock: blocks.endBlock,
    claimBlock: blocks.claimBlock,
    tickSpacing: pricing.tickSpacing,
    validationHook: (auction.validationHook || zeroAddress) as Address,
    floorPrice: pricing.floorPriceX96,
    requiredCurrencyRaised: requiredCurrencyRaised(graduationX96, soldSupply),
    auctionStepsData: encodeAuctionSteps(deriveConvexAuctionSteps(blocks.startBlock, blocks.endBlock)),
  })

  const poolFee = resolvePoolFee(pool.fee ?? 0, pool.dynamicFee ?? false)
  const poolTickSpacing = feeToTickSpacing(pool.fee ?? 0)
  const migrator = {
    token: predictedTokenAddress,
    currency,
    migrationBlock: blocks.migrationBlock,
    reservedTokenAmountForLP: reservedForLp,
    recipient: poolOwner,
    positionRecipient: poolOwner,
    poolParameters: {
      fee: poolFee,
      tickSpacing: poolTickSpacing,
      hook: zeroAddress,
    },
    positionDefinitions: encodePositionDefinitions(
      buildPositionDefinitions(
        toPriceRangeKind(pool.priceRangeStrategy ?? ProtoPriceRangeStrategy.UNSPECIFIED),
        (pool.customRanges ?? []).map((range) => ({
          minPercentFromClearing: Number(range.minPercentFromClearing),
          maxPercentFromClearing: Number(range.maxPercentFromClearing),
          liquidityPercent: range.liquidityPercent ?? 0,
        })),
        poolTickSpacing,
      ),
    ),
    lpAllocationSchedule: encodeLpAllocationSchedule(
      buildLpAllocationSchedule(toLpAllocationInput(pool.lpAllocation ?? {}, currencyDecimals)),
    ),
  }
  const configData = encodeConfigData(migrator, auctionParams)

  const distributions = [{ strategy: addresses.lbpStrategy, amount: lbpAmount, configData }]
  if (returnedSupply > 0n) {
    distributions.push({
      strategy: addresses.tokenSplitter,
      amount: returnedSupply,
      configData: encodeTokenSplitterConfig([{ recipient: walletAddress, amount: returnedSupply }]),
    })
  }

  const [transactions, predictedAuctionAddress] = await Promise.all([
    Promise.resolve(
      buildLaunchTransactions({
        liquidityLauncher: addresses.liquidityLauncher,
        token: predictedTokenAddress,
        salt,
        acquire: {
          kind: 'create',
          args: {
            factory: tokenFactory.factory,
            name: newToken.name ?? '',
            symbol: newToken.symbol ?? '',
            decimals: NEW_TOKEN_DECIMALS,
            initialSupply: totalSupply,
            recipient: addresses.liquidityLauncher,
            tokenData,
          },
        },
        distributions,
      }),
    ),
    predictAuctionAddress(publicClient, {
      strategy: addresses.lbpStrategy,
      token: predictedTokenAddress,
      auctionSupply: soldSupply + reservedForLp,
      auctionParams,
      initializerSalt: computeInitializerSalt(walletAddress, salt, migrator),
    }),
  ])

  return {
    predictedTokenAddress,
    predictedAuctionAddress,
    transactions: transactions.map((tx) => ({
      ...tx,
      from: walletAddress,
      chainId,
    })),
    atomicallyBundleable: false,
    requestId: crypto.randomUUID(),
  }
}
