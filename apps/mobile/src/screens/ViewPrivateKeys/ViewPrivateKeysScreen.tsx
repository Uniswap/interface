import { CommonActions } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { AppStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { useBiometricAppSpeedBump } from 'src/features/biometrics/useBiometricAppSpeedBump'
import { useLockScreenOnBlur } from 'src/features/lockScreen/hooks/useLockScreenOnBlur'
import { PrivateKeyDisplay } from 'src/screens/ViewPrivateKeys/PrivateKeyView/PrivateKeyDisplay'
import { Button, Flex, GeneratedIcon, IconButton, Spacer, Text } from 'ui/src'
import { Eye, Key, Laptop } from 'ui/src/components/icons'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { HiddenWordView } from 'ui/src/components/placeholders/HiddenWordView'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { setHasCopiedPrivateKeys } from 'wallet/src/features/behaviorHistory/slice'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<AppStackParamList, MobileScreens.ViewPrivateKeys>

/**
 * Common PX used to allow the scrollview scrollbar to be visible at the width of the screen.
 */
const COMMON_PX = '$spacing24'

/**
 * Screen that displays the user's private keys. The private keys are managed by the
 * native components.
 */
export function ViewPrivateKeysScreen({ navigation, route }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const shouldShow = useFeatureFlag(FeatureFlags.EnableExportPrivateKeys)
  const addresses = useSignerAccounts().map((account) => account.address)
  const { showHeader } = route.params ?? {}

  const [showSpeedBump, setShowSpeedBump] = useState(true)

  useEffect(() => {
    if (!shouldShow) {
      logger.error('ExportPrivateKeys flag is not enabled but user is on ViewPrivateKeysScreen', {
        tags: { file: 'ViewPrivateKeysScreen', function: 'useEffect' },
      })
    }
  }, [shouldShow])

  const onShowPrivateKeys = useCallback((): void => {
    setShowSpeedBump(false)
  }, [])

  useLockScreenOnBlur()
  const { onBiometricContinue } = useBiometricAppSpeedBump(onShowPrivateKeys)

  const onFinished = useCallback((): void => {
    dispatch(setHasCopiedPrivateKeys(true))
    dispatchNavigationAction(
      CommonActions.reset({
        index: 0,
        routes: [{ name: MobileScreens.Home }],
      }),
    )
  }, [dispatch])

  const SpeedBumpModalContent = useCallback(() => {
    return (
      <Flex px="$spacing24">
        <Flex row justifyContent="center">
          <IconButton size="medium" variant="critical" emphasis="secondary" icon={<AlertTriangleFilled />} />
        </Flex>
        <Text textAlign="center" variant="subheading1" pt="$spacing16">
          {t('privateKeys.export.modal.speedbump.title')}
        </Text>
        <Text textAlign="center" variant="body2" color="$neutral2" pt="$spacing8">
          {t('privateKeys.export.modal.speedbump.subtitle')}
        </Text>
        <Spacer size="$spacing16" />
        <Flex borderWidth={1} borderColor="$surface3" borderRadius="$rounded20" gap="$gap12" p="$spacing12">
          <BulletRow Icon={Eye} description={t('privateKeys.export.modal.speedbump.bullet1')} />
          <BulletRow Icon={Key} description={t('privateKeys.export.modal.speedbump.bullet2')} />
          <BulletRow Icon={Laptop} description={t('privateKeys.export.modal.speedbump.bullet3')} />
        </Flex>
        <Flex row py="$spacing24" gap="$gap8">
          <Trace logPress element={ElementName.Cancel}>
            <Button variant="default" emphasis="secondary" size="medium" onPress={navigation.goBack}>
              {t('common.button.close')}
            </Button>
          </Trace>
          <Trace logPress element={ElementName.Continue}>
            <Button
              variant="branded"
              emphasis="primary"
              size="medium"
              testID={TestID.Continue}
              onPress={onBiometricContinue}
            >
              {t('common.button.continue')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    )
  }, [t, navigation.goBack, onBiometricContinue])

  const DisplayAddressAndPrivateKey = useCallback(({ address }: { address: string }): JSX.Element => {
    return (
      <Flex
        justifyContent="space-between"
        p="$spacing12"
        borderRadius="$rounded16"
        borderWidth={1}
        borderColor="$surface3"
        gap="$spacing8"
      >
        <AddressDisplay hideAddressInSubtitle={true} address={address} variant="body1" />
        <PrivateKeyDisplay address={address} />
      </Flex>
    )
  }, [])

  const Header = useCallback(() => {
    return (
      <Flex>
        {showHeader ? (
          <BackHeader pt="$spacing16" alignment="center" px="$spacing16" pb="$spacing16">
            <Text variant="body1">{t('privateKeys.view.title')}</Text>
          </BackHeader>
        ) : (
          <Text alignSelf="center" pb="$spacing16" pt="$spacing4" variant="body1">
            {t('privateKeys.view.title')}
          </Text>
        )}
        <Text px={COMMON_PX} alignSelf="center" variant="body2" color="$neutral2">
          {t('privateKeys.view.subtitle')}
        </Text>
      </Flex>
    )
  }, [t, showHeader])

  return (
    <Screen>
      <Modal name={ModalName.PrivateKeySpeedBumpModal} isModalOpen={showSpeedBump} isDismissible={false}>
        <SpeedBumpModalContent />
      </Modal>
      <Flex flex={1} justifyContent="space-between">
        <Flex flex={1}>
          <Header />
          <Spacer size="$spacing20" />
          {showSpeedBump ? (
            <Flex px={COMMON_PX}>
              <HiddenWordView rows={3} columns={1} />
            </Flex>
          ) : (
            <ScrollView style={{ flexGrow: 1 }}>
              <Flex px={COMMON_PX} gap="$spacing8">
                {addresses.map((address) => (
                  <DisplayAddressAndPrivateKey key={address} address={address} />
                ))}
              </Flex>
            </ScrollView>
          )}

          <Spacer size="$spacing20" />
        </Flex>
        <Flex row px={COMMON_PX} pb="$spacing16" alignSelf="flex-end">
          <Trace logPress element={ElementName.ViewNativePrivateKeysOnCopied}>
            <Button
              variant="branded"
              emphasis="primary"
              size="large"
              testID={TestID.ViewNativePrivateKeysOnCopied}
              onPress={onFinished}
            >
              {addresses.length === 1
                ? t('privateKeys.view.button.continue.single')
                : t('privateKeys.view.button.continue')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </Screen>
  )
}

/**
 * Helper UI component to render a bullet row with an icon and a description
 */
const BulletRow = ({ Icon, description }: { Icon: GeneratedIcon; description: string }): JSX.Element => {
  return (
    <Flex row alignItems="center" gap="$spacing12">
      <Flex width="$spacing32" height="$spacing32" alignItems="center" justifyContent="center">
        <Icon size="$icon.24" color="$statusCritical" />
      </Flex>
      <Text flex={1} textAlign="left" variant="body2" color="$neutral1">
        {description}
      </Text>
    </Flex>
  )
}
