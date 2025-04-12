import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { RecipientScanModal } from 'src/components/RecipientSelect/RecipientScanModal'
import { Flex, Loader, Text, TouchableArea, useSporeColors } from 'ui/src'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { RecipientList } from 'wallet/src/components/RecipientSearch/RecipientList'
import { RecipientSelectSpeedBumps } from 'wallet/src/components/RecipientSearch/RecipientSelectSpeedBumps'
import { useFilteredRecipientSections } from 'wallet/src/components/RecipientSearch/hooks'
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
  const colors = useSporeColors()

  return (
    <TouchableArea testID={TestID.SelectRecipient} onPress={onPress}>
      <ScanQRIcon color={colors.neutral2.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
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
  }, [setShowQRScanner])

  const onCloseQRScanner = useCallback(() => {
    setShowQRScanner(false)
  }, [setShowQRScanner])

  const onSelect = useCallback(
    (newRecipient: string) => {
      setSelectedRecipient(newRecipient)
      setCheckSpeedBumps(true)
    },
    [setSelectedRecipient],
  )

  const onSpeedBumpConfirm = useCallback(() => {
    if (selectedRecipient) {
      onSelectRecipient(selectedRecipient)
    }
  }, [onSelectRecipient, selectedRecipient])

  return (
    <>
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} flex={1} gap="$spacing16" mt="$spacing12">
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
          value={pattern ?? ''}
          onBack={recipient ? onHideRecipientSelector : undefined}
          onChangeText={setPattern}
        />
        {loading ? (
          <Loader.SearchResult />
        ) : !sections.length ? (
          <Flex centered gap="$spacing12" mt="$spacing24" px="$spacing24">
            <Text variant="buttonLabel2">{t('send.recipient.results.empty')}</Text>
            <Text color="$neutral3" textAlign="center" variant="body1">
              {t('send.recipient.results.error')}
            </Text>
          </Flex>
        ) : (
          <RecipientList renderedInModal={renderedInModal} sections={sections} onPress={onSelect} />
        )}
      </AnimatedFlex>
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
