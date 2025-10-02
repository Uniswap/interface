import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isWebPlatform } from 'utilities/src/platform'

interface Props {
  isVisible: boolean
  onBack: () => void
  onClose: () => void
  onAccept: () => void
}

/**
 * Warning when selecting unsupported tokens for offramp.
 */
export default function UnsupportedTokenModal({ isVisible, onBack, onClose, onAccept }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Modal isModalOpen={isVisible} maxWidth={420} name={ModalName.FiatOffRampUnsupportedTokenModal} onClose={onClose}>
      <Flex
        centered
        gap="$spacing16"
        pb={isWebPlatform ? '$none' : '$spacing12'}
        pt="$spacing12"
        px={isWebPlatform ? '$none' : '$spacing24'}
      >
        <Flex centered gap="$spacing16">
          <Flex
            centered
            borderRadius="$rounded12"
            p="$spacing12"
            style={{
              backgroundColor: colors.statusWarning2.val,
            }}
          >
            <WarningIcon color="$statusWarning" size="$icon.24" />
          </Flex>
          <Text variant="subheading1">{t('fiatOffRamp.unsupportedToken.title')}</Text>
        </Flex>
        <Flex centered gap="$spacing12" width="90%">
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('fiatOffRamp.unsupportedToken.message')}
          </Text>
        </Flex>
        <Flex centered gap="$spacing12" mt="$spacing16" width="100%">
          <Flex row>
            <Button emphasis="secondary" size="large" onPress={onBack}>
              {t('fiatOffRamp.unsupportedToken.back')}
            </Button>
          </Flex>

          <Flex row>
            <Button size="large" variant="branded" onPress={onAccept}>
              {t('fiatOffRamp.unsupportedToken.swap')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
