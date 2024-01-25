import { ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Inset, Text, TouchableArea } from 'ui/src'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { SearchableRecipient } from 'wallet/src/features/address/types'

interface RecipientListProps {
  sections: SectionListData<SearchableRecipient>[]
  onPress: (recipient: string) => void
}

export function RecipientList({ onPress, sections }: RecipientListProps): JSX.Element {
  const renderItem = function ({ item }: ListRenderItemInfo<SearchableRecipient>): JSX.Element {
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} py="$spacing12">
        <RecipientRow recipient={item} onPress={onPress} />
      </AnimatedFlex>
    )
  }

  return (
    <SectionList
      ListFooterComponent={<Inset all="$spacing36" />}
      keyExtractor={key}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      renderItem={renderItem}
      renderSectionHeader={SectionHeader}
      sections={sections}
      showsVerticalScrollIndicator={false}
    />
  )
}

function SectionHeader(info: { section: SectionListData<SearchableRecipient> }): JSX.Element {
  return (
    <AnimatedFlex backgroundColor="$surface1" entering={FadeIn} exiting={FadeOut} py="$spacing8">
      <Text color="$neutral2" variant="subheading2">
        {info.section.title}
      </Text>
    </AnimatedFlex>
  )
}

function key(recipient: SearchableRecipient): string {
  return `recipient-${recipient.address}`
}

interface RecipientProps {
  recipient: SearchableRecipient
  onPress: (recipient: string) => void
}

export function RecipientRow({ recipient, onPress }: RecipientProps): JSX.Element {
  return (
    <TouchableArea hapticFeedback onPress={(): void => onPress(recipient.address)}>
      <AddressDisplay address={recipient.address} size={35} />
    </TouchableArea>
  )
}
