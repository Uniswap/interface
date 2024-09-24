import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, isWeb, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

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
    <Modal isModalOpen={isVisible} maxWidth={420} name={ModalName.TokenWarningModal} onClose={onClose}>
      <Flex
        centered
        gap="$spacing16"
        pb={isWeb ? '$none' : '$spacing12'}
        pt="$spacing12"
        px={isWeb ? '$none' : '$spacing24'}
      >
        <Flex centered gap="$spacing16">
          <Flex
            centered
            borderRadius="$rounded12"
            p="$spacing12"
            style={{
              backgroundColor: opacify(12, colors.DEP_accentWarning.val),
            }}
          >
            <WarningIcon safetyLevel={SafetyLevel.MediumWarning} size="$icon.24" />
          </Flex>
          <Text variant="subheading1">{t('fiatOffRamp.unsupportedToken.title')}</Text>
        </Flex>
        <Flex centered gap="$spacing12" width="90%">
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('fiatOffRamp.unsupportedToken.message')}
          </Text>
        </Flex>
        <Flex centered gap="$spacing12" mt="$spacing16" width="100%">
          <Button theme="secondary" width="100%" onPress={onBack}>
            {t('fiatOffRamp.unsupportedToken.back')}
          </Button>
          <Button theme="primary" width="100%" onPress={onAccept}>
            {t('fiatOffRamp.unsupportedToken.swap')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
