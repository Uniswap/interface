import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { Button, Flex, useSporeColors } from 'ui/src'
import { ArrowDownCircle, WalletFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { spacing } from 'ui/src/theme/spacing'
import { GenericHeader } from 'uniswap/src/components/misc/GenericHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'

const CONTAINER_HEIGHT = 160
const OUTER_RING_SIZE = 260
const INNER_RING_SIZE = 175
const SHADOW_RADIUS = 20
const SHADOW_OPACITY = 0.3
const SHADOW_OFFSET = { width: 0, height: 0 } as const
const ICON_OFFSET = -spacing.spacing8

function BackgroundRing({ size }: { size: number }): JSX.Element {
  return (
    <Flex
      position="absolute"
      borderRadius="$roundedFull"
      borderColor="$surface3"
      borderWidth="$spacing1"
      height={size}
      width={size}
      top="50%"
      left="50%"
      transform={[{ translateX: -size / 2 }, { translateY: -size / 2 }]}
    />
  )
}

export function RestoreWalletModal(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const onRestore = (): void => {
    dispatch(closeAllModals())
    navigate(MobileScreens.OnboardingStack, {
      screen: OnboardingScreens.RestoreCloudBackupLoading,
      params: {
        entryPoint: OnboardingEntryPoint.Sidebar,
        importType: ImportType.RestoreMnemonic,
      },
    })
  }

  return (
    <Modal hideHandlebar backgroundColor={colors.surface1.val} isDismissible={false} name={ModalName.RestoreWallet}>
      <Flex centered gap="$spacing24" px="$spacing24" py="$spacing12" backgroundColor="$surface1">
        <Flex
          centered
          width="100%"
          height={CONTAINER_HEIGHT}
          position="relative"
          borderRadius="$rounded16"
          borderWidth="$spacing1"
          borderColor="$surface3"
          backgroundColor="$surface2"
          overflow="hidden"
        >
          <BackgroundRing size={OUTER_RING_SIZE} />
          <BackgroundRing size={INNER_RING_SIZE} />

          <Flex
            centered
            borderRadius="$rounded16"
            borderWidth="$spacing1"
            borderColor="$surface3"
            p="$spacing16"
            backgroundColor="$surface1"
            shadowColor="$accent1"
            shadowOffset={SHADOW_OFFSET}
            shadowOpacity={SHADOW_OPACITY}
            shadowRadius={SHADOW_RADIUS}
          >
            <WalletFilled color="$neutral1" size={iconSizes.icon24} />
            <Flex position="absolute" bottom={ICON_OFFSET} right={ICON_OFFSET}>
              <ArrowDownCircle color="$accent1" size={iconSizes.icon24} />
            </Flex>
          </Flex>
        </Flex>

        <GenericHeader
          title={t('account.wallet.button.restore')}
          titleVariant="subheading1"
          subtitle={t('account.wallet.restore.description')}
          subtitleVariant="body3"
        />
        <Flex row>
          <Button variant="branded" emphasis="primary" size="large" onPress={onRestore}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
