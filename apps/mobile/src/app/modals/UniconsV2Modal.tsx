import React from 'react'
import { useTranslation } from 'react-i18next'
import 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import {
  Button,
  Flex,
  Icons,
  Text,
  Unicon,
  UniconV2,
  useDeviceInsets,
  useIsDarkMode,
  useUniconColors,
} from 'ui/src'
import { spacing } from 'ui/src/theme'
import { UniconGradient } from 'wallet/src/components/accounts/AccountIcon'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { setHasViewedUniconV2IntroModal } from 'wallet/src/features/behaviorHistory/slice'
import { ModalName } from 'wallet/src/telemetry/constants'

interface UniconsV2ModalProps {
  address: string
}

const UNICON_HEADER_SIZE = 52
const UNICON_SIZE = 42
const UNICON_PADDING = 14

export function UniconsV2Modal({ address }: UniconsV2ModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()
  const { gradientEnd: uniconColor } = useUniconColors(address)
  const { top } = useDeviceInsets()

  const onCloseModal = (): void => {
    dispatch(setHasViewedUniconV2IntroModal(true))
  }

  return (
    <>
      <BottomSheetModal hideScrim name={ModalName.UniconsV2} onClose={onCloseModal}>
        <Flex gap="$spacing24" px="$spacing24" py="$spacing16">
          <Flex centered row gap="$spacing8">
            <Flex centered height={UNICON_SIZE} width={UNICON_SIZE}>
              <Unicon address={address} size={UNICON_SIZE - UNICON_PADDING} />
              <UniconGradient color={uniconColor} size={UNICON_SIZE} />
            </Flex>
            <Icons.RightArrow color="$neutral3" size="$icon.16" />
            <UniconV2 address={address} size={UNICON_SIZE} />
          </Flex>
          <Flex alignItems="center" gap="$spacing12">
            <Text variant="subheading1">{t('unicons.banner.title')}</Text>
            <Text color="$neutral2" textAlign="center" variant="body2">
              {t('unicons.banner.subtitle')}
            </Text>
          </Flex>
          <Button theme="secondary" onPress={onCloseModal}>
            {t('unicons.banner.button')}
          </Button>
        </Flex>
      </BottomSheetModal>
      <Flex
        backgroundColor={isDarkMode ? '$surface3' : '$surface1'}
        borderRadius="$roundedFull"
        bottom={0}
        height={UNICON_HEADER_SIZE}
        left={spacing.spacing24}
        mt="$spacing8"
        position="absolute"
        right={0}
        top={top}
        width={UNICON_HEADER_SIZE}
        zIndex="$tooltip">
        <UniconV2 address={address} size={UNICON_HEADER_SIZE} />
      </Flex>
    </>
  )
}
