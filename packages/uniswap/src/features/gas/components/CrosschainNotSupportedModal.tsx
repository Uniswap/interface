import { isWebPlatform } from '@universe/environment'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons/Gas'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

export interface CrosschainNotSupportedModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Informational modal shown when the user taps the gas chip while
 * `userSettings.enableCustomGasFeeEntry` is true AND the trade is crosschain.
 *
 * Custom network costs cannot be set for crosschain swaps because they
 * involve multiple transactions on different chains; we explain that here
 * and tell the user to switch to single-chain swaps to use custom fees.
 */
export function CrosschainNotSupportedModal({ isOpen, onClose }: CrosschainNotSupportedModalProps): JSX.Element {
  const { t } = useTranslation()

  const learnMoreUrl = UniswapHelpUrls.articles.networkFeeInfo

  const onPressLearnMore = useCallback(async (): Promise<void> => {
    try {
      sendAnalyticsEvent(WalletEventName.ExternalLinkOpened, { url: learnMoreUrl })
      await openUri({ uri: learnMoreUrl })
    } catch (error) {
      logger.error(error, { tags: { file: 'CrosschainNotSupportedModal.tsx', function: 'onPressLearnMore' } })
    }
  }, [learnMoreUrl])

  return (
    <Modal isModalOpen={isOpen} name={ModalName.GasCrosschainNotSupported} onClose={onClose}>
      <Flex centered gap="$spacing12" pt="$spacing8">
        <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
          <Gas color="$neutral1" size="$icon.24" />
        </Flex>
        <Flex centered gap="$spacing8" px="$spacing8" pt="$spacing4">
          <Text color="$neutral1" textAlign="center" variant={isWebPlatform ? 'subheading2' : 'subheading1'}>
            {t('gas.crosschain.notSupported.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('gas.crosschain.notSupported.body1')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('gas.crosschain.notSupported.body2')}
          </Text>
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
