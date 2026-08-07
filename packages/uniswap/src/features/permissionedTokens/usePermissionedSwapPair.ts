import { type CheckPermissionsResult, UNCONNECTED_ADDRESS } from '@universe/api'
import { useCheckPermissionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckPermissionsQuery'
import type { PermissionedTokenStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'
import { sanitizeUrl } from 'utilities/src/format/urls'

// chainId is plain `number` rather than UniverseChainId — the BE API contract is keyed
// on the generated `ChainId` enum (packages/api ChainId.ts) which is a different enum
// type than UniverseChainId; using `number` here lets us pass through without enum casts.
type CurrencyLike = { chainId: number; isNative: boolean; address?: string; symbol?: string }

export type PermissionedSide = 'input' | 'output'

export type PermissionedSwapPairResult = PermissionedTokenStatus & {
  permissionedSide?: PermissionedSide
  permissionedAddress?: string
  permissionedChainId?: number
  permissionedSymbol?: string
  // Per-side permissioned adapter (PA) address from the API. The v4 pools hold the adapter,
  // not the displayed sec-token, so pool discovery/routing must query by these. Populated for
  // EVERY permissioned side, independent of which side pickPermissionedSide surfaces.
  inputAdapterAddress?: string
  outputAdapterAddress?: string
}

const EMPTY_RESULT: PermissionedSwapPairResult = {
  permissionedSide: undefined,
  permissionedAddress: undefined,
  permissionedChainId: undefined,
  permissionedSymbol: undefined,
  inputAdapterAddress: undefined,
  outputAdapterAddress: undefined,
  isPermissioned: false,
  isAllowlisted: true,
  isLoading: false,
  kycUrl: undefined,
  issuer: undefined,
}

export function usePermissionedSwapPair({
  inputCurrency,
  outputCurrency,
  walletAddress,
}: {
  inputCurrency: CurrencyLike | undefined
  outputCurrency: CurrencyLike | undefined
  walletAddress: string | undefined
}): PermissionedSwapPairResult {
  // BE matches on lowercased addresses (on-chain adapter map keyed by lowercase).
  const inputAddress = inputCurrency && !inputCurrency.isNative ? inputCurrency.address?.toLowerCase() : undefined
  const outputAddress = outputCurrency && !outputCurrency.isNative ? outputCurrency.address?.toLowerCase() : undefined

  // Cross-chain pair: API only accepts one chainId per request, so we can't reliably
  // verify both sides. Skip the query and fail open. (queryFn-level error is already
  // logged in useCheckPermissionsQuery.)
  const isCrossChain =
    inputCurrency !== undefined && outputCurrency !== undefined && inputCurrency.chainId !== outputCurrency.chainId
  const chainId = isCrossChain ? undefined : (inputCurrency?.chainId ?? outputCurrency?.chainId)
  const tokens = [inputAddress, outputAddress].filter((t): t is string => !!t)

  const params =
    chainId && tokens.length > 0
      ? {
          walletAddress: (walletAddress ?? UNCONNECTED_ADDRESS).toLowerCase(),
          tokens,
          chainId,
        }
      : undefined

  const { data, isLoading } = useCheckPermissionsQuery({ params })

  if (!data) {
    return { ...EMPTY_RESULT, isLoading }
  }

  const inputResult = inputAddress ? data.results.find((r) => r.token.toLowerCase() === inputAddress) : undefined
  const outputResult = outputAddress ? data.results.find((r) => r.token.toLowerCase() === outputAddress) : undefined

  const inputAdapterAddress = isPermissionedResult(inputResult) ? inputResult.adapterTokenAddress : undefined
  const outputAdapterAddress = isPermissionedResult(outputResult) ? outputResult.adapterTokenAddress : undefined

  const permissioned = pickPermissionedSide({
    inputCurrency,
    outputCurrency,
    inputAddress,
    outputAddress,
    inputResult,
    outputResult,
  })

  if (!permissioned) {
    return { ...EMPTY_RESULT, isLoading }
  }

  return {
    ...resolvePermissionedFields({ permissioned, hasRealWallet: !!walletAddress, isLoading }),
    inputAdapterAddress,
    outputAdapterAddress,
  }
}

type PickPermissionedSideArgs = {
  inputCurrency: CurrencyLike | undefined
  outputCurrency: CurrencyLike | undefined
  inputAddress: string | undefined
  outputAddress: string | undefined
  inputResult: CheckPermissionsResult | undefined
  outputResult: CheckPermissionsResult | undefined
}

// The generated CheckPermissionsResult (from the trading OpenAPI schema) is a flat object with
// `isPermissioned: boolean` as the discriminant; the permissioned-only fields (`isAllowlisted`,
// `issuer`, `kycUrl`) are optional. Narrow the discriminant by intersection (NOT `Extract`, which
// collapses to `never` on a non-union type). The runtime guard `isPermissionedResult` below
// establishes `isPermissioned === true`; the optional fields stay optional and are read defensively.
type PermissionedApiResult = CheckPermissionsResult & { isPermissioned: true }

type PermissionedSelection = {
  side: PermissionedSide
  currency: CurrencyLike | undefined
  address: string | undefined
  apiResult: PermissionedApiResult
}

function isPermissionedResult(r: CheckPermissionsResult | undefined): r is PermissionedApiResult {
  return r?.isPermissioned === true
}

function pickPermissionedSide(args: PickPermissionedSideArgs): PermissionedSelection | undefined {
  const { inputCurrency, outputCurrency, inputAddress, outputAddress, inputResult, outputResult } = args

  // Both permissioned: prefer the side that blocks (isAllowlisted=false) so consumers
  // see the strongest gating signal. Falls back to input when both sides agree
  // (both allowlisted or both blocked) so KYC discovery is deterministic.
  if (isPermissionedResult(inputResult) && isPermissionedResult(outputResult)) {
    if (outputResult.isAllowlisted === false && inputResult.isAllowlisted !== false) {
      return { side: 'output', currency: outputCurrency, address: outputAddress, apiResult: outputResult }
    }
    return { side: 'input', currency: inputCurrency, address: inputAddress, apiResult: inputResult }
  }
  if (isPermissionedResult(inputResult)) {
    return { side: 'input', currency: inputCurrency, address: inputAddress, apiResult: inputResult }
  }
  if (isPermissionedResult(outputResult)) {
    return { side: 'output', currency: outputCurrency, address: outputAddress, apiResult: outputResult }
  }
  return undefined
}

function resolvePermissionedFields({
  permissioned,
  hasRealWallet,
  isLoading,
}: {
  permissioned: PermissionedSelection
  hasRealWallet: boolean
  isLoading: boolean
}): PermissionedSwapPairResult {
  const { apiResult } = permissioned
  const baseFields = {
    permissionedSide: permissioned.side,
    permissionedAddress: permissioned.address,
    permissionedChainId: permissioned.currency?.chainId,
    permissionedSymbol: permissioned.currency?.symbol,
    isPermissioned: true as const,
    isLoading,
    issuer: apiResult.issuer,
  }
  if (!hasRealWallet || apiResult.isAllowlisted) {
    return { ...baseFields, isAllowlisted: true, kycUrl: undefined }
  }
  return {
    ...baseFields,
    isAllowlisted: false,
    kycUrl: sanitizeUrl({ url: apiResult.kycUrl, allowedProtocols: ['https:'], callerName: 'usePermissionedSwapPair' }),
  }
}
