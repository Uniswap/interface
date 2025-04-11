import {
  PairPosition,
  PoolPosition,
  PositionStatus,
  ProtocolVersion,
  Pair as RestPair,
  Pool as RestPool,
  Position as RestPosition,
  Token as RestToken,
} from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { defaultFeeTiers } from 'components/Liquidity/constants'
import { FeeTierData, PositionInfo } from 'components/Liquidity/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { DYNAMIC_FEE_DATA, DynamicFeeData, FeeData } from 'pages/Pool/Positions/create/types'
import { GeneratedIcon } from 'ui/src'
import { Flag } from 'ui/src/components/icons/Flag'
import { Pools } from 'ui/src/components/icons/Pools'
import { SwapCoin } from 'ui/src/components/icons/SwapCoin'
import { AppTFunction } from 'ui/src/i18n/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function hasLPFoTTransferError(
  currencyInfo: Maybe<CurrencyInfo>,
  protocolVersion: ProtocolVersion | undefined,
): CurrencyInfo | undefined {
  const currency = currencyInfo?.currency

  // FoT is only an issue for v3 + v4
  if (!protocolVersion || protocolVersion === ProtocolVersion.V2 || !currency || currency?.isNative) {
    return undefined
  }

  return currency?.wrapped.buyFeeBps?.gt(0) ||
    (currencyInfo?.safetyInfo?.blockaidFees?.buyFeePercent ?? 0) > 0 ||
    currency?.wrapped.sellFeeBps?.gt(0) ||
    (currencyInfo?.safetyInfo?.blockaidFees?.sellFeePercent ?? 0) > 0
    ? currencyInfo
    : undefined
}

export function getProtocolVersionLabel(version: ProtocolVersion): string | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'v2'
    case ProtocolVersion.V3:
      return 'v3'
    case ProtocolVersion.V4:
      return 'v4'
    default:
      return undefined
  }
}

export function getProtocolItems(version: ProtocolVersion | undefined): ProtocolItems | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return ProtocolItems.V2
    case ProtocolVersion.V3:
      return ProtocolItems.V3
    case ProtocolVersion.V4:
      return ProtocolItems.V4
  }
  return undefined
}

export function getProtocolStatusLabel(status: PositionStatus, t: AppTFunction): string | undefined {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return t('common.withinRange')
    case PositionStatus.OUT_OF_RANGE:
      return t('common.outOfRange')
    case PositionStatus.CLOSED:
      return t('common.closed')
  }
  return undefined
}

export function parseProtocolVersion(version: string | undefined): ProtocolVersion | undefined {
  switch (version?.toLowerCase()) {
    case 'v2':
      return ProtocolVersion.V2
    case 'v3':
      return ProtocolVersion.V3
    case 'v4':
      return ProtocolVersion.V4
    default:
      return undefined
  }
}

export function getPositionUrl(position: PositionInfo): string {
  const chainInfo = getChainInfo(position.chainId)
  if (position.version === ProtocolVersion.V2) {
    return `/positions/v2/${chainInfo.urlParam}/${position.liquidityToken.address}`
  } else if (position.version === ProtocolVersion.V3) {
    return `/positions/v3/${chainInfo.urlParam}/${position.tokenId}`
  }
  return `/positions/v4/${chainInfo.urlParam}/${position.tokenId}`
}

function parseV3FeeTier(feeTier: string | undefined): FeeAmount | undefined {
  const parsedFee = parseInt(feeTier || '')

  return parsedFee in FeeAmount ? parsedFee : undefined
}

export function getPoolFromRest({
  pool,
  token0,
  token1,
  protocolVersion,
}: {
  pool?: RestPool | PoolPosition
  token0?: Token
  token1?: Token
  protocolVersion: ProtocolVersion.V3
}): V3Pool | undefined
export function getPoolFromRest({
  pool,
  token0,
  token1,
  protocolVersion,
  hooks,
}: {
  pool?: RestPool | PoolPosition
  token0?: Currency
  token1?: Currency
  protocolVersion: ProtocolVersion.V4
  hooks: string
}): V4Pool | undefined
export function getPoolFromRest({
  pool,
  token0,
  token1,
  protocolVersion,
  hooks,
}:
  | {
      pool?: RestPool | PoolPosition
      token0?: Token
      token1?: Token
      protocolVersion: ProtocolVersion.V3
      hooks?: undefined
    }
  | {
      pool?: RestPool | PoolPosition
      token0?: Currency
      token1?: Currency
      protocolVersion: ProtocolVersion.V4
      hooks: string
    }): V3Pool | V4Pool | undefined {
  if (!pool || !token0 || !token1) {
    return undefined
  }

  if (pool instanceof RestPool) {
    if (protocolVersion === ProtocolVersion.V3) {
      return new V3Pool(token0 as Token, token1 as Token, pool.fee, pool.sqrtPriceX96, pool.liquidity, pool.tick)
    }

    return new V4Pool(
      token0,
      token1,
      pool.fee,
      pool.tickSpacing,
      hooks || ZERO_ADDRESS,
      pool.sqrtPriceX96,
      pool.liquidity,
      pool.tick,
    )
  }

  if (pool instanceof PoolPosition) {
    if (protocolVersion === ProtocolVersion.V3) {
      const feeTier = parseV3FeeTier(pool.feeTier)
      if (feeTier) {
        return new V3Pool(
          token0 as Token,
          token1 as Token,
          feeTier,
          pool.currentPrice,
          pool.currentLiquidity,
          parseInt(pool.currentTick),
        )
      }
    }

    const fee = parseInt(pool.feeTier ?? '')
    return new V4Pool(
      token0,
      token1,
      fee,
      parseInt(pool.tickSpacing),
      hooks || ZERO_ADDRESS,
      pool.currentPrice,
      pool.liquidity,
      parseInt(pool.currentTick),
    )
  }

  return undefined
}

function parseRestToken<T extends Currency>(token: RestToken | undefined): T | undefined {
  if (!token) {
    return undefined
  }

  if (token.address === ZERO_ADDRESS) {
    return nativeOnChain(token.chainId) as T
  }

  return new Token(token.chainId, token.address, token.decimals, token.symbol) as T
}

function getPairFromRest({
  pair,
  token0,
  token1,
}: {
  pair?: PairPosition | RestPair
  token0: Token
  token1: Token
}): Pair | undefined {
  if (!pair) {
    return undefined
  }

  return new Pair(
    CurrencyAmount.fromRawAmount(token0, pair.reserve0),
    CurrencyAmount.fromRawAmount(token1, pair.reserve1),
  )
}

/**
 * @param position REST position with unknown version / fields.
 * @returns PositionInfo with the available fields parsed.
 */
export function parseRestPosition(position?: RestPosition): PositionInfo | undefined {
  if (position?.position.case === 'v2Pair') {
    const v2PairPosition = position.position.value
    const token0 = parseRestToken<Token>(v2PairPosition.token0)
    const token1 = parseRestToken<Token>(v2PairPosition.token1)
    const liquidityToken = parseRestToken<Token>(v2PairPosition.liquidityToken)
    if (!token0 || !token1 || !liquidityToken) {
      return undefined
    }

    const pair = getPairFromRest({ pair: position.position.value, token0, token1 })

    return {
      status: position.status,
      version: ProtocolVersion.V2,
      pair,
      liquidityToken,
      chainId: token0.chainId,
      poolId: liquidityToken.address,
      currency0Amount: CurrencyAmount.fromRawAmount(token0, v2PairPosition.liquidity0),
      currency1Amount: CurrencyAmount.fromRawAmount(token1, v2PairPosition.liquidity1),
      totalSupply: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.totalSupply),
      liquidityAmount: CurrencyAmount.fromRawAmount(liquidityToken, v2PairPosition.liquidity),
      apr: v2PairPosition.apr,
      v4hook: undefined,
      feeTier: undefined,
      owner: undefined,
      isHidden: position.isHidden,
    }
  } else if (position?.position.case === 'v3Position') {
    const v3Position = position.position.value

    const token0 = parseRestToken<Token>(v3Position.token0)
    const token1 = parseRestToken<Token>(v3Position.token1)
    if (!token0 || !token1) {
      return undefined
    }

    const pool = getPoolFromRest({ pool: position.position.value, token0, token1, protocolVersion: ProtocolVersion.V3 })
    const sdkPosition = pool
      ? new V3Position({
          pool,
          liquidity: v3Position.liquidity,
          tickLower: Number(v3Position.tickLower),
          tickUpper: Number(v3Position.tickUpper),
        })
      : undefined

    return {
      status: position.status,
      feeTier: parseV3FeeTier(v3Position.feeTier),
      version: ProtocolVersion.V3,
      chainId: token0.chainId,
      pool,
      poolId: position.position.value.poolId,
      position: sdkPosition,
      tickLower: v3Position.tickLower,
      tickUpper: v3Position.tickUpper,
      tickSpacing: Number(v3Position.tickSpacing),
      liquidity: v3Position.liquidity,
      tokenId: v3Position.tokenId,
      token0UncollectedFees: v3Position.token0UncollectedFees,
      token1UncollectedFees: v3Position.token1UncollectedFees,
      currency0Amount: CurrencyAmount.fromRawAmount(token0, v3Position.amount0),
      currency1Amount: CurrencyAmount.fromRawAmount(token1, v3Position.amount1),
      apr: v3Position.apr,
      v4hook: undefined,
      owner: v3Position.owner,
      isHidden: position.isHidden,
    }
  } else if (position?.position.case === 'v4Position') {
    const v4Position = position.position.value.poolPosition
    const token0 = parseRestToken<Currency>(v4Position?.token0)
    const token1 = parseRestToken<Currency>(v4Position?.token1)
    if (!v4Position || !token0 || !token1) {
      return undefined
    }

    const hook = position.position.value.hooks[0]?.address
    const pool = getPoolFromRest({ pool: v4Position, token0, token1, hooks: hook, protocolVersion: ProtocolVersion.V4 })

    const sdkPosition = pool
      ? new V4Position({
          pool,
          liquidity: v4Position.liquidity,
          tickLower: Number(v4Position.tickLower),
          tickUpper: Number(v4Position.tickUpper),
        })
      : undefined
    const poolId = V4Pool.getPoolId(token0, token1, Number(v4Position.feeTier), Number(v4Position.tickSpacing), hook)
    return {
      status: position.status,
      feeTier: v4Position.feeTier,
      version: ProtocolVersion.V4,
      position: sdkPosition,
      chainId: token0.chainId,
      pool,
      poolId,
      v4hook: hook,
      tokenId: v4Position.tokenId,
      tickLower: v4Position.tickLower,
      tickUpper: v4Position.tickUpper,
      tickSpacing: Number(v4Position.tickSpacing),
      currency0Amount: CurrencyAmount.fromRawAmount(token0, v4Position.amount0 ?? 0),
      currency1Amount: CurrencyAmount.fromRawAmount(token1, v4Position.amount1 ?? 0),
      token0UncollectedFees: v4Position.token0UncollectedFees,
      token1UncollectedFees: v4Position.token1UncollectedFees,
      liquidity: v4Position.liquidity,
      apr: v4Position.apr,
      owner: v4Position.owner,
      isHidden: position.isHidden,
    }
  } else {
    return undefined
  }
}

export function calculateInvertedValues({
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
  invert?: boolean
}): {
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
} {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

// tick spacing must be a whole number >= 1
export function calculateTickSpacingFromFeeAmount(feeAmount: number): number {
  return Math.max(Math.round((2 * feeAmount) / 100), 1)
}

export enum HookFlag {
  BeforeAddLiquidity = 'before-add-liquidity',
  AfterAddLiquidity = 'after-add-liquidity',
  BeforeRemoveLiquidity = 'before-remove-liquidity',
  AfterRemoveLiquidity = 'after-remove-liquidity',
  BeforeSwap = 'before-swap',
  AfterSwap = 'after-swap',
  BeforeDonate = 'before-donate',
  AfterDonate = 'after-donate',
  BeforeSwapReturnsDelta = 'before-swap-returns-delta',
  AfterSwapReturnsDelta = 'after-swap-returns-delta',
  AfterAddLiquidityReturnsDelta = 'after-add-liquidity-returns-delta',
  AfterRemoveLiquidityReturnsDelta = 'after-remove-liquidity-returns-delta',
}

// The flags are ordered with the dangerous ones on top so they are rendered first
const FLAGS: { [key in HookFlag]: number } = {
  [HookFlag.BeforeRemoveLiquidity]: 1 << 9,
  [HookFlag.AfterRemoveLiquidity]: 1 << 8,
  [HookFlag.BeforeAddLiquidity]: 1 << 11,
  [HookFlag.AfterAddLiquidity]: 1 << 10,
  [HookFlag.BeforeSwap]: 1 << 7,
  [HookFlag.AfterSwap]: 1 << 6,
  [HookFlag.BeforeDonate]: 1 << 5,
  [HookFlag.AfterDonate]: 1 << 4,
  [HookFlag.BeforeSwapReturnsDelta]: 1 << 3,
  [HookFlag.AfterSwapReturnsDelta]: 1 << 2,
  [HookFlag.AfterAddLiquidityReturnsDelta]: 1 << 1,
  [HookFlag.AfterRemoveLiquidityReturnsDelta]: 1 << 0,
}

export function getFlagsFromContractAddress(contractAddress: Address): HookFlag[] {
  // Extract the last 4 hexadecimal digits from the address
  const last4Hex = contractAddress.slice(-4)

  // Convert the hex string to a binary string
  const binaryStr = parseInt(last4Hex, 16).toString(2)

  // Parse the last 12 bits of the binary string
  const relevantBits = binaryStr.slice(-12)

  // Determine which flags are active
  const activeFlags = Object.entries(FLAGS)
    .filter(([, bitPosition]) => (parseInt(relevantBits, 2) & bitPosition) !== 0)
    .map(([flag]) => flag as HookFlag)

  return activeFlags
}

export interface FlagWarning {
  Icon: GeneratedIcon
  name: string
  info: string
  dangerous: boolean
}

export function getFlagWarning(flag: HookFlag, t: AppTFunction): FlagWarning | undefined {
  switch (flag) {
    case HookFlag.BeforeSwap:
    case HookFlag.BeforeSwapReturnsDelta:
      return {
        Icon: SwapCoin,
        name: t('common.swap'),
        info: t('position.hook.swapWarning'),
        dangerous: false,
      }
    case HookFlag.BeforeAddLiquidity:
    case HookFlag.AfterAddLiquidity:
      return {
        Icon: Pools,
        name: t('common.addLiquidity'),
        info: t('position.hook.liquidityWarning'),
        dangerous: false,
      }
    case HookFlag.BeforeRemoveLiquidity:
    case HookFlag.AfterRemoveLiquidity:
      return {
        Icon: Flag,
        name: t('common.warning'),
        info: t('position.hook.removeWarning'),
        dangerous: true,
      }
    case HookFlag.BeforeDonate:
    case HookFlag.AfterDonate:
      return {
        Icon: Flag,
        name: t('common.donate'),
        info: t('position.hook.donateWarning'),
        dangerous: false,
      }
    default:
      return undefined
  }
}

export function mergeFeeTiers(
  feeTiers: Record<number, FeeTierData>,
  feeData: FeeData[],
  formatPercent: (percent: Percent | undefined) => string,
  formattedDynamicFeeTier: string,
): Record<number, FeeTierData> {
  const result: Record<number, FeeTierData> = {}
  for (const feeTier of feeData) {
    result[feeTier.feeAmount] = {
      fee: feeTier,
      formattedFee: isDynamicFeeTier(feeTier)
        ? formattedDynamicFeeTier
        : formatPercent(new Percent(feeTier.feeAmount, 1000000)),
      totalLiquidityUsd: 0,
      percentage: new Percent(0, 100),
      created: false,
      tvl: '0',
    } satisfies FeeTierData
  }

  return { ...result, ...feeTiers }
}

function getDefaultFeeTiersForChain(
  chainId: UniverseChainId | undefined,
  protocolVersion: ProtocolVersion,
): Record<FeeAmount, { feeAmount: FeeAmount; tickSpacing: number }> {
  const feeData = Object.values(defaultFeeTiers)
    .filter((feeTier) => {
      // Only filter by chain support if we're on V3
      if (protocolVersion === ProtocolVersion.V3) {
        return !feeTier.supportedChainIds || (chainId && feeTier.supportedChainIds.includes(chainId))
      }
      return !feeTier.supportedChainIds
    })
    .map((feeTier) => feeTier.feeData)

  return feeData.reduce(
    (acc, fee) => {
      acc[fee.feeAmount] = fee
      return acc
    },
    {} as Record<FeeAmount, { feeAmount: FeeAmount; tickSpacing: number }>,
  )
}

export function getDefaultFeeTiersForChainWithDynamicFeeTier({
  chainId,
  dynamicFeeTierEnabled,
  protocolVersion,
}: {
  chainId?: UniverseChainId
  dynamicFeeTierEnabled: boolean
  protocolVersion: ProtocolVersion
}) {
  const feeTiers = getDefaultFeeTiersForChain(chainId, protocolVersion)
  if (!dynamicFeeTierEnabled) {
    return feeTiers
  }

  return { ...feeTiers, [DYNAMIC_FEE_DATA.feeAmount]: DYNAMIC_FEE_DATA }
}

export function getDefaultFeeTiersWithData({
  chainId,
  feeTierData,
  protocolVersion,
  t,
}: {
  chainId?: UniverseChainId
  feeTierData: Record<number, FeeTierData>
  protocolVersion: ProtocolVersion
  t: AppTFunction
}) {
  const defaultFeeTiersForChain = getDefaultFeeTiersForChain(chainId, protocolVersion)

  const feeTiers = [
    {
      tier: FeeAmount.LOWEST,
      value: defaultFeeTiersForChain[FeeAmount.LOWEST],
      title: t(`fee.bestForVeryStable`),
      selectionPercent: feeTierData[FeeAmount.LOWEST]?.percentage,
      tvl: feeTierData[FeeAmount.LOWEST]?.tvl,
    },
    {
      tier: FeeAmount.LOW_200,
      value: defaultFeeTiersForChain[FeeAmount.LOW_200],
      title: '',
      selectionPercent: feeTierData[FeeAmount.LOW_200]?.percentage,
      tvl: feeTierData[FeeAmount.LOW_200]?.tvl,
    },
    {
      tier: FeeAmount.LOW_300,
      value: defaultFeeTiersForChain[FeeAmount.LOW_300],
      title: '',
      selectionPercent: feeTierData[FeeAmount.LOW_300]?.percentage,
      tvl: feeTierData[FeeAmount.LOW_300]?.tvl,
    },
    {
      tier: FeeAmount.LOW_400,
      value: defaultFeeTiersForChain[FeeAmount.LOW_400],
      title: '',
      selectionPercent: feeTierData[FeeAmount.LOW_400]?.percentage,
      tvl: feeTierData[FeeAmount.LOW_400]?.tvl,
    },
    {
      tier: FeeAmount.LOW,
      value: defaultFeeTiersForChain[FeeAmount.LOW],
      title: t(`fee.bestForStablePairs`),
      selectionPercent: feeTierData[FeeAmount.LOW]?.percentage,
      tvl: feeTierData[FeeAmount.LOW]?.tvl,
    },
    {
      tier: FeeAmount.MEDIUM,
      value: defaultFeeTiersForChain[FeeAmount.MEDIUM],
      title: t(`fee.bestForMost`),
      selectionPercent: feeTierData[FeeAmount.MEDIUM]?.percentage,
      tvl: feeTierData[FeeAmount.MEDIUM]?.tvl,
    },
    {
      tier: FeeAmount.HIGH,
      value: defaultFeeTiersForChain[FeeAmount.HIGH],
      title: t(`fee.bestForExotic`),
      selectionPercent: feeTierData[FeeAmount.HIGH]?.percentage,
      tvl: feeTierData[FeeAmount.HIGH]?.tvl,
    },
  ] as const

  return feeTiers.filter(
    (feeTier) => feeTier.value !== undefined && Object.keys(feeTierData).includes(feeTier.tier.toString()),
  )
}

export function isDynamicFeeTier(feeData: FeeData): feeData is DynamicFeeData {
  return feeData.feeAmount === DYNAMIC_FEE_DATA.feeAmount
}

export function isDynamicFeeTierAmount(
  feeAmount: string | number | undefined,
): feeAmount is DynamicFeeData['feeAmount'] {
  if (!feeAmount) {
    return false
  }

  const feeAmountNumber = Number(feeAmount)
  if (isNaN(feeAmountNumber)) {
    return false
  }

  return feeAmountNumber === DYNAMIC_FEE_DATA.feeAmount
}
