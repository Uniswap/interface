import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, StyleSheet, ViewProps, requireNativeComponent } from 'react-native'
import { useNativeComponentKey } from 'src/app/hooks'
import { Flex, HiddenFromScreenReaders, Text, flexStyles } from 'ui/src'
import { GraduationCap } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { isAndroid } from 'utilities/src/platform'

type HeightMeasuredEvent = {
  height: number
}

interface NativeMnemonicDisplayProps {
  copyText: string
  copiedText: string
  mnemonicId: string
  onHeightMeasured: (event: NativeSyntheticEvent<HeightMeasuredEvent>) => void
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = ViewProps & Pick<NativeMnemonicDisplayProps, 'mnemonicId'>

export function MnemonicDisplay(props: MnemonicDisplayProps): JSX.Element {
  const { t } = useTranslation()
  const [height, setHeight] = useState(0)
  // Android only (ensures that Jetpack Compose mounts the view again
  // after navigating back in the stack navigator)
  // (see https://github.com/react-native-community/discussions-and-proposals/issues/446#issuecomment-2041254054)
  const { key } = useNativeComponentKey(isAndroid)

  return (
    <HiddenFromScreenReaders style={flexStyles.fill}>
      <NativeMnemonicDisplay
        key={key}
        copiedText={t('common.button.copied')}
        copyText={t('common.button.copy')}
        style={[styles.mnemonicDisplay, { maxHeight: height }]}
        onHeightMeasured={(e) => {
          // Round to limit state updates (was called with nearly the same value multiple times)
          setHeight(Math.round(e.nativeEvent.height))
        }}
        {...props}
      />

      <Flex
        row
        alignItems="center"
        backgroundColor="$surface2"
        borderRadius="$rounded16"
        // Hide the component rendered below the native mnemonic display
        // until the height is measured
        display={height ? 'flex' : 'none'}
        gap="$spacing8"
        p="$spacing16"
      >
        <GraduationCap color="$neutral2" size="$icon.20" />
        <Flex shrink>
          <Text color="$neutral2" variant="body4">
            {t('onboarding.backup.manual.banner')}
          </Text>
        </Flex>
      </Flex>
    </HiddenFromScreenReaders>
  )
}

const styles = StyleSheet.create({
  mnemonicDisplay: {
    // Set flex: 1 to prevent component from collapsing before it is measured
    flex: 1,
    marginBottom: spacing.spacing16,
  },
})
