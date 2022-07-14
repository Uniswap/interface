import { default as React, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { Flex } from 'src/components/layout'
import { filterRecipientByNameAndAddress } from 'src/components/RecipientSelect/filter'
import { useRecipients } from 'src/components/RecipientSelect/hooks'
import { RecipientList, RecipientLoadingRow } from 'src/components/RecipientSelect/RecipientList'
import { filterSections } from 'src/components/RecipientSelect/utils'
import { Text } from 'src/components/Text'

interface RecipientSelectProps {
  setRecipientAddress: (newRecipientAddress: string) => void
}

// TODO:
// - change search bar icon to pressable scan
// - add new address warning modal
export function RecipientSelect({ setRecipientAddress }: RecipientSelectProps) {
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
    <Flex px="md">
      <Flex>
        <Flex row alignItems="center" gap="sm">
          <SearchTextInput
            showBackButton
            placeholder={t('Input address or ENS')}
            value={pattern}
            onChangeText={onChangePattern}
          />
        </Flex>
        {loading && <RecipientLoadingRow />}
        {noResults ? (
          <Flex centered gap="sm" mt="lg" px="lg">
            <Text variant="mediumLabel">😔</Text>
            <Text variant="mediumLabel">{t('No results found')}</Text>
            <Text color="deprecated_gray200" textAlign="center" variant="body">
              {t('The address you typed either does not exist or is spelled incorrectly.')}
            </Text>
          </Flex>
        ) : (
          // Show either suggested recipients or filtered sections based on query
          <RecipientList
            sections={filteredSections.length === 0 ? sections : filteredSections}
            onPress={setRecipientAddress}
          />
        )}
      </Flex>
    </Flex>
  )
}
