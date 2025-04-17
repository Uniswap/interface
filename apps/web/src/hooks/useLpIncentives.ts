import { useAccount } from 'hooks/useAccount'
import { useLpIncentivesTransactionState } from 'hooks/useLpIncentivesTransactionState'
import { useCallback, useState } from 'react'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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

  const { refetch } = useGetPoolsRewards(
    { walletAddress: account?.address, chainIds: [UniverseChainId.Mainnet], reload: true },
    Boolean(account?.address),
  )

  const onTransactionSuccess = useCallback(() => {
    setIsModalOpen(false)
    setHasCollectedRewards(true)

    // Reload rewards data from the API
    if (account?.address) {
      refetch()
    }
  }, [refetch, account?.address])

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
