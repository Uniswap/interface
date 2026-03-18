import { View } from 'react-native'
import { OverKeyboardView } from 'react-native-keyboard-controller'
import { OverKeyboardContentProps } from 'ui/src/components/OverKeyboardContent/OverKeyboardContent'
import { isTestEnv } from 'utilities/src/environment/env'

export function OverKeyboardContent({
  visible,
  children,
}: React.PropsWithChildren<OverKeyboardContentProps>): JSX.Element {
  // OverKeyboardView can cause issues with Maestro visibility detection in E2E tests
  // Since we don't strictly need keyboard handling in these specific E2E flows, we can bypass it
  if (isTestEnv()) {
    return <View style={{ display: visible ? 'flex' : 'none' }}>{children}</View>
  }
  return <OverKeyboardView visible={visible}>{children}</OverKeyboardView>
}
