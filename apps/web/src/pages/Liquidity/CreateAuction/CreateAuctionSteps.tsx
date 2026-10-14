import { Flex } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { Presence } from '@universe/mycelium/presence'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
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
    // `clip` rather than `hidden` (here and on the HeightAnimator): a hidden box is still a scroll container,
    // so focusing a control whose focus ring pokes past the edge (Switch, chevrons) scrolls the step sideways.
    <Flex width="100%" className="overflow-clip">
      <Presence>
        {isAddTokenInfoStep && (
          // Presence resolves refs on direct children only, so the Flex must wrap Trace (a bare context provider)
          <Flex className="data-exiting:animate-spore-exit-fade-out opacity-[1]">
            <Trace logImpression page={InterfacePageName.LaunchAuctionTokenDetails}>
              <AddTokenInfoStep />
            </Trace>
          </Flex>
        )}
      </Presence>
      {!isAddTokenInfoStep && (
        <HeightAnimator animation="200ms" styleProps={{ '$platform-web': { overflowX: 'clip', overflowY: 'clip' } }}>
          <Presence>
            {step === CreateAuctionStep.CONFIGURE_AUCTION && (
              <Flex className="data-exiting:animate-spore-exit-fade-out opacity-[1]">
                <Trace logImpression page={InterfacePageName.LaunchAuctionAuctionDetails}>
                  <ConfigureAuctionStep />
                </Trace>
              </Flex>
            )}
          </Presence>
          <Presence>
            {step === CreateAuctionStep.CUSTOMIZE_POOL && (
              <Flex className="data-exiting:animate-spore-exit-fade-out opacity-[1]">
                <Trace logImpression page={InterfacePageName.LaunchAuctionPoolDetails}>
                  <CustomizePoolStep />
                </Trace>
              </Flex>
            )}
          </Presence>
          <Presence>
            {step === CreateAuctionStep.REVIEW_LAUNCH && (
              <Flex className="data-exiting:animate-spore-exit-fade-out opacity-[1]">
                <Trace logImpression page={InterfacePageName.LaunchAuctionReview}>
                  <ReviewLaunchStep />
                </Trace>
              </Flex>
            )}
          </Presence>
        </HeightAnimator>
      )}
    </Flex>
  )
}
