import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { AnimatedFlex, Inset } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { Text } from 'src/components/Text'

interface RecipientListProps {
  sections: SectionListData<SearchableRecipient>[]
  onPress: (recipient: string) => void
}

export function RecipientList({ onPress, sections }: RecipientListProps) {
  const renderItem = ({ item }: ListRenderItemInfo<SearchableRecipient>) => (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
      <RecipientRow recipient={item} onPress={onPress} />
    </AnimatedFlex>
  )

  return (
    <SectionList
      ItemSeparatorComponent={ItemSeparator}
      SectionSeparatorComponent={SectionSeparator}
      keyExtractor={key}
      keyboardShouldPersistTaps="always"
      renderItem={renderItem}
      renderSectionHeader={SectionHeader}
      sections={sections}
    />
  )
}

function SectionHeader(info: { section: SectionListData<SearchableRecipient> }) {
  return (
    <AnimatedFlex backgroundColor="background1" entering={FadeIn} exiting={FadeOut}>
      <Text color="textTertiary" variant="bodySmall">
        {info.section.title}
      </Text>
    </AnimatedFlex>
  )
}

function key(recipient: SearchableRecipient) {
  return `recipient-${recipient.address}`
}

interface RecipientProps {
  recipient: SearchableRecipient
  onPress: (recipient: string) => void
}

export function RecipientRow({ recipient, onPress }: RecipientProps) {
  return (
    <Button onPress={() => onPress(recipient.address)}>
      <AddressDisplay showAddressAsSubtitle address={recipient.address} size={35} />
    </Button>
  )
}

export function RecipientLoadingRow() {
  const { t } = useTranslation()
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="xs">
      <Text color="textTertiary" variant="bodySmall">
        {t('Search Results')}
      </Text>
      <Loading type="token" />
    </AnimatedFlex>
  )
}

function ItemSeparator() {
  return <Inset all="sm" />
}

function SectionSeparator() {
  return <Inset all="sm" />
}
