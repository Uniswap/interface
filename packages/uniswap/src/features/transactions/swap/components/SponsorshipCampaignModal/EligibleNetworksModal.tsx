import { UniverseChainId } from '@universe/chains'
import { isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkPill } from 'uniswap/src/components/network/NetworkPill'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function EligibleNetworksModal({
  isOpen,
  onClose,
  chainIds,
}: {
  isOpen: boolean
  onClose: () => void
  chainIds: UniverseChainId[]
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Modal
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.EligibleNetworks}
      onClose={onClose}
    >
      <Flex centered gap="$spacing16" p="$spacing12">
        <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
          <GlobeFilled color="$neutral1" size="$icon.24" />
        </Flex>

        <Flex centered gap="$spacing8" px="$spacing20">
          <Text color="$neutral1" textAlign="center" variant={isWebPlatform ? 'subheading2' : 'subheading1'}>
            {t('swap.sponsorship.eligibleNetworks.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('swap.sponsorship.eligibleNetworks.description')}
          </Text>
          <LearnMoreLink
            onlyUseText
            centered
            textVariant="buttonLabel3"
            textColor="$accent3"
            url={UniswapHelpUrls.articles.gasSponsorship}
          />
        </Flex>
        <Flex row centered flexWrap="wrap" gap="$spacing8">
          {chainIds.map((chainId) => (
            <NetworkPill
              key={chainId}
              showIcon
              chainId={chainId}
              iconSize={iconSizes.icon16}
              textVariant="body4"
              borderRadius="$rounded12"
              py="$spacing6"
              px="$spacing8"
              gap="$gap4"
              backgroundColor="$surface2"
              foregroundColor="$neutral1"
              showBackgroundColor={false}
            />
          ))}
        </Flex>
        <Flex row width="100%">
          <Button fill emphasis="secondary" size="medium" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
