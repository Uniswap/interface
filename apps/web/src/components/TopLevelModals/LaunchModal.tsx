// Remove the following line when LaunchModal is used again:
/* eslint-disable import/no-unused-modules */
import {
  LAUNCH_MODAL_DESKTOP_MAX_HEIGHT,
  LAUNCH_MODAL_DESKTOP_MAX_WIDTH,
  LAUNCH_MODAL_MOBILE_MAX_HEIGHT,
  LAUNCH_MODAL_MOBILE_MAX_IMAGE_HEIGHT,
} from 'components/TopLevelModals/constants'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image, ImageProps, Text, TouchableArea, useMedia } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { openUri } from 'uniswap/src/utils/linking'

type Props = {
  modalName: ModalNameType
  learnMoreUrl: string
  desktopImage: string
  mobileImage: string
  logo: ImageProps['source']
  title: string
  description: string
}

export function LaunchModal({ modalName, learnMoreUrl, desktopImage, mobileImage, logo, title, description }: Props) {
  const showModalAtom = useMemo(() => atomWithStorage(`showModal.${modalName}`, true), [modalName])
  const [showModal, setShowModal] = useAtom(showModalAtom)
  const isLandingPage = useIsPage(PageType.LANDING)
  const media = useMedia()
  const { t } = useTranslation()

  return (
    <Trace modal={modalName}>
      <Modal
        name={modalName}
        maxWidth={media.md ? undefined : LAUNCH_MODAL_DESKTOP_MAX_WIDTH}
        height={media.md ? LAUNCH_MODAL_MOBILE_MAX_HEIGHT : LAUNCH_MODAL_DESKTOP_MAX_HEIGHT}
        isModalOpen={showModal && !isLandingPage}
        onClose={() => setShowModal(false)}
        padding={0}
      >
        <Flex flexDirection={media.md ? 'column' : 'row'} fill>
          <Flex
            backgroundImage={`url(${media.md ? mobileImage : desktopImage})`}
            borderTopLeftRadius={20}
            borderBottomLeftRadius={20}
            backgroundSize="cover"
            backgroundPosition="center"
            height={media.md ? LAUNCH_MODAL_MOBILE_MAX_IMAGE_HEIGHT : '100%'}
            flexGrow={media.md ? 0 : 1}
          />
          <Flex py="$spacing20" px="$spacing24" gap="$gap16" flexBasis={0} grow>
            {!media.md && (
              <Flex row justifyContent="space-between">
                <Image height={iconSizes.icon40} source={logo} width={iconSizes.icon40} />
                <Trace logPress element={ElementName.CloseButton}>
                  <TouchableArea onPress={() => setShowModal(false)}>
                    <X size="$icon.16" />
                  </TouchableArea>
                </Trace>
              </Flex>
            )}
            <Flex gap="$gap4" fill>
              <Text variant="subheading1">{title}</Text>
              <Text variant="body3" color="$neutral2">
                {description}
              </Text>
            </Flex>
            <Flex gap="$gap8" row>
              <Trace logPress element={ElementName.CloseButton}>
                <Button emphasis="secondary" size="xxsmall" fill flexBasis={0} onPress={() => setShowModal(false)}>
                  {t('common.button.dismiss')}
                </Button>
              </Trace>
              <Trace logPress element={ElementName.LearnMoreLink}>
                <Button
                  variant="branded"
                  size="xxsmall"
                  fill
                  flexBasis={0}
                  onPress={() => openUri({ uri: learnMoreUrl })}
                >
                  {t('common.button.learn')}
                </Button>
              </Trace>
            </Flex>
          </Flex>
        </Flex>
      </Modal>
    </Trace>
  )
}
