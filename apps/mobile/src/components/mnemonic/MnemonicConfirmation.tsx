import { isAndroid } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { requireNativeComponent, StyleProp, ViewProps } from 'react-native'
import { useNativeComponentKey } from 'src/app/hooks'
import { FlexProps, flexStyles, HiddenFromScreenReaders } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'

interface NativeMnemonicConfirmationProps {
  mnemonicId: Address
  shouldShowSmallText: boolean
  selectedWordPlaceholder: string
  onConfirmComplete: () => void
  pageStart?: number
  pageSize?: number
  currentPage?: number
  totalPages?: number
}

const NativeMnemonicConfirmation = requireNativeComponent<NativeMnemonicConfirmationProps>('MnemonicConfirmation')

type MnemonicConfirmationProps = ViewProps & {
  mnemonicId: Address
  onConfirmComplete: () => void
  pageStart?: number
  pageSize?: number
  currentPage?: number
  totalPages?: number
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

  // Re-mount the native view when the page slice changes so it picks up a fresh
  // shuffled bank and clears any prior taps. Compatible with both platforms.
  const pageKey = `${key}-${props.pageStart ?? 0}-${props.pageSize ?? 0}`

  return (
    <HiddenFromScreenReaders style={{ ...flexStyles.fill, marginHorizontal: spacing.spacing8 }}>
      <NativeMnemonicConfirmation
        key={pageKey}
        selectedWordPlaceholder={t('onboarding.backup.manual.selectedWordPlaceholder')}
        shouldShowSmallText={shouldShowSmallText}
        style={mnemonicConfirmationStyle}
        {...props}
      />
    </HiddenFromScreenReaders>
  )
}
