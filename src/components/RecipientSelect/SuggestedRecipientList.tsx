import React from 'react'
import { ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Inset } from 'src/components/layout'
import { Text } from 'src/components/Text'

interface SuggestedRecipientListProps {
  sections: SectionListData<string>[]
  onPress: (recipient: string) => void
}

export function SuggestedRecipientList({ onPress, sections }: SuggestedRecipientListProps) {
  const renderItem = ({ item }: ListRenderItemInfo<string>) => (
    <RecipientRow recipient={item} onPress={onPress} />
  )

  return (
    <SectionList
      ItemSeparatorComponent={ItemSeparator}
      SectionSeparatorComponent={SectionSeparator}
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionHeader}
      sections={sections}
    />
  )
}

function SectionHeader(info: { section: SectionListData<string> }) {
  return (
    <Text color="deprecated_gray400" variant="body2">
      {info.section.title}
    </Text>
  )
}

function key(recipient: string) {
  return `recipient-${recipient}`
}

interface RecipientProps {
  recipient: string
  onPress: (recipient: string) => void
}

export function RecipientRow({ recipient, onPress }: RecipientProps) {
  return (
    <Button onPress={() => onPress(recipient)}>
      <AddressDisplay alwaysShowAddress address={recipient} size={35} />
    </Button>
  )
}

export function ItemSeparator() {
  return <Inset all="sm" />
}

export function SectionSeparator() {
  return <Inset all="sm" />
}
