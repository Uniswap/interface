import { isExtensionApp, isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons/Gas'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

export interface AutoGasTooltipModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Educational modal shown when the user taps the gas chip while
 * `userSettings.enableCustomGasFeeEntry` is false.
 *
 * The body has two variants:
 * - Flag off: just the base "this is the network cost" explanation.
 * - Flag on: appends a hint pointing users to Advanced Settings where they
 *   can opt into Custom network fees.
 */
export function AutoGasTooltipModal({ isOpen, onClose }: AutoGasTooltipModalProps): JSX.Element {
  const { t } = useTranslation()
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)

  const learnMoreUrl = uniswapUrls.helpArticleUrls.networkFeeInfo

  const onPressLearnMore = useCallback(async (): Promise<void> => {
    try {
      sendAnalyticsEvent(WalletEventName.ExternalLinkOpened, { url: learnMoreUrl })
      await openUri({ uri: learnMoreUrl })
    } catch (error) {
      logger.error(error, { tags: { file: 'AutoGasTooltipModal.tsx', function: 'onPressLearnMore' } })
    }
  }, [learnMoreUrl])

  return (
    <Modal
      alignment={isExtensionApp ? 'top' : 'center'}
      isModalOpen={isOpen}
      name={ModalName.GasAutoTooltip}
      onClose={onClose}
    >
      <Flex centered gap="$spacing12" pt="$spacing8">
        <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
          <Gas color="$neutral1" size="$icon.24" />
        </Flex>
        <Flex centered gap="$spacing8" px="$spacing8" pt="$spacing4">
          <Text color="$neutral1" textAlign="center" variant={isWebPlatform ? 'subheading2' : 'subheading1'}>
            {t('gas.auto.tooltip.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('gas.auto.tooltip.body')}
          </Text>
          {isGasFeeOverridesEnabled && (
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('gas.auto.tooltip.bodyCustomEnabled')}
            </Text>
          )}
        </Flex>
        <Flex row width="100%" pt="$spacing8">
          <Button fill emphasis="text-only" size="medium" onPress={onPressLearnMore}>
            {t('common.button.learn')}
          </Button>
        </Flex>
        <Flex row width="100%">
          <Button fill emphasis="primary" size="medium" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
