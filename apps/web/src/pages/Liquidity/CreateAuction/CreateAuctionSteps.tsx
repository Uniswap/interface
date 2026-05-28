import { AnimatePresence, Flex, HeightAnimator } from 'ui/src'
import { useCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useUpdateCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useUpdateCreateAuctionTokenColor'
import { AddTokenInfoStep } from '~/pages/Liquidity/CreateAuction/steps/AddTokenInfoStep'
import { ConfigureAuctionStep } from '~/pages/Liquidity/CreateAuction/steps/ConfigureAuctionStep'
import { CustomizePoolStep } from '~/pages/Liquidity/CreateAuction/steps/CustomizePoolStep'
import { ReviewLaunchStep } from '~/pages/Liquidity/CreateAuction/steps/ReviewLaunchStep'
import { CreateAuctionStep } from '~/pages/Liquidity/CreateAuction/types'

export function CreateAuctionSteps() {
  const step = useCreateAuctionStore((state) => state.step)
  useUpdateCreateAuctionTokenColor()

  const isAddTokenInfoStep = step === CreateAuctionStep.ADD_TOKEN_INFO

  return (
    <Flex width="100%" overflow="hidden">
      <AnimatePresence>
        {isAddTokenInfoStep && (
          <Flex animation="125ms" exitStyle={{ opacity: 0 }}>
            <AddTokenInfoStep />
          </Flex>
        )}
      </AnimatePresence>
      {!isAddTokenInfoStep && (
        <HeightAnimator animation="200ms">
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
      )}
    </Flex>
  )
}
