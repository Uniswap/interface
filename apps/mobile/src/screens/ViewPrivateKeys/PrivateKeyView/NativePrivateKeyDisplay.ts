import { requireNativeComponent } from 'react-native'
import { NativePrivateKeyDisplayInternalProps } from 'src/screens/ViewPrivateKeys/PrivateKeyView/types'

export const NativePrivateKeyDisplay = requireNativeComponent<NativePrivateKeyDisplayInternalProps>('PrivateKeyDisplay')
