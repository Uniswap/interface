import { useAccount } from 'hooks/useAccount'
import { useLpIncentivesTransactionState } from 'hooks/useLpIncentivesTransactionState'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback, useState } from 'react'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// This is used as check to avoid showing user rewards they just claimed
// This date/amount will be saved on successful rewards claim, and checked against when rewards refetches on page refresh
export const lpIncentivesLastClaimedAtom = atomWithStorage<{ timestamp: number; amount: string } | null>(
  'lpIncentivesLastClaimed',
  null,
)

interface UseLpIncentivesResult {
  isPendingTransaction: boolean
  isModalOpen: boolean
  tokenRewards: string
  openModal: () => void
  closeModal: () => void
  setTokenRewards: (value: string) => void
  onTransactionSuccess: () => void
  hasCollectedRewards: boolean
}

export function useLpIncentives(): UseLpIncentivesResult {
  const isPendingTransaction = useLpIncentivesTransactionState()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tokenRewards, setTokenRewards] = useState('0')
  const [hasCollectedRewards, setHasCollectedRewards] = useState(false)
  const account = useAccount()
  const [, setLastClaimed] = useAtom(lpIncentivesLastClaimedAtom)

  // Refetch rewards on transaction success with "reload" true to bust the Merkl cache for users wallet address
  const { refetch } = useGetPoolsRewards(
    { walletAddress: account.address, chainIds: [UniverseChainId.Mainnet], reload: true },
    false,
  )

  const onTransactionSuccess = useCallback(async () => {
    setIsModalOpen(false)
    setHasCollectedRewards(true)

    // Reload rewards data from the API
    if (account.address) {
      try {
        const { data: rewardsData } = await refetch()

        // If the refetched data still shows rewards, store it temporarily
        // This handles the delay between tx success and backend update
        const rewardsAmount = rewardsData?.totalUnclaimedAmountUni
        if (rewardsAmount && rewardsAmount !== '0') {
          setLastClaimed({ timestamp: Date.now(), amount: rewardsAmount })
        } else {
          // If refetch shows 0 rewards, clear the temporary storage
          setLastClaimed(null)
        }
      } catch (_error) {
        setLastClaimed(null)
      }
    }
  }, [refetch, account.address, setLastClaimed])

  const openModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  return {
    isPendingTransaction,
    isModalOpen,
    tokenRewards,
    openModal,
    closeModal,
    setTokenRewards,
    onTransactionSuccess,
    hasCollectedRewards,
  }
}
