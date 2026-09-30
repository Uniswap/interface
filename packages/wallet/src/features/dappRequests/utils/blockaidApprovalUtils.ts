import { type BlockaidScanTransactionResponse } from '@universe/api'
import { areEvmAddressesEqual, UniverseChainId } from '@universe/chains'
import { isValidHexString } from '@universe/encoding'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { decodeFunctionData } from 'viem'
import {
  type DappRequestCall,
  TransactionApprovalAction,
  TransactionApprovalScope,
  type TransactionAsset,
  type TransactionSection,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'
import {
  formatApprovalAmount,
  isUnlimitedApproval,
  parseApprovalQuantity,
} from 'wallet/src/features/dappRequests/utils/blockaidApprovalAmounts'
import { getAssetAddress } from 'wallet/src/features/dappRequests/utils/blockaidAssetUtils'

export const UNLIMITED_APPROVAL_AMOUNT = 'UNLIMITED'

const NFT_APPROVAL_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
] as const

interface NftApprovalIntent {
  contractAddress: string
  spenderAddress: string
  scope: TransactionApprovalScope
  action: TransactionApprovalAction.Grant | TransactionApprovalAction.Revoke
  callIndex: number
  tokenId?: string
}

// A call whose calldata we couldn't decode as an NFT approval. contractAddress is the call target
// when known (a decode failure still has a `to`); undefined only when the call omits `to` entirely.
interface OpaqueCall {
  callIndex: number
  contractAddress?: string
}

interface ParsedNftApprovalCalls {
  intents: NftApprovalIntent[]
  opaqueCalls: OpaqueCall[]
}

type Exposures = NonNullable<
  Extract<BlockaidScanTransactionResponse['simulation'], { status: 'Success' }>['account_summary']
>['exposures']
type NftExposure = Exposures[number]
type NftSpenderData = NftExposure['spenders'][string]

function parseNftApprovalIntents(calls: readonly DappRequestCall[]): ParsedNftApprovalCalls {
  const intents: NftApprovalIntent[] = []
  const opaqueCalls: OpaqueCall[] = []

  calls.forEach((call, callIndex) => {
    if (!call.to || !call.data || !isValidHexString(call.data)) {
      opaqueCalls.push({ callIndex, contractAddress: call.to })
      return
    }

    try {
      const decoded = decodeFunctionData({ abi: NFT_APPROVAL_ABI, data: call.data })
      if (decoded.functionName === 'approve') {
        const [spenderAddress, tokenId] = decoded.args
        intents.push({
          contractAddress: call.to,
          spenderAddress,
          scope: TransactionApprovalScope.SingleToken,
          action: areEvmAddressesEqual(spenderAddress, ZERO_ADDRESS)
            ? TransactionApprovalAction.Revoke
            : TransactionApprovalAction.Grant,
          callIndex,
          tokenId: tokenId.toString(),
        })
        return
      }

      const [spenderAddress, approved] = decoded.args
      intents.push({
        contractAddress: call.to,
        spenderAddress,
        scope: TransactionApprovalScope.Collection,
        action: approved ? TransactionApprovalAction.Grant : TransactionApprovalAction.Revoke,
        callIndex,
      })
    } catch {
      opaqueCalls.push({ callIndex, contractAddress: call.to })
    }
  })

  return { intents, opaqueCalls }
}

interface FindNftApprovalIntentParams {
  intents: readonly NftApprovalIntent[]
  contractAddress: string
  spenderAddress: string
}

function normalizeNftTokenId(tokenId: string | undefined): string | undefined {
  if (!tokenId) {
    return tokenId
  }

  try {
    return BigInt(tokenId).toString()
  } catch {
    return tokenId
  }
}

function areNftTokenIdsEqual(left: string | undefined, right: string | undefined): boolean {
  return normalizeNftTokenId(left) === normalizeNftTokenId(right)
}

function findTokenApprovalIntent({
  intents,
  contractAddress,
  spenderAddress,
  tokenId,
}: FindNftApprovalIntentParams & {
  tokenId?: string
}): NftApprovalIntent | undefined {
  const candidates = intents.filter(
    (intent) =>
      areEvmAddressesEqual(intent.contractAddress, contractAddress) &&
      intent.scope === TransactionApprovalScope.SingleToken &&
      (tokenId === undefined || areNftTokenIdsEqual(intent.tokenId, tokenId)),
  )

  // ERC721 has a single approved address per token. When Blockaid omitted the token id, only infer
  // it when this spender maps to one unique token in the calldata; otherwise keep the UI neutral.
  const inferredTokenIds = tokenId
    ? [tokenId]
    : [
        ...new Set(
          candidates
            .filter((intent) => areEvmAddressesEqual(intent.spenderAddress, spenderAddress))
            .map((intent) => normalizeNftTokenId(intent.tokenId))
            .filter((candidateTokenId): candidateTokenId is string => candidateTokenId !== undefined),
        ),
      ]

  if (inferredTokenIds.length !== 1) {
    return undefined
  }

  const matchingTokenCandidates = candidates.filter((intent) =>
    areNftTokenIdsEqual(intent.tokenId, inferredTokenIds[0]),
  )
  const finalIntent = matchingTokenCandidates[matchingTokenCandidates.length - 1]
  if (!finalIntent) {
    return undefined
  }

  if (areEvmAddressesEqual(finalIntent.spenderAddress, spenderAddress)) {
    return finalIntent
  }

  // A revoke names the zero address rather than the operator losing access, so it can still
  // describe this spender — but only when the calldata mentions the spender at all. Otherwise a
  // spender Blockaid reports on its own would inherit a revoke label for a permission it gains.
  const isSpenderInCalldata = matchingTokenCandidates.some((intent) =>
    areEvmAddressesEqual(intent.spenderAddress, spenderAddress),
  )
  return finalIntent.action === TransactionApprovalAction.Revoke && isSpenderInCalldata ? finalIntent : undefined
}

function findCollectionApprovalIntent({
  intents,
  contractAddress,
  spenderAddress,
}: FindNftApprovalIntentParams): NftApprovalIntent | undefined {
  // Approval-for-all state is independent per operator, so an intent for a different operator says
  // nothing about this one. Walk backwards so a batch that toggles the same operator reflects the
  // state left by the final call.
  for (let index = intents.length - 1; index >= 0; index--) {
    const candidate = intents[index]
    if (
      candidate?.scope === TransactionApprovalScope.Collection &&
      areEvmAddressesEqual(candidate.contractAddress, contractAddress) &&
      areEvmAddressesEqual(candidate.spenderAddress, spenderAddress)
    ) {
      return candidate
    }
  }

  return undefined
}

interface ResolveNftApprovalActionParams {
  intent: NftApprovalIntent | undefined
  opaqueCalls: readonly OpaqueCall[]
}

function resolveNftApprovalAction({ intent, opaqueCalls }: ResolveNftApprovalActionParams): TransactionApprovalAction {
  if (!intent) {
    return TransactionApprovalAction.Change
  }

  // A calldata-derived direction is only muddied by a LATER call that could re-toggle THIS approval.
  // Same-contract decoded toggles are already reflected because the final intent for this
  // operator/token is chosen. The one local uncertainty is a later OPAQUE call on the SAME contract —
  // we can't tell what it did — so only that neutralizes the calldata-derived label here. A call to a
  // different contract could still proxy back into the NFT contract or change this approval, so the
  // caller reconciles this result with Blockaid's full-batch post-simulation state before publishing
  // a direction.
  const hasUncertainLaterCall = opaqueCalls.some(
    (opaqueCall) =>
      opaqueCall.callIndex > intent.callIndex &&
      opaqueCall.contractAddress !== undefined &&
      areEvmAddressesEqual(opaqueCall.contractAddress, intent.contractAddress),
  )

  return hasUncertainLaterCall ? TransactionApprovalAction.Change : intent.action
}

interface BuildNftApprovalAssetsParams {
  asset: NftExposure['asset']
  spenderData: NftSpenderData
  baseAsset: TransactionAsset
  spenderAddress: string
  intents: readonly NftApprovalIntent[]
  opaqueCalls: readonly OpaqueCall[]
}

function buildNftApprovalAssets({
  asset,
  spenderData,
  baseAsset,
  spenderAddress,
  intents,
  opaqueCalls,
}: BuildNftApprovalAssetsParams): TransactionAsset[] {
  const approvalAssets: TransactionAsset[] = []
  const collectionIntent = findCollectionApprovalIntent({
    intents,
    contractAddress: baseAsset.address,
    spenderAddress,
  })
  // ERC-1155 only exposes operator-wide setApprovalForAll; it has no token-specific approve method.
  const hasExplicitCollectionScope = asset.type === 'ERC1155' || spenderData.is_approved_for_all === true
  // `arbitrary_collection_token` means the simulated token id was unpredictable, not that the
  // permission covers the collection. Only infer collection scope from matching calldata.
  const hasInferredCollectionScope = collectionIntent !== undefined
  const hasCollectionScope = hasExplicitCollectionScope || hasInferredCollectionScope
  const resolvedCollectionAction = !hasCollectionScope
    ? undefined
    : resolveNftApprovalAction({
        intent: collectionIntent,
        opaqueCalls,
      })
  // Selector decoding proves intent, not effect: a non-standard `setApprovalForAll(spender, false)`, a
  // proxy, or an internal call can grant while the calldata reads as a revoke. An explicit simulated
  // `true` is therefore authoritative evidence of the risky grant. A revoke label likewise requires
  // an explicit simulated `false`; an ABSENT value is not proof, so fall back to neutral Change rather
  // than reassure the user with a revoke a hidden grant could be masquerading as.
  const collectionAction =
    spenderData.is_approved_for_all === true
      ? TransactionApprovalAction.Grant
      : resolvedCollectionAction === TransactionApprovalAction.Revoke && spenderData.is_approved_for_all !== false
        ? TransactionApprovalAction.Change
        : resolvedCollectionAction
  if (collectionAction) {
    approvalAssets.push({
      ...baseAsset,
      approvalScope: TransactionApprovalScope.Collection,
      approvalAction: collectionAction,
    })
  }

  // An effective collection grant subsumes token-level exposure. A revoke or unknown collection
  // change does not: a simultaneous token grant must remain visible.
  if (collectionAction === TransactionApprovalAction.Grant) {
    return approvalAssets
  }

  const hasExplicitTokenExposureData = spenderData.exposure !== undefined
  const allTokenExposures = spenderData.exposure ?? []

  if (asset.type === 'ERC1155') {
    if (allTokenExposures.length > 0) {
      // ERC-1155 has no token-specific approval method. Preserve additional simulated exposure
      // without attributing a token id or a grant/revoke direction that calldata cannot prove.
      approvalAssets.push({
        ...baseAsset,
        approvalScope: TransactionApprovalScope.SingleToken,
        approvalAction: TransactionApprovalAction.Change,
      })
    }
    return approvalAssets
  }

  const tokenExposures = allTokenExposures.filter(
    (item): item is typeof item & { token_id: string } =>
      Boolean(item.token_id) && item.arbitrary_collection_token !== true,
  )
  const ambiguousTokenExposure = allTokenExposures.find(
    (item) => !item.token_id || item.arbitrary_collection_token === true,
  )

  const tokenApprovalAssets = tokenExposures.map((tokenExposure): TransactionAsset => {
    const tokenId = normalizeNftTokenId(tokenExposure.token_id) ?? tokenExposure.token_id
    const intent = findTokenApprovalIntent({
      intents,
      contractAddress: baseAsset.address,
      spenderAddress,
      tokenId,
    })

    // This token id is in the simulation's post-transaction exposure list, i.e. the spender is exposed
    // to it after execution. That corroborates a decoded grant even if later calldata is opaque. A
    // calldata-derived revoke contradicts the exposure, so stay neutral rather than label it Revoke.
    const resolvedTokenAction = resolveNftApprovalAction({ intent, opaqueCalls })
    const tokenAction =
      intent?.action === TransactionApprovalAction.Grant
        ? TransactionApprovalAction.Grant
        : resolvedTokenAction === TransactionApprovalAction.Revoke
          ? TransactionApprovalAction.Change
          : resolvedTokenAction

    return {
      ...baseAsset,
      logoUrl: tokenExposure.logo_url ?? baseAsset.logoUrl,
      tokenId,
      approvalScope: TransactionApprovalScope.SingleToken,
      approvalAction: tokenAction,
    }
  })
  approvalAssets.push(...tokenApprovalAssets)

  if (tokenApprovalAssets.length === 0) {
    const fallbackIntent = findTokenApprovalIntent({
      intents,
      contractAddress: baseAsset.address,
      spenderAddress,
    })

    // A provider-supplied spender row is itself exposure evidence. Preserve it as a neutral row
    // when neither the response nor calldata identifies a more specific token or collection scope.
    if (fallbackIntent || ambiguousTokenExposure || approvalAssets.length === 0) {
      // A revoke requires an explicit post-simulation exposure array. Missing provider data cannot
      // corroborate calldata direction; an ambiguous entry actively contradicts the revoke. Stay
      // neutral in either case rather than reassuring with a revoke the simulation did not confirm.
      const resolvedFallbackAction = resolveNftApprovalAction({ intent: fallbackIntent, opaqueCalls })
      const fallbackAction =
        resolvedFallbackAction === TransactionApprovalAction.Revoke &&
        (!hasExplicitTokenExposureData || ambiguousTokenExposure)
          ? TransactionApprovalAction.Change
          : resolvedFallbackAction
      approvalAssets.push({
        ...baseAsset,
        logoUrl: ambiguousTokenExposure?.logo_url ?? baseAsset.logoUrl,
        tokenId: fallbackIntent?.tokenId,
        approvalScope: TransactionApprovalScope.SingleToken,
        approvalAction: fallbackAction,
      })
    }

    return approvalAssets
  }

  if (ambiguousTokenExposure) {
    // Preserve evidence that an additional token is exposed without trusting a token id that
    // Blockaid explicitly marked as unpredictable.
    approvalAssets.push({
      ...baseAsset,
      logoUrl: ambiguousTokenExposure.logo_url ?? baseAsset.logoUrl,
      approvalScope: TransactionApprovalScope.SingleToken,
      approvalAction: TransactionApprovalAction.Change,
    })
  }

  return approvalAssets
}

interface ParseApprovalsParams {
  exposures: Exposures
  chainId: UniverseChainId
  calls?: readonly DappRequestCall[]
}

/** Parses ERC20 and NFT approval exposures from a successful Blockaid simulation. */
export function parseApprovals({ exposures, chainId, calls = [] }: ParseApprovalsParams): TransactionSection | null {
  const exposureAssets: TransactionAsset[] = []
  const { intents: nftApprovalIntents, opaqueCalls } = parseNftApprovalIntents(calls)

  exposures.forEach((exposure) => {
    const asset = exposure.asset
    Object.entries(exposure.spenders).forEach(([spenderAddress, spenderData]) => {
      const baseAsset: TransactionAsset = {
        type: asset.type,
        symbol: asset.symbol,
        name: asset.type === 'ERC20' ? asset.name || asset.symbol : asset.name,
        usdValue: undefined,
        logoUrl: asset.logo_url,
        address: getAssetAddress(asset),
        chainId,
        spenderAddress,
      }

      if (asset.type === 'ERC721' || asset.type === 'ERC1155') {
        exposureAssets.push(
          ...buildNftApprovalAssets({
            asset,
            spenderData,
            baseAsset,
            spenderAddress,
            intents: nftApprovalIntents,
            opaqueCalls,
          }),
        )
        return
      }

      // NONERC metadata does not identify the approval interface or token scale. Preserve the
      // provider's spender exposure without inferring an amount, scope, or grant/revoke direction.
      if (asset.type === 'NONERC') {
        exposureAssets.push({
          ...baseAsset,
          approvalAction: TransactionApprovalAction.Change,
        })
        return
      }

      const approvalQuantity = parseApprovalQuantity(spenderData.approval)
      // The API schema requires decimals; keep direct/internal callers fail-neutral rather than
      // guessing a token scale if malformed data still reaches this defense-in-depth boundary.
      const decimals =
        Number.isSafeInteger(asset.decimals) && asset.decimals >= 0 && asset.decimals <= 255
          ? asset.decimals
          : undefined
      const unlimited = isUnlimitedApproval({
        quantity: approvalQuantity,
        decimals,
      })
      const amount = unlimited
        ? UNLIMITED_APPROVAL_AMOUNT
        : decimals !== undefined
          ? formatApprovalAmount(approvalQuantity, decimals)
          : undefined

      exposureAssets.push({
        ...baseAsset,
        amount,
        approvalAction:
          approvalQuantity === undefined
            ? TransactionApprovalAction.Change
            : approvalQuantity === 0n
              ? TransactionApprovalAction.Revoke
              : TransactionApprovalAction.Grant,
      })
    })
  })

  return exposureAssets.length > 0
    ? {
        type: TransactionSectionType.Approving,
        assets: exposureAssets,
      }
    : null
}
