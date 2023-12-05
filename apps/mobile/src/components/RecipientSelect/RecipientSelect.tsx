import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { filterRecipientByNameAndAddress } from 'src/components/RecipientSelect/filter'
import { useRecipients } from 'src/components/RecipientSelect/hooks'
import { RecipientList } from 'src/components/RecipientSelect/RecipientList'
import { RecipientScanModal } from 'src/components/RecipientSelect/RecipientScanModal'
import { filterSections } from 'src/components/RecipientSelect/utils'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'
import { ElementName } from 'src/features/telemetry/constants'
import { AnimatedFlex, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { iconSizes } from 'ui/src/theme'

interface RecipientSelectProps {
  onSelectRecipient: (newRecipientAddress: string) => void
  onToggleShowRecipientSelector: () => void
  recipient?: string
}

function QRScannerIconButton({ onPress }: { onPress: () => void }): JSX.Element {
  const colors = useSporeColors()

  return (
    <TouchableArea hapticFeedback testID={ElementName.SelectRecipient} onPress={onPress}>
      <ScanQRIcon
        color={colors.neutral2.get()}
        height={iconSizes.icon20}
        width={iconSizes.icon20}
      />
    </TouchableArea>
  )
}

export function _RecipientSelect({
  onSelectRecipient,
  onToggleShowRecipientSelector,
  recipient,
}: RecipientSelectProps): JSX.Element {
  const { t } = useTranslation()
  const { isSheetReady } = useBottomSheetContext()

  const [showQRScanner, setShowQRScanner] = useState(false)
  const { sections, searchableRecipientOptions, pattern, onChangePattern, loading } =
    useRecipients()

  const filteredSections = useMemo(() => {
    const filteredAddresses = filterRecipientByNameAndAddress(
      pattern,
      searchableRecipientOptions
    ).map((item) => item.data.address)
    return filterSections(sections, filteredAddresses)
  }, [pattern, searchableRecipientOptions, sections])

  const onPressQRScanner = useCallback(() => {
    Keyboard.dismiss()
    setShowQRScanner(true)
  }, [setShowQRScanner])

  const onCloseQRScanner = useCallback(() => {
    setShowQRScanner(false)
  }, [setShowQRScanner])

  const noResults = pattern && pattern?.length > 0 && !loading && filteredSections.length === 0

  return (
    <>
      <AnimatedFlex
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing12"
        mt="$spacing16"
        px="$spacing24"
        width="100%">
        <Flex row>
          <Text variant="subheading1">{t('Send')}</Text>
        </Flex>
        <SearchBar
          autoFocus
          backgroundColor="$surface2"
          endAdornment={<QRScannerIconButton onPress={onPressQRScanner} />}
          placeholder={t('Search ENS or address')}
          value={pattern ?? ''}
          onBack={recipient ? onToggleShowRecipientSelector : undefined}
          onChangeText={onChangePattern}
        />
        {noResults ? (
          <Flex centered gap="$spacing12" mt="$spacing24" px="$spacing24">
            <Text variant="buttonLabel2">{t('No results found')}</Text>
            <Text color="$neutral3" textAlign="center" variant="body1">
              {t('The address you typed either does not exist or is spelled incorrectly.')}
            </Text>
          </Flex>
        ) : (
          // Show either suggested recipients or filtered sections based on query
          isSheetReady && (
            <RecipientList
              sections={filteredSections.length === 0 ? sections : filteredSections}
              onPress={onSelectRecipient}
            />
          )
        )}
      </AnimatedFlex>
      {showQRScanner && (
        <RecipientScanModal onClose={onCloseQRScanner} onSelectRecipient={onSelectRecipient} />
      )}
    </>
  )
}

export const RecipientSelect = memo(_RecipientSelect)
