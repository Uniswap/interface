import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { Autocomplete } from 'src/components/autocomplete/Autocomplete'
import { Flex } from 'src/components/layout'
import { filterRecipients } from 'src/components/RecipientSelect/filter'
import { useRecipients } from 'src/components/RecipientSelect/hooks'
import {
  RecipientRow,
  SuggestedRecipientList,
} from 'src/components/RecipientSelect/SuggestedRecipientList'
import { Text } from 'src/components/Text'

interface RecipientSelectProps {
  setRecipientAddress: (newRecipientAddress: string) => void
}

// TODO:
// - change search bar icon to pressable scan
// - add new address warning modal
export function RecipientSelect({ setRecipientAddress }: RecipientSelectProps) {
  const { t } = useTranslation()

  const { sections, searchableRecipientOptions, onChangePattern } = useRecipients()

  return (
    <Flex px="md">
      <Autocomplete
        EmptyComponent={
          <Flex centered gap="sm" mt="lg" px="lg">
            <Text variant="mediumLabel">😔</Text>
            <Text variant="mediumLabel">{t('No results found')}</Text>
            <Text color="deprecated_gray200" textAlign="center" variant="body">
              {t('The address you typed either does not exist or is spelled incorrectly.')}
            </Text>
          </Flex>
        }
        InitialComponent={
          <SuggestedRecipientList sections={sections} onPress={setRecipientAddress} />
        }
        filterOptions={filterRecipients}
        options={searchableRecipientOptions}
        placeholder={t('Input address or ENS')}
        renderOption={(info) => (
          <RecipientRow recipient={info.data} onPress={() => setRecipientAddress(info.data)} />
        )}
        onChangePattern={onChangePattern}
      />
    </Flex>
  )
}
