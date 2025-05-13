import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface UniswapXUnavailableModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UniswapXUnavailableModal({ isOpen, onClose }: UniswapXUnavailableModalProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <WarningModal
      isOpen={isOpen}
      icon={<Lightning color="$neutral1" size="$icon.24" />}
      title={t('uniswapx.unavailable.title')}
      // TODO: add learn more link when available
      captionComponent={
        <Flex gap="$spacing8" alignItems="center">
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('uniswapx.description.unsupported')}
          </Text>
          <LearnMoreLink url="#" textColor="$accent1" textVariant="buttonLabel3" />
        </Flex>
      }
      rejectText={t('common.close')}
      modalName={ModalName.UniswapXUnavailable}
      onReject={onClose}
      onClose={onClose}
    />
  )
}
