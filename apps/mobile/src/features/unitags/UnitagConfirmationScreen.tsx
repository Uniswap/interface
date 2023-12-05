import React from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { UNITAG_SUFFIX } from 'src/features/unitags/constants'
import { Screens, UnitagScreens } from 'src/screens/Screens'
import { Button, Flex, Text, useDeviceInsets } from 'ui/src'
import { imageSizes } from 'ui/src/theme'

export function UnitagConfirmationScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.UnitagConfirmation>): JSX.Element {
  const { unitag, address, profilePictureUri } = route.params

  const insets = useDeviceInsets()
  const { t } = useTranslation()

  const onPressCustomize = (): void => {
    navigate(Screens.UnitagStack, {
      screen: UnitagScreens.EditProfile,
      params: {
        address,
      },
    })
  }

  const onPressHome = (): void => {
    navigate(Screens.Home)
  }

  return (
    <Screen edges={['right', 'left']}>
      <Flex
        grow
        $short={{ gap: '$none' }}
        gap="$spacing16"
        pb="$spacing16"
        px="$spacing16"
        style={{ marginTop: insets.top, marginBottom: insets.bottom }}>
        <Flex fill justifyContent="space-between">
          <Flex centered grow gap="$spacing36">
            <Flex centered gap={-8}>
              <Flex px="$spacing4">
                <UnitagProfilePicture
                  address={address}
                  profilePictureUri={profilePictureUri}
                  size={imageSizes.image100}
                />
              </Flex>
              <Flex
                row
                backgroundColor="$accent2"
                borderRadius="$rounded32"
                gap="$spacing8"
                px="$spacing32"
                py="$spacing4"
                zIndex="$popover">
                <Text color="$accent1" variant="heading2">
                  {unitag}
                </Text>
              </Flex>
            </Flex>

            <Flex centered gap="$spacing16" px="$spacing24">
              <Text color="$neutral1" textAlign="center" variant="heading3">
                {t('You’ve got it!')}
              </Text>
              <Text color="$neutral2" textAlign="center" variant="body2">
                {t(
                  '{{unitag}}{{unitagSuffix}} is ready to send and receive crypto. Continue to build out your wallet by customizing your profile',
                  { unitag, unitagSuffix: UNITAG_SUFFIX }
                )}
              </Text>
            </Flex>
          </Flex>
          <Flex gap="$spacing12">
            <Button size="medium" theme="primary" onPress={onPressCustomize}>
              {t('Customize profile')}
            </Button>
            <Button size="medium" theme="secondary" onPress={onPressHome}>
              {t('Return home')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}
