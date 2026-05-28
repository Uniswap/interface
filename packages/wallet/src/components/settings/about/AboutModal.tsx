import { isExtensionApp } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, type GeneratedIcon, Text, TouchableArea } from 'ui/src'
import { BookOpen } from 'ui/src/components/icons/BookOpen'
import { Lock } from 'ui/src/components/icons/Lock'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { StickyNoteTextSquare } from 'ui/src/components/icons/StickyNoteTextSquare'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

// Slight delay lets the modal dismiss animation start (mostly the bottom-sheet on mobile)
// before triggering the next navigation, avoiding a perceptible jank/lag.
const AVOID_RENDER_DURING_ANIMATION_MS = 100

type AboutModalProps = {
  isOpen: boolean
  onClose: () => void
  onPressPrivacyPolicy?: () => void
  onPressTermsOfService?: () => void
  onPressDisclosures?: () => void
}

export type AboutModalState = Omit<AboutModalProps, 'onClose' | 'isOpen'>

export function AboutModal({
  isOpen,
  onClose,
  onPressPrivacyPolicy,
  onPressTermsOfService,
  onPressDisclosures,
}: AboutModalProps): JSX.Element {
  const { t } = useTranslation()

  const handlePressPrivacyPolicy = useEvent(() => {
    onClose()
    setTimeout(() => onPressPrivacyPolicy?.(), AVOID_RENDER_DURING_ANIMATION_MS)
  })

  const handlePressTermsOfService = useEvent(() => {
    onClose()
    setTimeout(() => onPressTermsOfService?.(), AVOID_RENDER_DURING_ANIMATION_MS)
  })

  const handlePressDisclosures = useEvent(() => {
    onClose()
    setTimeout(() => onPressDisclosures?.(), AVOID_RENDER_DURING_ANIMATION_MS)
  })

  return (
    <Modal isModalOpen={isOpen} name={ModalName.About} onClose={onClose}>
      <Flex
        animation="fast"
        gap="$gap8"
        pb={isExtensionApp ? undefined : '$spacing24'}
        py={isExtensionApp ? '$spacing16' : undefined}
        px="$spacing12"
        width="100%"
      >
        <Flex centered>
          <Text color="$neutral1" variant="subheading1">
            {t('settings.section.about')}
          </Text>
        </Flex>
        <Flex pt="$spacing8">
          <AboutRow Icon={Lock} title={t('common.privacyPolicy')} onPress={handlePressPrivacyPolicy} />
          <AboutRow Icon={BookOpen} title={t('common.termsOfService')} onPress={handlePressTermsOfService} />
          <AboutRow Icon={StickyNoteTextSquare} title={t('common.disclosures')} onPress={handlePressDisclosures} />
        </Flex>
      </Flex>
    </Modal>
  )
}

function AboutRow({ Icon, title, onPress }: { Icon: GeneratedIcon; title: string; onPress: () => void }): JSX.Element {
  return (
    <TouchableArea
      hoverable
      alignItems="center"
      borderRadius="$rounded12"
      flexDirection="row"
      flexGrow={1}
      gap="$spacing12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      justifyContent="space-between"
      px={isExtensionApp ? '$padding6' : '$spacing12'}
      py="$spacing12"
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing12">
        <Icon color="$neutral2" size="$icon.24" />
        <Text color="$neutral1" variant="subheading2">
          {title}
        </Text>
      </Flex>
      <RotatableChevron color="$neutral3" direction="right" size="$icon.24" />
    </TouchableArea>
  )
}
