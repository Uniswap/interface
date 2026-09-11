import { useQuery } from '@tanstack/react-query'
import type { VerificationOptions } from '@zkpassport/ui/react-button'
import { useMemo } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { assume0xAddress, zeroAddress } from '~/chains'
import { erc1155BalanceOfAbi, erc1155ValidationHookAbi } from '~/features/Toucan/ZkPassport/bidAbi'
import {
  ZKPASSPORT_ATTEST_REGISTRY,
  ZKPASSPORT_CHAIN_NAME,
  ZKPASSPORT_POPUP_URL,
} from '~/features/Toucan/ZkPassport/config'
import { getSessionlessPublicClient } from '~/features/Toucan/ZkPassport/sessionlessClient'

export interface ZkPassportGate {
  /** The auction's validation hook gates on a ZKPassport credential */
  isGated: boolean
  /** Wallet holds a valid, unexpired credential for the hook's policy */
  isEligible: boolean
  /** Still resolving the hook introspection or the balance read */
  isLoading: boolean
  policyId?: bigint
  registry?: `0x${string}`
  /** Options for VerifyWithZKPassportButton; set once the hook's policy is resolved */
  verifyProps?: VerificationOptions
}

/**
 * Resolves whether an auction's validation hook gates bids on a ZKPassport
 * credential, and whether the connected wallet already holds one. Both reads
 * are the stock ERC-1155 surface (hook.erc1155()/tokenId(), then balanceOf),
 * so no vendor API is involved; the popup handles the actual verification and
 * posts back when a credential is minted, which refreshes the balance read.
 *
 * The reads go through the sessionless public client rather than the app's
 * wagmi transport: the wagmi path is UniRPC, which 401s without a gateway
 * session, and a wrong read failure here surfaces as a spurious
 * "Auction not supported" banner on the bid form.
 */
export function useZkPassportGate({
  chainId,
  validationHook,
  walletAddress,
}: {
  chainId?: UniverseChainId
  validationHook?: string
  walletAddress?: string
}): ZkPassportGate {
  const hookAddress = validationHook && validationHook !== zeroAddress ? assume0xAddress(validationHook) : undefined

  const { data: hookViews, isLoading: isHookLoading } = useQuery({
    queryKey: ['zkpassport-hook-introspection', chainId, hookAddress],
    queryFn: async () => {
      if (!chainId || !hookAddress) {
        throw new Error('chainId and hookAddress required')
      }
      const client = getSessionlessPublicClient(chainId)
      const [registry, tokenId] = await Promise.all([
        client.readContract({
          address: hookAddress,
          abi: erc1155ValidationHookAbi,
          functionName: 'erc1155',
        }),
        client.readContract({
          address: hookAddress,
          abi: erc1155ValidationHookAbi,
          functionName: 'tokenId',
        }),
      ])
      return { registry, tokenId }
    },
    enabled: Boolean(hookAddress && chainId),
    staleTime: Infinity,
    retry: 1,
  })

  const knownRegistry = chainId ? ZKPASSPORT_ATTEST_REGISTRY[chainId] : undefined
  const hookRegistry = hookViews?.registry
  const policyId = hookViews?.tokenId
  const isGated = Boolean(
    knownRegistry &&
    hookRegistry &&
    policyId !== undefined &&
    hookRegistry.toLowerCase() === knownRegistry.toLowerCase(),
  )

  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['zkpassport-credential-balance', chainId, hookRegistry, policyId?.toString(), walletAddress],
    queryFn: async () => {
      if (!chainId || !hookRegistry || policyId === undefined || !walletAddress) {
        throw new Error('gate introspection and wallet required')
      }
      return getSessionlessPublicClient(chainId).readContract({
        address: hookRegistry,
        abi: erc1155BalanceOfAbi,
        functionName: 'balanceOf',
        args: [assume0xAddress(walletAddress), policyId],
      })
    },
    enabled: Boolean(isGated && chainId && walletAddress && policyId !== undefined),
  })

  const verifyProps = useMemo((): VerificationOptions | undefined => {
    const chainName = chainId ? ZKPASSPORT_CHAIN_NAME[chainId] : undefined
    if (!chainId || !chainName || !hookRegistry || policyId === undefined) {
      return undefined
    }
    return {
      mintCredential: {
        chain: chainName as NonNullable<VerificationOptions['mintCredential']>['chain'],
        onchainPolicyId: `0x${policyId.toString(16).padStart(64, '0')}`,
      },
      popupUrl: ZKPASSPORT_POPUP_URL,
      windowMode: 'tab',
      // The mobile app roots proofs in the mainnet registries unless dev mode
      // is requested, which switches to the testnet registries — so testnet
      // chains only verify dev-mode proofs.
      devMode: isTestnetChain(chainId),
      // The recipient account is chosen inside the popup; the gate only
      // unlocks if it matches the wallet connected here, so re-check the
      // credential balance on any outcome, including an early close.
      onSuccess: () => {
        refetchBalance().catch(() => undefined)
      },
      onClose: () => {
        refetchBalance().catch(() => undefined)
      },
    }
  }, [chainId, hookRegistry, policyId, refetchBalance])

  return useMemo(
    () => ({
      isGated,
      isEligible: isGated && (balance ?? 0n) > 0n,
      isLoading: Boolean(hookAddress) && (isHookLoading || (isGated && Boolean(walletAddress) && isBalanceLoading)),
      policyId: isGated ? policyId : undefined,
      registry: isGated ? hookRegistry : undefined,
      verifyProps,
    }),
    [
      isGated,
      balance,
      hookAddress,
      isHookLoading,
      walletAddress,
      isBalanceLoading,
      policyId,
      hookRegistry,
      verifyProps,
    ],
  )
}
