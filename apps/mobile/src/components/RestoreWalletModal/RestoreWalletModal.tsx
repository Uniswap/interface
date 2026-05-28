import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { Button, Flex, useSporeColors } from 'ui/src'
import { ArrowDownCircleFilledWithBorder, WalletFilled } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { GenericHeader } from 'uniswap/src/components/misc/GenericHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'

const CONTAINER_HEIGHT = 160
const OUTER_RING_SIZE = 260
const INNER_RING_SIZE = 175
const SHADOW_RADIUS = 20
const SHADOW_OPACITY = 0.3
const SHADOW_OFFSET = { width: 0, height: 0 } as const
const ICON_OFFSET = -spacing.spacing8

/**
 * This modal is used to prompt the user to restore their wallet depending on the type of
 * restoration needed.
 */
export function RestoreWalletModal({ route }: AppStackScreenProp<typeof ModalName.RestoreWallet>): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const { onClose } = useReactNavigationModal()

  const restoreType = route.params.restoreType
  const { title, description, isDismissible, modalName } = useMemo(() => {
    switch (restoreType) {
      case WalletRestoreType.SeedPhrase:
        return {
          title: t('account.wallet.restore.seed_phrase.title'),
          description: t('account.wallet.restore.seed_phrase.description'),
          isDismissible: true,
          modalName: ModalName.RestoreWalletSeedPhrase,
        }
      case WalletRestoreType.NewDevice:
        return {
          title: t('account.wallet.restore.new_device.title'),
          description: t('account.wallet.restore.new_device.description'),
          isDismissible: false,
          modalName: ModalName.RestoreWallet,
        }
      default:
        return {}
    }
  }, [restoreType, t])

  const onRestore = (): void => {
    onClose()
    dispatch(closeAllModals()) // still need this until all modals are migrated to react-navigation

    switch (restoreType) {
      case WalletRestoreType.SeedPhrase: {
        navigate(MobileScreens.OnboardingStack, {
          screen: OnboardingScreens.RestoreMethod,
          params: {
            entryPoint: OnboardingEntryPoint.Sidebar,
            importType: ImportType.RestoreMnemonic,
            restoreType,
          },
        })
        break
      }
      case WalletRestoreType.NewDevice: {
        navigate(MobileScreens.OnboardingStack, {
          screen: OnboardingScreens.RestoreCloudBackupLoading,
          params: {
            entryPoint: OnboardingEntryPoint.Sidebar,
            importType: ImportType.RestoreMnemonic,
            restoreType,
          },
        })
        break
      }
    }
  }

  return (
    <Modal
      hideHandlebar
      backgroundColor={colors.surface1.val}
      isDismissible={isDismissible}
      name={modalName ?? ModalName.RestoreWallet}
      onClose={onClose}
    >
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
            <WalletFilled color="$neutral1" size="$icon.24" />
            <Flex position="absolute" bottom={ICON_OFFSET} right={ICON_OFFSET}>
              <ArrowDownCircleFilledWithBorder color="$accent1" size="$icon.24" />
            </Flex>
          </Flex>
        </Flex>

        <GenericHeader title={title} titleVariant="subheading1" subtitle={description} subtitleVariant="body3" />
        <Flex gap="$spacing8" width="100%">
          <Flex row>
            <Trace logPress element={ElementName.Continue}>
              <Button testID={TestID.Continue} variant="branded" emphasis="primary" size="medium" onPress={onRestore}>
                {t('common.button.continue')}
              </Button>
            </Trace>
          </Flex>
          {isDismissible && (
            <Flex row>
              <Trace logPress element={ElementName.Cancel}>
                <Button testID={TestID.Cancel} variant="default" emphasis="secondary" size="medium" onPress={onClose}>
                  {t('common.button.notNow')}
                </Button>
              </Trace>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}

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
