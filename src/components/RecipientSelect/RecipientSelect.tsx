import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { QRScannerIconButton } from 'src/components/QRCodeScanner/QRScannerIconButton'
import { filterRecipientByNameAndAddress } from 'src/components/RecipientSelect/filter'
import { useRecipients } from 'src/components/RecipientSelect/hooks'
import { RecipientList, RecipientLoadingRow } from 'src/components/RecipientSelect/RecipientList'
import { RecipientScanModal } from 'src/components/RecipientSelect/RecipientScanModal'
import { filterSections } from 'src/components/RecipientSelect/utils'
import { Text } from 'src/components/Text'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'

interface RecipientSelectProps {
  onSelectRecipient: (newRecipientAddress: string) => void
  onToggleShowRecipientSelector: () => void
  recipient?: string
}

export function RecipientSelect({
  onSelectRecipient,
  onToggleShowRecipientSelector,
  recipient,
}: RecipientSelectProps) {
  const { t } = useTranslation()
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
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="sm" px="md" width="100%">
        <SearchBar
          autoFocus
          backgroundColor="backgroundContainer"
          endAdornment={<QRScannerIconButton size={20} onPress={onPressQRScanner} />}
          hideBackButton={!recipient}
          placeholder={t('Search addresses or ENS names')}
          value={pattern ?? ''}
          onBack={onToggleShowRecipientSelector}
          onChangeText={onChangePattern}
        />
        {loading && <RecipientLoadingRow />}
        {noResults ? (
          <Flex centered gap="sm" mt="lg" px="lg">
            <Text variant="buttonLabelMedium">😔</Text>
            <Text variant="buttonLabelMedium">{t('No results found')}</Text>
            <Text color="textTertiary" textAlign="center" variant="bodyLarge">
              {t('The address you typed either does not exist or is spelled incorrectly.')}
            </Text>
          </Flex>
        ) : (
          // Show either suggested recipients or filtered sections based on query
          <RecipientList
            sections={filteredSections.length === 0 ? sections : filteredSections}
            onPress={onSelectRecipient}
          />
        )}
      </AnimatedFlex>
      {showQRScanner && (
        <RecipientScanModal
          isVisible
          onClose={onCloseQRScanner}
          onSelectRecipient={onSelectRecipient}
        />
      )}
    </>
  )
}
