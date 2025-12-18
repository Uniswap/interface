import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ParsedWarnings } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function SwapWarningModal({
  isOpen,
  onClose,
  parsedWarning,
}: {
  isOpen: boolean
  onClose: () => void
  parsedWarning: Required<ParsedWarnings>['reviewScreenWarning']
}): JSX.Element {
  const { t } = useTranslation()

  const { warning, Icon, color } = parsedWarning

  const captionComponent = warning.link ? (
    <Flex centered gap="$spacing12">
      {warning.message && (
        <Text color="$neutral2" textAlign="center" variant="body3">
          {warning.message}
        </Text>
      )}
      <LearnMoreLink display="inline" textColor="$neutral1" textVariant="buttonLabel3" url={warning.link} />
    </Flex>
  ) : undefined

  return (
    <WarningModal
      caption={warning.message && !warning.link ? warning.message : undefined}
      captionComponent={captionComponent}
      acknowledgeText={t('common.button.close')}
      icon={Icon && <Icon color={color.text} size="$icon.24" />}
      isOpen={isOpen}
      modalName={ModalName.SwapWarning}
      severity={warning.severity}
      title={warning.title ?? ''}
      onClose={onClose}
      onAcknowledge={onClose}
    />
  )
}
