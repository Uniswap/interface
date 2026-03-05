import { useTranslation } from 'react-i18next'
import { Button, Flex, Image, Text, TouchableArea, useSporeColors } from 'ui/src'
import toucanIntroBackground from 'ui/src/assets/backgrounds/toucan-intro.png'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExternalLink } from '~/theme/components/Links'

const LEARN_MORE_URL = uniswapUrls.helpArticleUrls.toucanIntro

interface ToucanIntroModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ToucanIntroModal({ isOpen, onClose }: ToucanIntroModalProps) {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Modal isModalOpen={isOpen} name={ModalName.Dialog} onClose={onClose} maxWidth={440} padding={0}>
      <Flex position="relative" backgroundColor="$surface1" overflow="hidden" flexDirection="column">
        <Flex position="absolute" top={0} left={0} right={0} height={120} zIndex={0}>
          <Image source={{ uri: toucanIntroBackground }} width="100%" height="100%" opacity={0.3} />
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{
              background: `linear-gradient(180deg, ${colors.transparent.variable} 0%, ${colors.surface1.variable} 100%)`,
            }}
          />
        </Flex>

        <TouchableArea
          position="absolute"
          top="$spacing16"
          right="$spacing16"
          p="$spacing8"
          onPress={onClose}
          borderRadius="$rounded8"
          zIndex={2}
        >
          <X size="$icon.24" color="$neutral1" />
        </TouchableArea>

        <Flex p="$spacing24" pt="$spacing40" gap="$spacing16" zIndex={1}>
          <Flex gap="$spacing16" alignItems="flex-start">
            <Flex backgroundColor="$accent2" borderRadius="$rounded8" p="$spacing6" width={40} height={40}>
              <Rocket size="$icon.28" color="$accent1" />
            </Flex>

            <Flex gap="$spacing4" flex={1}>
              <Text variant="subheading1" color="$neutral1">
                {t('toucan.helpModal.title')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {t('toucan.helpModal.description')}
              </Text>
            </Flex>
          </Flex>

          <Flex gap="$spacing8" px="$spacing8">
            <Text variant="subheading2" color="$neutral1">
              1. {t('toucan.helpModal.step1')}
            </Text>
            <Text variant="subheading2" color="$neutral1">
              2. {t('toucan.helpModal.step2')}
            </Text>
            <Text variant="subheading2" color="$neutral1">
              3. {t('toucan.helpModal.step3')}
            </Text>
          </Flex>

          <Flex gap="$spacing16" alignItems="center">
            <ExternalLink href={LEARN_MORE_URL} style={{ textDecoration: 'none' }}>
              <Text variant="buttonLabel3" color="$neutral2" textAlign="center">
                {t('toucan.helpModal.learnMore')}
              </Text>
            </ExternalLink>

            <Button fill={false} variant="default" emphasis="primary" size="medium" onPress={onClose} width="100%">
              {t('toucan.helpModal.continue')}
            </Button>
          </Flex>

          <Text variant="body4" color="$neutral3" fontSize={10} lineHeight={12}>
            {t('toucan.helpModal.disclaimer.collapsed')} {t('toucan.helpModal.disclaimer.expanded1')}{' '}
            {t('toucan.helpModal.disclaimer.expanded2')}
          </Text>
        </Flex>
      </Flex>
    </Modal>
  )
}
