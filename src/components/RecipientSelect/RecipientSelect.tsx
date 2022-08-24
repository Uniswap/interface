import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { filterRecipientByNameAndAddress } from 'src/components/RecipientSelect/filter'
import { useRecipients } from 'src/components/RecipientSelect/hooks'
import { RecipientList, RecipientLoadingRow } from 'src/components/RecipientSelect/RecipientList'
import { filterSections } from 'src/components/RecipientSelect/utils'
import { Text } from 'src/components/Text'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'
import { QRScannerIconButton } from 'src/components/WalletConnect/QRScannerIconButton'

interface RecipientSelectProps {
  onSelectRecipient: (newRecipientAddress: string) => void
  onToggleShowRecipientSelector: () => void
}

export function RecipientSelect({
  onSelectRecipient,
  onToggleShowRecipientSelector,
}: RecipientSelectProps) {
  const { t } = useTranslation()
  const { sections, searchableRecipientOptions, pattern, onChangePattern, loading } =
    useRecipients()

  const filteredSections = useMemo(() => {
    const filteredAddresses = filterRecipientByNameAndAddress(
      pattern,
      searchableRecipientOptions
    ).map((item) => item.data.address)
    return filterSections(sections, filteredAddresses)
  }, [pattern, searchableRecipientOptions, sections])

  const noResults = pattern && pattern?.length > 0 && !loading && filteredSections.length === 0

  return (
    <Flex gap="sm" px="md" width="100%">
      <SearchBar
        autoFocus
        backgroundColor="backgroundContainer"
        endAdornment={<QRScannerIconButton size={20} />}
        placeholder={t('Search addresses or ENS names')}
        value={pattern ?? ''}
        onBack={onToggleShowRecipientSelector}
        onChangeText={onChangePattern}
      />
      {loading && <RecipientLoadingRow />}
      {noResults ? (
        <Flex centered gap="sm" mt="lg" px="lg">
          <Text variant="mediumLabel">😔</Text>
          <Text variant="mediumLabel">{t('No results found')}</Text>
          <Text color="textTertiary" textAlign="center" variant="body">
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
    </Flex>
  )
}
