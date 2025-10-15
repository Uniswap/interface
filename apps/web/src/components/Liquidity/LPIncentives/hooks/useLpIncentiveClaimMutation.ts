import { useMutation } from '@tanstack/react-query'
import { Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useLpIncentivesClaim } from 'hooks/useLpIncentivesClaim'
import { useLpIncentivesClaimData } from 'hooks/useLpIncentivesClaimData'
import { ChainId, Distributor } from 'uniswap/src/data/tradingApi/__generated__'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

interface UseLpIncentiveClaimMutationProps {
  token: Token
  onSuccess?: () => void
  onClose?: () => void
  onError?: (error: unknown) => void
}

export function useLpIncentiveClaimMutation({ token, onSuccess, onClose, onError }: UseLpIncentiveClaimMutationProps) {
  const account = useAccount()
  const { address, chainId } = account
  const lpIncentivesClaim = useLpIncentivesClaim()
  const lpIncentivesClaimData = useLpIncentivesClaimData()
  return useMutation({
    mutationFn: async () => {
      if (!address || !chainId) {
        throw new Error('No wallet address available')
      }
      const { data, error } = await lpIncentivesClaimData({
        walletAddress: address,
        chainId: token.chainId,
        tokens: [token.address],
        distributor: Distributor.MERKL,
      })
      if (error) {
        sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsErrorThrown, {
          error: error.message,
        })
        throw error
      }
      if (!data) {
        throw new Error('No claim data available')
      }
      return new Promise<void>((resolve, reject) => {
        lpIncentivesClaim({
          account: {
            accountType: AccountType.SignerMnemonic,
            address,
            platform: Platform.EVM,
            walletMeta: { id: 'test-id', name: 'test', icon: 'test' }, // hmm
          },
          claimData: data,
          chainId: chainId as unknown as ChainId,
          tokenAddress: token.address,
          onSuccess: () => {
            resolve()
          },
          onFailure: (error) => {
            reject(error)
          },
          setCurrentStep: () => {}, // Optional: Add step tracking if needed
        })
      })
    },
    onSuccess: () => {
      onSuccess?.()
      onClose?.()
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}
