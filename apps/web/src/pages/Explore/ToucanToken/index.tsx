import { AuctionHeader } from 'components/Toucan/Auction/AuctionHeader'
import { AuctionStats } from 'components/Toucan/Auction/AuctionStats/AuctionStats'
import { BidActivities } from 'components/Toucan/Auction/BidActivities/BidActivities'
import { BidDistributionChart } from 'components/Toucan/Auction/BidDistributionChart/BidDistributionChart'
import { BidFormSection } from 'components/Toucan/Auction/BidForm'
import { AuctionStoreProvider } from 'components/Toucan/Auction/store/AuctionStoreContextProvider'
import { ToucanContainer } from 'components/Toucan/Shared/ToucanContainer'
import { ToucanIntroModal } from 'components/Toucan/ToucanIntroModal'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { Flex } from 'ui/src'
import { setHasSeenToucanIntroModal } from 'uniswap/src/features/behaviorHistory/slice'

export default function ToucanToken() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dispatch = useAppDispatch()
  const hasSeenToucanIntroModal = useAppSelector((state) => state.uniswapBehaviorHistory.hasSeenToucanIntroModal)

  useEffect(() => {
    setIsModalOpen(!hasSeenToucanIntroModal)
  }, [hasSeenToucanIntroModal])

  const handleCloseModal = () => {
    dispatch(setHasSeenToucanIntroModal(true))
    setIsModalOpen(false)
  }

  return (
    <AuctionStoreProvider>
      <ToucanIntroModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <ToucanContainer mt={48}>
        <AuctionHeader />
        <Flex
          row
          width="100%"
          mt="$spacing24"
          gap="$spacing32"
          borderWidth="$spacing1"
          borderRadius="$rounded20"
          borderColor="$surface3"
          padding="$spacing24"
          minHeight={560}
        >
          <BidDistributionChart />
          <BidFormSection />
        </Flex>
        <Flex
          row
          width="100%"
          gap="$spacing48"
          my="$spacing48"
          mx="$spacing4"
          $lg={{ flexDirection: 'column', gap: '$spacing32', mx: 0 }}
        >
          <BidActivities />
          <AuctionStats />
        </Flex>
      </ToucanContainer>
    </AuctionStoreProvider>
  )
}
