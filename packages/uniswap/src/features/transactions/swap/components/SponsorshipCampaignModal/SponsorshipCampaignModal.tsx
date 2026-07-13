import { TradingApi } from '@universe/api'
import { isWebAppDesktop, isWebPlatform } from '@universe/environment'
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Button,
  Flex,
  Text,
  Tooltip,
  TouchableArea,
  UniversalImage,
  UniversalImageResizeMode,
  useSporeColors,
} from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { borderRadii, iconSizes, zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { EligibleNetworksModal } from 'uniswap/src/features/transactions/swap/components/SponsorshipCampaignModal/EligibleNetworksModal'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

function getFreeSwapsAllowance(campaign: TradingApi.CampaignDetails): TradingApi.CampaignAllowance | undefined {
  return campaign.allowances?.find(
    (allowance: TradingApi.CampaignAllowance) => allowance.unit === TradingApi.CampaignAllowance.unit.FREE_SWAPS,
  )
}

export function SponsorshipCampaignInfo({
  campaign,
  sponsorMetadata,
  trigger,
}: {
  campaign: TradingApi.CampaignDetails
  sponsorMetadata?: TradingApi.SponsorMetadata
  trigger: ReactNode
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { value: isModalOpen, setTrue: openModal, setFalse: closeModal } = useBooleanState(false)
  const { value: isNetworksOpen, setTrue: openNetworks, setFalse: closeNetworks } = useBooleanState(false)

  const eligibleChainIds = (campaign.eligibleChains ?? []).filter(isUniverseChainId)
  const showNetworks = eligibleChainIds.length > 1

  const eligibleNetworksModal = showNetworks ? (
    <EligibleNetworksModal isOpen={isNetworksOpen} chainIds={eligibleChainIds} onClose={closeNetworks} />
  ) : null

  const content = (
    <SponsorshipCampaignContent
      campaign={campaign}
      sponsorMetadata={sponsorMetadata}
      onNetworksPress={showNetworks ? openNetworks : undefined}
    />
  )

  if (isWebAppDesktop) {
    return (
      <>
        <Tooltip delay={{ close: 100, open: 0 }} placement="top" restMs={20}>
          <Tooltip.Trigger cursor="pointer">{trigger}</Tooltip.Trigger>
          <Tooltip.Content maxWidth={230} mx="$spacing24" p="$spacing16" pointerEvents="auto">
            {content}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip>
        {eligibleNetworksModal}
      </>
    )
  }

  return (
    <>
      <TouchableArea onPress={openModal}>{trigger}</TouchableArea>
      <Modal
        backgroundColor={colors.surface1.val}
        isModalOpen={isModalOpen}
        name={ModalName.SponsorshipCampaign}
        onClose={closeModal}
      >
        <Flex gap="$spacing24" p="$spacing12">
          {content}
          <Flex row width="100%">
            <Button fill variant="default" emphasis="secondary" size="medium" onPress={closeModal}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
      {eligibleNetworksModal}
    </>
  )
}

function SponsorshipCampaignContent({
  campaign,
  sponsorMetadata,
  onNetworksPress,
}: {
  campaign: TradingApi.CampaignDetails
  sponsorMetadata?: TradingApi.SponsorMetadata
  onNetworksPress?: () => void
}): JSX.Element {
  const imageUri = campaign.thumbnailUrl ?? sponsorMetadata?.icon
  const freeSwaps = getFreeSwapsAllowance(campaign)

  // Centered modal on mobile; left-aligned tooltip on web.
  const centered = !isWebAppDesktop
  const textAlign = centered ? 'center' : 'left'

  return (
    <Flex position="relative" gap="$spacing12" width="100%" alignItems={centered ? 'center' : 'flex-start'}>
      {onNetworksPress && <NetworksHeaderButton onPress={onNetworksPress} />}
      <Flex mb="$spacing4" mt={centered ? '$spacing24' : '$none'}>
        <UniversalImage
          size={{
            width: centered ? iconSizes.icon48 : iconSizes.icon24,
            height: centered ? iconSizes.icon48 : iconSizes.icon24,
            resizeMode: UniversalImageResizeMode.Contain,
          }}
          style={{ image: { borderRadius: borderRadii.roundedFull } }}
          uri={imageUri}
        />
      </Flex>
      <Flex gap="$spacing8" width="100%" alignItems={centered ? 'center' : 'flex-start'}>
        {campaign.headline && (
          <Text color="$neutral1" textAlign={textAlign} variant={isWebPlatform ? 'subheading2' : 'subheading1'}>
            {campaign.headline}
          </Text>
        )}
        {campaign.description && (
          <Text color="$neutral2" textAlign={textAlign} variant="body3">
            {campaign.description}
          </Text>
        )}
      </Flex>
      {freeSwaps?.remaining !== undefined && freeSwaps.total !== undefined && (
        <Text color="$neutral2" textAlign={textAlign} variant="body3">
          <Trans
            components={{ highlight: <Text color="$neutral1" variant="body3" /> }}
            i18nKey="swap.sponsorship.freeSwapsRemaining"
            values={{ remaining: freeSwaps.remaining, total: freeSwaps.total }}
          />
        </Text>
      )}
    </Flex>
  )
}

function NetworksHeaderButton({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea position="absolute" right="$none" top="$none" zIndex={zIndexes.default} onPress={onPress}>
      <Flex row centered gap="$spacing4">
        <InfoCircle color="$neutral3" size="$icon.16" />
        <Text color="$neutral2" variant="buttonLabel3">
          {t('swap.sponsorship.networks')}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
