import { Anchor, Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { X } from '@universe/mycelium/icons/X'
import { opacifyRaw } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { colors } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { AuctionLaunchMethod, getAuctionLaunchMethodCopy } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { AuctionLaunchMethodIcon } from '~/features/Toucan/Shared/AuctionLaunchMethodIcon'
import { usePoolsBrandGreen } from '~/hooks/usePoolsBrandGreen'

const EXPLORE_AUCTIONS_PATH = '/explore/auctions'

/** Explains a launch method (Custom auction / Crowd Launch / Instant Launch). Shared by the token and auction detail pages. */
export function LaunchMethodExplainerModal({
  method,
  isOpen,
  onClose,
}: {
  method: AuctionLaunchMethod
  isOpen: boolean
  onClose: () => void
}): JSX.Element {
  const poolsBrandGreen = usePoolsBrandGreen()
  const tileBackground: Record<AuctionLaunchMethod, string> = {
    [AuctionLaunchMethod.Custom]: '$surface3',
    [AuctionLaunchMethod.Crowd]: opacifyRaw(10, poolsBrandGreen),
    [AuctionLaunchMethod.Instant]: opacifyRaw(10, colors.cyanBase),
  }
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { explainerTitle, explainerDescription } = getAuctionLaunchMethodCopy({ method, t })

  const onExploreAuctions = (): void => {
    onClose()
    navigate(EXPLORE_AUCTIONS_PATH)
  }

  return (
    <Modal isModalOpen={isOpen} name={ModalName.LaunchMethodExplainer} onClose={onClose} maxWidth={420} padding={0}>
      <Flex
        position="relative"
        backgroundColor="$surface1"
        p="$spacing24"
        gap="$spacing24"
        testID={TestID.LaunchMethodExplainerModal}
      >
        <TouchableArea
          position="absolute"
          top="$spacing16"
          right="$spacing16"
          p="$spacing8"
          borderRadius="$rounded8"
          zIndex={2}
          onPress={onClose}
        >
          <X size="$icon.24" color="$neutral2" />
        </TouchableArea>

        <Flex gap="$spacing16" alignItems="center" pt="$spacing16">
          <Flex
            width={48}
            height={48}
            borderRadius="$rounded16"
            backgroundColor={tileBackground[method]}
            justifyContent="center"
            alignItems="center"
            testID={TestID.LaunchMethodExplainerTile}
          >
            <AuctionLaunchMethodIcon method={method} size="$icon.24" />
          </Flex>

          <Flex gap="$spacing8" alignItems="center">
            <Text variant="subheading1" color="$neutral1" textAlign="center">
              {explainerTitle}
            </Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              {explainerDescription}
            </Text>
          </Flex>

          {method === AuctionLaunchMethod.Custom && (
            <Anchor
              href={UniswapHelpUrls.articles.toucanIntro}
              target="_blank"
              rel="noopener noreferrer"
              variant="buttonLabel3"
              color="$neutral1"
              textDecorationLine="none"
            >
              {t('common.button.learn')}
            </Anchor>
          )}
        </Flex>

        <Flex row gap="$spacing12" width="100%">
          {method === AuctionLaunchMethod.Custom && (
            <Button variant="default" emphasis="tertiary" size="medium" onPress={onExploreAuctions}>
              {t('toucan.launchMethod.exploreAuctions')}
            </Button>
          )}
          <Button variant="default" emphasis="secondary" size="medium" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
