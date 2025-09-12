import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, requireNativeComponent, StyleSheet, ViewProps } from 'react-native'
import { useNativeComponentKey } from 'src/app/hooks'
import { HiddenMnemonicWordView } from 'src/components/mnemonic/HiddenMnemonicWordView'
import { Flex, flexStyles, HiddenFromScreenReaders, Text } from 'ui/src'
import { GraduationCap } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { isAndroid } from 'utilities/src/platform'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

const EMPTY_MNEMONIC_EVENT = 'Empty mnemonic'

type HeightMeasuredEvent = {
  height: number
}

type EmptyMnemonicEvent = {
  mnemonicId: string
}

interface NativeMnemonicDisplayProps {
  copyText: string
  copiedText: string
  mnemonicId: string

  onHeightMeasured: (event: NativeSyntheticEvent<HeightMeasuredEvent>) => void
  onEmptyMnemonic: (event: NativeSyntheticEvent<EmptyMnemonicEvent>) => void
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = {
  showMnemonic?: boolean
  enableRevealButton?: boolean
  onMnemonicShown?: () => void
} & ViewProps &
  Pick<NativeMnemonicDisplayProps, 'mnemonicId'>

export function MnemonicDisplay({
  showMnemonic = true,
  enableRevealButton = false,
  onMnemonicShown,
  ...nativeComponentProps
}: MnemonicDisplayProps): JSX.Element {
  const { t } = useTranslation()
  const [height, setHeight] = useState(0)
  // Android only (ensures that Jetpack Compose mounts the view again
  // after navigating back in the stack navigator)
  // (see https://github.com/react-native-community/discussions-and-proposals/issues/446#issuecomment-2041254054)
  const { key } = useNativeComponentKey(isAndroid)

  const [revealPressed, setRevealPressed] = useState(false)
  const showMnemonicWithReveal = enableRevealButton ? revealPressed : showMnemonic

  const signerMnemonicAccounts = useSignerAccounts()
  const [keyringPrivateKeyAddresses, setKeyringPrivateKeyAddresses] = useState<string[]>([])
  const [keyringMnemonicIds, setKeyringMnemonicIds] = useState<string[]>([])

  useEffect(() => {
    Keyring.getMnemonicIds()
      .then(setKeyringMnemonicIds)
      .catch(() => {
        // no-op
      })
    Keyring.getAddressesForStoredPrivateKeys()
      .then(setKeyringPrivateKeyAddresses)
      .catch(() => {
        // no-op
      })
  }, [])

  return (
    <HiddenFromScreenReaders style={{ ...flexStyles.fill, paddingHorizontal: spacing.spacing8 }}>
      {showMnemonicWithReveal ? (
        <NativeMnemonicDisplay
          key={key}
          copiedText={t('common.button.copied')}
          copyText={t('common.button.copy')}
          style={[styles.mnemonicDisplay, { maxHeight: height }]}
          onHeightMeasured={(e) => {
            // Round to limit state updates (was called with nearly the same value multiple times)
            setHeight(Math.round(e.nativeEvent.height))
          }}
          onEmptyMnemonic={(e) => {
            logger.warn('MnemonicDisplay.tsx', 'onEmptyMnemonic', EMPTY_MNEMONIC_EVENT, {
              mnemonicId: e.nativeEvent.mnemonicId,
              keyringMnemonicIds,
              keyringPrivateKeyAddresses,
              signerMnemonicAccountAddresses: signerMnemonicAccounts.map((account) => account.address),
              signerMnemonicAccountMnemonicIds: signerMnemonicAccounts.map((account) => account.mnemonicId),
            })
          }}
          {...nativeComponentProps}
        />
      ) : (
        <Flex mb="$spacing12" onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}>
          <HiddenMnemonicWordView
            enableRevealButton={enableRevealButton}
            onRevealPress={() => {
              onMnemonicShown?.()
              setRevealPressed(true)
            }}
          />
        </Flex>
      )}
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
    marginBottom: spacing.spacing12,
  },
})
