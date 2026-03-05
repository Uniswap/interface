import { AnimatePresence, Flex, HeightAnimator } from 'ui/src'
import { Container } from '~/components/Liquidity/Create/Container'
import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { AddTokenInfoStep } from '~/pages/Liquidity/CreateAuction/steps/AddTokenInfoStep'
import { ConfigureAuctionStep } from '~/pages/Liquidity/CreateAuction/steps/ConfigureAuctionStep'
import { CustomizePoolStep } from '~/pages/Liquidity/CreateAuction/steps/CustomizePoolStep'
import { ReviewLaunchStep } from '~/pages/Liquidity/CreateAuction/steps/ReviewLaunchStep'
import { CreateAuctionStep } from '~/pages/Liquidity/CreateAuction/types'

export function CreateAuctionSteps() {
  const step = useCreateAuctionStore((state) => state.step)

  return (
    <Container>
      <HeightAnimator animation="200ms">
        <AnimatePresence>
          {step === CreateAuctionStep.ADD_TOKEN_INFO && (
            <Flex animation="125ms" exitStyle={{ opacity: 0 }}>
              <AddTokenInfoStep />
            </Flex>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {step === CreateAuctionStep.CONFIGURE_AUCTION && (
            <Flex animation="125ms" exitStyle={{ opacity: 0 }}>
              <ConfigureAuctionStep />
            </Flex>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {step === CreateAuctionStep.CUSTOMIZE_POOL && (
            <Flex animation="125ms" exitStyle={{ opacity: 0 }}>
              <CustomizePoolStep />
            </Flex>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {step === CreateAuctionStep.REVIEW_LAUNCH && (
            <Flex animation="125ms" exitStyle={{ opacity: 0 }}>
              <ReviewLaunchStep />
            </Flex>
          )}
        </AnimatePresence>
      </HeightAnimator>
    </Container>
  )
}
