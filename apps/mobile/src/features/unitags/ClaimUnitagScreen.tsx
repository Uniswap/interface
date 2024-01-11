import { useHeaderHeight } from '@react-navigation/elements'
import React from 'react'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { Screen, SHORT_SCREEN_HEADER_HEIGHT_RATIO } from 'src/components/layout/Screen'
import { ChooseUnitag } from 'src/features/unitags/ChooseUnitag'
import { UnitagScreens } from 'src/screens/Screens'
import { useDeviceInsets } from 'ui/src'
import { isIOS } from 'wallet/src/utils/platform'

export function ClaimUnitagScreen({
  route,
}: UnitagStackScreenProp<UnitagScreens.ClaimUnitag>): JSX.Element {
  const { entryPoint } = route.params
  const headerHeight = useHeaderHeight()
  const insets = useDeviceInsets()

  return (
    <Screen
      $short={{ pt: headerHeight * SHORT_SCREEN_HEADER_HEIGHT_RATIO }}
      edges={['right', 'left']}
      pt={headerHeight}>
      <KeyboardAvoidingView
        enabled
        behavior={isIOS ? 'padding' : undefined}
        style={[styles.base, { marginTop: insets.top, marginBottom: insets.bottom }]}>
        <ChooseUnitag entryPoint={entryPoint} />
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
