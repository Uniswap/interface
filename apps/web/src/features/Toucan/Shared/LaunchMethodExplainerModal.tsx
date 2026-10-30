import { Anchor, Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { X } from '@universe/mycelium/icons/X'
import { opacifyRaw } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { isPoolsLaunchMethod, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionEventName, ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { getAnalyticsLaunchMethod } from '~/features/Toucan/Auction/utils/provenanceAnalytics'
import { getLaunchMethodCopy } from '~/features/Toucan/Shared/getLaunchMethodCopy'
import { LaunchMethodIcon, useLaunchMethodAccentColor } from '~/features/Toucan/Shared/LaunchMethodIcon'
import { POOLS_BASE_URL, POOLS_HOSTNAME } from '~/features/Toucan/utils/quickLaunchLinks'

const EXPLORE_AUCTIONS_PATH = '/explore/auctions'

/**
 * Explains a launch method (Custom auction / Crowd Launch / Instant Launch). Used by normalized token-provenance
 * and auction-card presentation; renders nothing for methods that have no explainer.
 */
export function LaunchMethodExplainerModal({
  method,
  auctionAddress,
  isOpen,
  onClose,
}: {
  method: LaunchProvenanceMethod
  /** Absent for a launch with no auction behind it. */
  auctionAddress?: string
  isOpen: boolean
  onClose: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const accentColor = useLaunchMethodAccentColor({ method })
  const copy = getLaunchMethodCopy({ method, t })
  const isPoolsLaunch = isPoolsLaunchMethod(method)
  const footerHref = isPoolsLaunch ? POOLS_BASE_URL : undefined

  if (!copy) {
    return null
  }

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
        <Trace
          logImpression={isOpen}
          eventOnTrigger={AuctionEventName.AuctionTypeExplainerOpened}
          properties={{ launch_method: getAnalyticsLaunchMethod(method), auction_address: auctionAddress }}
        />
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
            backgroundColor={accentColor ? opacifyRaw(10, accentColor) : '$surface3'}
            justifyContent="center"
            alignItems="center"
            testID={TestID.LaunchMethodExplainerTile}
          >
            <LaunchMethodIcon method={method} size="$icon.24" />
          </Flex>

          <Flex gap="$spacing8" alignItems="center">
            <Text variant="subheading1" color="$neutral1" textAlign="center">
              {copy.explainerTitle}
            </Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              {copy.explainerDescription}
            </Text>
          </Flex>

          <Trace
            logPress
            element={ElementName.LaunchMethodLearnMore}
            properties={{ launch_method: getAnalyticsLaunchMethod(method), destination: 'help' }}
          >
            <Anchor
              href={copy.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="buttonLabel3"
              color="$neutral1"
              textDecorationLine="none"
            >
              {t('common.button.learn')}
            </Anchor>
          </Trace>
        </Flex>

        <Flex row gap="$spacing12" width="100%">
          {footerHref && (
            <Trace
              logPress
              element={ElementName.LaunchMethodPoolsLink}
              properties={{ launch_method: getAnalyticsLaunchMethod(method), destination: 'pools' }}
            >
              <Button
                tag="a"
                href={footerHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                emphasis="tertiary"
                size="medium"
                icon={<ExternalLink color="$neutral3" />}
                iconPosition="after"
                $platform-web={{ textDecoration: 'none' }}
              >
                {POOLS_HOSTNAME}
              </Button>
            </Trace>
          )}
          {method === LaunchProvenanceMethod.CustomAuction && (
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
