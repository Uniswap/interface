import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { RecipientScanModal } from 'src/components/RecipientSelect/RecipientScanModal'
import { Flex, flexStyles, Loader, Text, TouchableArea } from 'ui/src'
import { Scan, UserSearch } from 'ui/src/components/icons'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isIOS } from 'utilities/src/platform'
import { useFilteredRecipientSections } from 'wallet/src/components/RecipientSearch/hooks'
import { RecipientList } from 'wallet/src/components/RecipientSearch/RecipientList'
import { RecipientSelectSpeedBumps } from 'wallet/src/components/RecipientSearch/RecipientSelectSpeedBumps'
import { SearchBar } from 'wallet/src/features/search/SearchBar'

interface RecipientSelectProps {
  onSelectRecipient: (newRecipientAddress: string) => void
  onHideRecipientSelector: () => void
  recipient?: string
  focusInput?: boolean
  chainId?: UniverseChainId
  renderedInModal?: boolean
  hideBackButton?: boolean
}

function QRScannerIconButton({ onPress }: { onPress: () => void }): JSX.Element {
  return (
    <TouchableArea testID={TestID.SelectRecipient} onPress={onPress}>
      <Scan color="$neutral2" size="$icon.20" />
    </TouchableArea>
  )
}

function _RecipientSelect({
  onSelectRecipient,
  onHideRecipientSelector,
  recipient,
  focusInput,
  chainId,
  renderedInModal,
  hideBackButton,
}: RecipientSelectProps): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<TextInput>(null)

  const [pattern, setPattern] = useState('')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [checkSpeedBumps, setCheckSpeedBumps] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(recipient)
  const { sections, loading } = useFilteredRecipientSections(pattern)

  useEffect(() => {
    if (focusInput) {
      inputRef.current?.focus()
    } else {
      inputRef.current?.blur()
    }
  }, [focusInput])

  const onPressQRScanner = useCallback(() => {
    dismissNativeKeyboard()
    setShowQRScanner(true)
  }, [])

  const onCloseQRScanner = useCallback(() => {
    setShowQRScanner(false)
  }, [])

  const onSelect = useCallback((newRecipient: string) => {
    setSelectedRecipient(newRecipient)
    setCheckSpeedBumps(true)
  }, [])

  const onSpeedBumpConfirm = useCallback(() => {
    if (selectedRecipient) {
      onSelectRecipient(selectedRecipient)
    }
  }, [onSelectRecipient, selectedRecipient])

  return (
    <>
      <KeyboardAvoidingView behavior={isIOS ? 'padding' : 'height'} style={flexStyles.fill}>
        <Flex
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          flex={1}
          gap="$spacing16"
          pt="$spacing12"
          pb="$spacing60"
        >
          {!renderedInModal && (
            <Flex row>
              <Text testID={TestID.SendModalHeaderLabel} variant="subheading1">
                {t('send.recipient.header')}
              </Text>
            </Flex>
          )}
          <SearchBar
            ref={inputRef}
            backgroundColor="$surface2"
            endAdornment={<QRScannerIconButton onPress={onPressQRScanner} />}
            hideBackButton={hideBackButton}
            placeholder={t('send.recipient.input.placeholder')}
            value={pattern}
            onBack={recipient ? onHideRecipientSelector : undefined}
            onChangeText={setPattern}
          />
          {loading ? (
            <Loader.SearchResult />
          ) : !pattern && sections.length === 0 ? (
            <Flex centered flex={1} gap="$spacing16">
              <Flex alignItems="center" gap="$spacing8">
                <UserSearch color="$neutral3" size="$icon.32" />
                <Text alignSelf="stretch" color="$neutral3" textAlign="center" variant="body3">
                  {t('send.recipientSelect.search.empty')}
                </Text>
              </Flex>
              <TouchableArea
                centered
                backgroundColor="$surface3"
                borderRadius="$rounded12"
                px="$spacing12"
                py="$spacing8"
                onPress={onPressQRScanner}
              >
                <Text color="$neutral1" textAlign="center" variant="buttonLabel4">
                  {t('qrScanner.recipient.action.scan')}
                </Text>
              </TouchableArea>
            </Flex>
          ) : !sections.length ? (
            <Flex centered flex={1} gap="$spacing12">
              <Text variant="buttonLabel2">{t('send.recipient.results.empty')}</Text>
              <Text color="$neutral3" textAlign="center" variant="body1">
                {t('send.recipient.results.error')}
              </Text>
            </Flex>
          ) : (
            <RecipientList renderedInModal={renderedInModal} sections={sections} onPress={onSelect} />
          )}
        </Flex>
      </KeyboardAvoidingView>
      {showQRScanner && <RecipientScanModal onClose={onCloseQRScanner} onSelectRecipient={onSelect} />}
      <RecipientSelectSpeedBumps
        chainId={chainId}
        checkSpeedBumps={checkSpeedBumps}
        recipientAddress={selectedRecipient}
        setCheckSpeedBumps={setCheckSpeedBumps}
        onConfirm={onSpeedBumpConfirm}
      />
    </>
  )
}

export const RecipientSelect = memo(_RecipientSelect)
