import { useTranslation } from 'react-i18next'
import { requireNativeComponent, StyleProp, ViewProps } from 'react-native'
import { useNativeComponentKey } from 'src/app/hooks'
import { FlexProps, flexStyles, HiddenFromScreenReaders } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { isAndroid } from 'utilities/src/platform'

interface NativeMnemonicConfirmationProps {
  mnemonicId: Address
  shouldShowSmallText: boolean
  selectedWordPlaceholder: string
  onConfirmComplete: () => void
}

const NativeMnemonicConfirmation = requireNativeComponent<NativeMnemonicConfirmationProps>('MnemonicConfirmation')

type MnemonicConfirmationProps = ViewProps & {
  mnemonicId: Address
  onConfirmComplete: () => void
}

const mnemonicConfirmationStyle: StyleProp<FlexProps> = {
  flex: 1,
  flexGrow: 1,
}

export function MnemonicConfirmation(props: MnemonicConfirmationProps): JSX.Element {
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const shouldShowSmallText = fullHeight < 700
  // Android only (ensures that Jetpack Compose mounts the view again
  // after navigating back in the stack navigator)
  // (see https://github.com/react-native-community/discussions-and-proposals/issues/446#issuecomment-2041254054)
  const { key } = useNativeComponentKey(isAndroid)

  return (
    <HiddenFromScreenReaders style={{ ...flexStyles.fill, marginHorizontal: spacing.spacing8 }}>
      <NativeMnemonicConfirmation
        key={key}
        selectedWordPlaceholder={t('onboarding.backup.manual.selectedWordPlaceholder')}
        shouldShowSmallText={shouldShowSmallText}
        style={mnemonicConfirmationStyle}
        {...props}
      />
    </HiddenFromScreenReaders>
  )
}
