import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { useBidsListData } from '~/components/Toucan/Auction/hooks/useBidsListData'
import { useDurationRemaining } from '~/components/Toucan/Auction/hooks/useDurationRemaining'
import { AuctionBidStatus } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'

export function useWithdrawButtonState({
  isGraduated,
  claimBlock,
  currentBlockNumber,
  chainId,
}: {
  isGraduated: boolean
  claimBlock?: string
  currentBlockNumber?: number
  chainId?: EVMUniverseChainId
}): {
  label: string
  isDisabled: boolean
  disabledTooltip: string | undefined
  allBidsExited: boolean
} {
  const { t } = useTranslation()
  const { bidItems, hasErrors } = useBidsListData()
  const pendingWithdrawalBidIds = useAuctionStore((state) => state.pendingWithdrawalBidIds)
  const awaitingConfirmationBidIds = useAuctionStore((state) => state.awaitingConfirmationBidIds)

  // Calculate duration remaining until claim block
  const durationRemaining = useDurationRemaining(chainId, claimBlock ? Number(claimBlock) : undefined)

  // Check if we're in the withdrawal waiting period (auction ended but claim not yet available)
  const isClaimPeriodNotOpen = useMemo(() => {
    if (!claimBlock || !currentBlockNumber) {
      return false
    }
    return currentBlockNumber < Number(claimBlock)
  }, [claimBlock, currentBlockNumber])

  // Check if ANY withdrawal is in progress (for the main withdraw button)
  const isWithdrawalPending = pendingWithdrawalBidIds.size > 0
  const isAwaitingWithdrawalConfirmation = awaitingConfirmationBidIds.size > 0

  const hasAuctionTokensToClaim = useMemo(
    () =>
      isGraduated && bidItems.some((item) => item.bid.status !== AuctionBidStatus.Claimed && item.bid.amount !== '0'),
    [bidItems, isGraduated],
  )

  // Check if all bids have been exited (for failed auctions)
  const allBidsExited = useMemo(
    () => bidItems.length > 0 && bidItems.every((item) => item.bid.status === AuctionBidStatus.Exited),
    [bidItems],
  )

  // Check if all bids have been claimed (for graduated auctions)
  // Treat exited bids with 0 token amount as resolved (nothing to claim).
  const allBidsClaimed = useMemo(
    () =>
      bidItems.length > 0 &&
      bidItems.every(
        (item) =>
          item.bid.status === AuctionBidStatus.Claimed ||
          (item.bid.status === AuctionBidStatus.Exited && item.bid.amount === '0'),
      ),
    [bidItems],
  )

  const label = useMemo(() => {
    // Check claim period first (only for graduated auctions)
    if (isGraduated && isClaimPeriodNotOpen && durationRemaining) {
      return t('toucan.auction.withdrawAvailableIn', {
        time: durationRemaining,
      })
    }
    if (isWithdrawalPending || isAwaitingWithdrawalConfirmation) {
      return hasAuctionTokensToClaim
        ? t('toucan.auction.withdrawTokens.withdrawingTokens')
        : t('toucan.auction.withdrawTokens.withdrawingFunds')
    }
    if (isGraduated) {
      if (allBidsClaimed) {
        return t('toucan.auction.withdrawTokens.tokensWithdrawn')
      }
      return t('toucan.auction.withdrawTokens')
    }

    // Failed auction - funds withdrawal
    if (allBidsExited) {
      return t('toucan.auction.withdrawTokens.fundsWithdrawn')
    }
    return t('toucan.auction.withdrawFunds')
  }, [
    allBidsClaimed,
    allBidsExited,
    durationRemaining,
    hasAuctionTokensToClaim,
    isAwaitingWithdrawalConfirmation,
    isClaimPeriodNotOpen,
    isGraduated,
    isWithdrawalPending,
    t,
  ])

  const isDisabled = useMemo(() => {
    // Check claim period first (only for graduated auctions)
    if (isGraduated && isClaimPeriodNotOpen) {
      return true
    }
    if (hasErrors && bidItems.length === 0) {
      return true
    }
    if (isWithdrawalPending || isAwaitingWithdrawalConfirmation) {
      return true
    }

    if (isGraduated) {
      return allBidsClaimed
    }

    // Failed auction - disable if all funds already withdrawn
    return allBidsExited
  }, [
    allBidsClaimed,
    allBidsExited,
    bidItems.length,
    hasErrors,
    isAwaitingWithdrawalConfirmation,
    isClaimPeriodNotOpen,
    isGraduated,
    isWithdrawalPending,
  ])

  const disabledTooltip = useMemo(() => {
    if (hasErrors && bidItems.length === 0) {
      return t('common.error.general')
    }
    return undefined
  }, [hasErrors, bidItems.length, t])

  return { label, isDisabled, disabledTooltip, allBidsExited }
}
