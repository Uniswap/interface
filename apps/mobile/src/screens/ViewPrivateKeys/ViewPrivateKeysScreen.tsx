import { CommonActions } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { AppStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Button, Flex, GeneratedIcon, IconButton, Spacer, Text } from 'ui/src'
import { Eye, Key, Laptop } from 'ui/src/components/icons'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { setHasCopiedPrivateKeys } from 'wallet/src/features/behaviorHistory/slice'

type Props = NativeStackScreenProps<AppStackParamList, MobileScreens.ViewPrivateKeys>

/**
 * Screen that displays the user's private keys. The private keys are managed by the
 * native components.
 */
export function ViewPrivateKeysScreen({ navigation, route }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { showHeader } = route.params ?? {}
  const [showSpeedBump, setShowSpeedBump] = useState(true)

  const onContinue = useCallback((): void => {
    setShowSpeedBump(false)
  }, [])

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
          <Button variant="default" emphasis="secondary" size="medium" onPress={navigation.goBack}>
            {t('common.button.close')}
          </Button>
          <Button variant="branded" emphasis="primary" size="medium" onPress={onContinue}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    )
  }, [t, navigation.goBack, onContinue])

  return (
    <Screen>
      <Modal name={ModalName.PrivateKeySpeedBumpModal} isModalOpen={showSpeedBump} isDismissible={false}>
        <SpeedBumpModalContent />
      </Modal>
      <Flex px="$spacing16" flex={1} justifyContent="space-between">
        <Flex>
          {showHeader ? (
            <BackHeader pt="$spacing16" alignment="center" px="$spacing16" pb="$spacing16">
              <Text variant="body1">{t('privateKeys.view.title')}</Text>
            </BackHeader>
          ) : (
            <Text alignSelf="center" px="$spacing16" pb="$spacing16" pt="$spacing4" variant="body1">
              {t('privateKeys.view.title')}
            </Text>
          )}
          <Text alignSelf="center" px="$spacing16" variant="body2" color="$neutral2">
            {t('privateKeys.view.subtitle')}
          </Text>
        </Flex>
        <Flex row pb="$spacing16" alignSelf="flex-end">
          <Button variant="branded" emphasis="primary" size="large" onPress={onFinished}>
            {t('privateKeys.view.button.continue')}
          </Button>
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
