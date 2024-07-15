import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { RecipientScanModal } from 'src/components/RecipientSelect/RecipientScanModal'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { RecipientList } from 'wallet/src/components/RecipientSearch/RecipientList'
import { useFilteredRecipientSections } from 'wallet/src/components/RecipientSearch/hooks'
import { SearchBar } from 'wallet/src/features/search/SearchBar'

interface RecipientSelectProps {
  onSelectRecipient: (newRecipientAddress: string) => void
  onHideRecipientSelector: () => void
  recipient?: string
  focusInput?: boolean
}

function QRScannerIconButton({ onPress }: { onPress: () => void }): JSX.Element {
  const colors = useSporeColors()

  return (
    <TouchableArea hapticFeedback testID={TestID.SelectRecipient} onPress={onPress}>
      <ScanQRIcon color={colors.neutral2.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
    </TouchableArea>
  )
}

export function _RecipientSelect({
  onSelectRecipient,
  onHideRecipientSelector,
  recipient,
  focusInput,
}: RecipientSelectProps): JSX.Element {
  const { t } = useTranslation()
  const { isSheetReady } = useBottomSheetContext()
  const inputRef = useRef<TextInput>(null)

  const [pattern, setPattern] = useState('')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const sections = useFilteredRecipientSections(pattern)

  useEffect(() => {
    if (focusInput) {
      inputRef.current?.focus()
    } else {
      inputRef.current?.blur()
    }
  }, [focusInput])

  const onPressQRScanner = useCallback(() => {
    Keyboard.dismiss()
    setShowQRScanner(true)
  }, [setShowQRScanner])

  const onCloseQRScanner = useCallback(() => {
    setShowQRScanner(false)
  }, [setShowQRScanner])

  return (
    <>
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} flex={1} gap="$spacing12" mt="$spacing16" px="$spacing24">
        <Flex row>
          <Text variant="subheading1">{t('qrScanner.recipient.label.send')}</Text>
        </Flex>
        <SearchBar
          ref={inputRef}
          backgroundColor="$surface2"
          endAdornment={<QRScannerIconButton onPress={onPressQRScanner} />}
          placeholder={t('qrScanner.recipient.input.placeholder')}
          value={pattern ?? ''}
          onBack={recipient ? onHideRecipientSelector : undefined}
          onChangeText={setPattern}
          onDismiss={() => Keyboard.dismiss()}
        />
        {!sections.length ? (
          <Flex centered gap="$spacing12" mt="$spacing24" px="$spacing24">
            <Text variant="buttonLabel2">{t('qrScanner.recipient.results.empty')}</Text>
            <Text color="$neutral3" textAlign="center" variant="body1">
              {t('qrScanner.recipient.results.error')}
            </Text>
          </Flex>
        ) : (
          // Show either suggested recipients or filtered sections based on query
          isSheetReady && <RecipientList renderedInModal sections={sections} onPress={onSelectRecipient} />
        )}
      </AnimatedFlex>
      {showQRScanner && <RecipientScanModal onClose={onCloseQRScanner} onSelectRecipient={onSelectRecipient} />}
    </>
  )
}

export const RecipientSelect = memo(_RecipientSelect)
